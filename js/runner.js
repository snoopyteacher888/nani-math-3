/*
 * 跑酷（第 1 單元這類「不用計算、要看清楚」的題目）
 *
 * 玩法：小橘往前跑，前面有三扇門（三條跑道），每扇門上寫一個答案。
 * 按下面的答案按鈕（或點跑道）換到那條跑道，跑進正確的門就得分。
 * 選好後再按一次同一個按鈕可以衝刺，越早衝刺分數越多。
 * 答錯會扣一顆愛心、看提示，這題等一下會再出現。
 */
(function () {
  'use strict';

  var App = window.App, store = App.store, save = App.save, $ = App.$, esc = App.esc,
      speak = App.speak, SFX = App.SFX, show = App.show, hide = App.hide, STAGES = App.STAGES;
  var ROUND = 10;           // 每局新題目數（答錯的會再加回來）
  var HEARTS = 5;
  var SPEEDS = { slow: { name: '🐢 慢慢跑', f: 1.6 }, normal: { name: '🐇 一般', f: 1 }, fast: { name: '🐆 挑戰', f: 0.6 } };
  var LANE_COLORS = ['#E35D4F', '#E99A1E', '#3C8DD9'];
  var FONT = '"LXGW WenKai TC", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

  /* ---------- 選速度 ---------- */
  var pendingStage = null;
  function openSpeed(s) {
    pendingStage = s.id;
    $('speed-title').textContent = '關卡 ' + s.id + '　' + s.name;
    $('speed-desc').textContent = s.desc;
    document.querySelectorAll('.speed').forEach(function (b) { b.classList.toggle('last', b.dataset.speed === (store.speed || 'slow')); });
    show('ov-speed');
    speak('關卡' + s.name + '。選一個速度。');
  }
  document.querySelectorAll('.speed').forEach(function (b) {
    b.onclick = function () { store.speed = b.dataset.speed; save(); hide('ov-speed'); startGame(pendingStage, b.dataset.speed); };
  });
  $('ov-speed').querySelector('[data-close]').onclick = function () { hide('ov-speed'); };
  App.modes.run = { open: openSpeed };

  /* =====================================================
   * 遊戲狀態
   * ===================================================== */
  var G = null;
  var cv = $('cv'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1;

  function startGame(id, speedKey) {
    var s = STAGES[id];
    G = {
      stage: s, speedKey: speedKey, T: s.time * SPEEDS[speedKey].f,
      newCount: 0, retry: [], hearts: HEARTS, score: 0, combo: 0, wrong: 0, wrongList: [],
      q: null, tRemain: 0, chosen: null, laneY: 1, dashing: false, dashBonus: 0,
      phase: 'run', phaseT: 0, result: null, scroll: 0, runT: 0, particles: [], floats: [], gateX: 0
    };
    App.showScreen('game');
    $('hud-stage').textContent = s.id + ' ' + s.name + '・' + SPEEDS[speedKey].name;
    resize();
    nextQuestion();
    lastT = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function nextQuestion() {
    var due = G.retry.findIndex(function (r) { return r.due <= G.newCount; });
    if (G.newCount >= ROUND && G.retry.length === 0) return finish(true);
    var q;
    if (due >= 0 && (G.newCount >= ROUND || Math.random() < .8)) {
      q = G.retry.splice(due, 1)[0].q;
      q.options = q.options.slice().sort(function () { return Math.random() - .5; }); // 換個位置
      q.again = true;
    } else if (G.newCount < ROUND) {
      q = G.stage.gen(); G.newCount++;
    } else { // 只剩還沒到時間的重練題
      q = G.retry.shift().q; q.again = true;
    }
    G.q = q; G.tRemain = G.T; G.chosen = null; G.dashing = false; G.dashBonus = 0;
    G.phase = 'run'; G.phaseT = 0; G.result = null;
    renderQuestion();
    if (store.autoSay) speak(q.say);
  }

  function renderQuestion() {
    var q = G.q;
    $('q-text').textContent = (q.again ? '🔁 ' : '') + q.text;
    $('q-big').hidden = !q.big; $('q-big').textContent = q.big || '';
    var vis = $('q-visual');
    vis.hidden = !q.visual; vis.innerHTML = q.visual || ''; vis.classList.toggle('wide', !!q.wide);
    document.querySelectorAll('.ans').forEach(function (b, i) {
      b.querySelector('.txt').textContent = q.options[i];
      b.className = 'ans' + (q.cls === 'zh' ? ' zh' : '');
      b.disabled = false;
    });
    renderHud();
  }

  function renderHud() {
    var h = '';
    for (var i = 0; i < HEARTS; i++) h += '<span' + (i < G.hearts ? '' : ' class="off"') + '>❤️</span>';
    $('hearts').innerHTML = h;
    $('score').textContent = G.score;
    var left = (ROUND - G.newCount) + G.retry.length + (G.phase === 'run' ? 1 : 0);
    $('hud-left').textContent = '還有 ' + left + ' 題';
    var c = $('combo'); c.hidden = G.combo < 2; c.textContent = '🔥' + G.combo;
  }

  /* ---------- 操作 ---------- */
  function choose(lane) {
    if (!G || G.phase !== 'run') return;
    if (G.chosen === lane) { // 再按一次：衝刺
      if (!G.dashing) {
        G.dashing = true;
        G.dashBonus = Math.max(1, Math.round(10 * G.tRemain / G.T));
        SFX.dash();
      }
      return;
    }
    if (G.dashing) return; // 衝刺中不能換
    G.chosen = lane; SFX.pick();
    document.querySelectorAll('.ans').forEach(function (b, i) { b.classList.toggle('sel', i === lane); });
  }
  document.querySelectorAll('.ans').forEach(function (b) {
    b.addEventListener('click', function () { choose(+b.dataset.lane); });
  });
  cv.addEventListener('pointerdown', function (e) {
    if (!G || G.phase !== 'run') return;
    var r = cv.getBoundingClientRect(), y = e.clientY - r.top, L = lanes();
    for (var i = 0; i < 3; i++) if (y >= L.top + L.h * i && y < L.top + L.h * (i + 1)) choose(i);
  });
  document.addEventListener('keydown', function (e) {
    if (!G || $('game').hidden) return;
    if (!$('ov-pause').hidden || !$('ov-end').hidden) return;
    if (!$('ov-explain').hidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('ex-next').click(); } return; }
    var k = e.key;
    if (k === '1' || k === '2' || k === '3') choose(+k - 1);
    else if (k === 'ArrowUp' || k === 'ArrowDown') {
      e.preventDefault();
      var cur = G.chosen == null ? 1 : G.chosen;
      choose(Math.max(0, Math.min(2, cur + (k === 'ArrowUp' ? -1 : 1))));
    } else if ((k === 'Enter' || k === ' ') && G.chosen != null) { e.preventDefault(); choose(G.chosen); }
    else if (k === 'Escape') pause();
  });
  $('q-say').onclick = function () { if (G && G.q) speak(G.q.say); };

  /* ---------- 判斷對錯 ---------- */
  function resolve() {
    var q = G.q, correctLane = q.options.indexOf(q.answer), ok = G.chosen === correctLane;
    G.result = { ok: ok, correctLane: correctLane, chosen: G.chosen };
    var btns = document.querySelectorAll('.ans');
    btns.forEach(function (b, i) {
      b.disabled = true;
      b.classList.remove('sel');
      if (i === correctLane) b.classList.add('right');
      else if (i === G.chosen) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    if (ok) {
      G.combo++;
      var pts = 10 + Math.min(G.combo - 1, 5) * 2 + (G.dashing ? G.dashBonus : 0);
      G.score += pts;
      G.phase = 'pass'; G.phaseT = 0;
      burst(charX(), laneCenter(G.chosen), 26);
      G.floats.push({ x: charX() + 30, y: laneCenter(G.chosen) - 30, t: 0, text: '+' + pts + (G.combo >= 3 ? ' 🔥' : '') });
      SFX.good();
    } else {
      G.combo = 0; G.hearts--; G.wrong++;
      G.wrongList.push(q);
      G.retry.push({ q: q, due: G.newCount + 2 });
      G.phase = 'crash'; G.phaseT = 0;
      SFX.bad();
    }
    renderHud();
  }

  function showExplain() {
    var q = G.q;
    $('ex-title').textContent = G.result.chosen == null ? '時間到囉！' : '差一點！';
    $('ex-q').textContent = q.text + (q.big ? '　' + q.big : '');
    $('ex-ans').textContent = q.answer;
    $('ex-hint').textContent = q.hint;
    $('ex-work').innerHTML = q.explain || '';
    show('ov-explain');
    speak((G.result.chosen == null ? '時間到囉。' : '差一點。') + '正確答案是' + q.answer + '。' + q.hint);
  }
  $('ex-say').onclick = function () { if (G) speak('正確答案是' + G.q.answer + '。' + G.q.hint); };
  $('ex-next').onclick = function () {
    hide('ov-explain');
    if (G.hearts <= 0) finish(false); else nextQuestion();
  };

  function finish(done) {
    G.phase = 'end';
    var stars = !done ? 0 : G.wrong <= 1 ? 3 : G.wrong <= 3 ? 2 : 1, r = { rec: App.store.stages[G.stage.id] || {}, isRecord: false };
    if (done) r = App.saveResult(G.stage.id, stars, G.score);
    var title = !done ? '愛心用完了，休息一下再挑戰！' : stars === 3 ? '太厲害了！' : stars === 2 ? '很棒喔！' : '完成了！再試試拿更多星星！';
    var rv = '';
    if (G.wrongList.length) {
      var seen = {};
      rv = '<h3>📝 這次答錯的題目</h3><ul>' + G.wrongList.filter(function (q) { var k = (q.review || q.text) + q.big; if (seen[k]) return false; seen[k] = 1; return true; })
        .map(function (q) { return '<li>' + esc(q.review || q.text) + (q.big ? '　' + esc(q.big) : '') + ' → <b>' + esc(q.answer) + '</b></li>'; }).join('') + '</ul>';
    }
    var id = G.stage.id, sp = G.speedKey;
    App.showEnd({
      stars: stars, title: title, scoreHTML: '得到 <b>' + G.score + '</b> 分', isRecord: done && r.isRecord,
      bestText: r.rec.best ? '這關最高紀錄：' + r.rec.best + ' 分' : '', reviewHTML: rv,
      again: function () { startGame(id, sp); }, say: done ? title + '得到' + G.score + '分。' : title
    });
  }

  /* ---------- 暫停 ---------- */
  var pausedPhase = null;
  function pause() {
    if (!G || G.phase === 'end' || G.phase === 'paused' || !$('ov-explain').hidden) return;
    pausedPhase = G.phase; G.phase = 'paused';
    var id = G.stage.id, sp = G.speedKey;
    App.pause({
      resume: function () { G.phase = pausedPhase; lastT = 0; },
      restart: function () { startGame(id, sp); },
      quit: function () { G = null; }
    });
  }
  $('btn-pause').onclick = pause;
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.phase === 'run' && !$('game').hidden) pause(); });

  /* =====================================================
   * 畫面（canvas）
   * ===================================================== */
  function resize() {
    var r = $('track').getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  if (window.ResizeObserver) new ResizeObserver(function () { if (G) resize(); }).observe($('track'));
  window.addEventListener('resize', function () { if (G) resize(); });

  function lanes() { var top = Math.max(H * .3, 40), h = (H - top - 6) / 3; return { top: top, h: h }; }
  function laneCenter(i) { var L = lanes(); return L.top + L.h * (i + .5); }
  function charX() { return Math.max(56, Math.min(W * .15, 150)); }
  function runPx() { return Math.max(170, Math.min(W * .3, 340)); } // 每秒跑幾 px
  function gateW() { return Math.max(110, Math.min(W * .25, 240)); }

  var raf = 0, lastT = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!G || $('game').hidden) { cancelAnimationFrame(raf); raf = 0; return; }
    var dt = lastT ? Math.min((t - lastT) / 1000, .05) : 0; lastT = t;
    update(dt); draw();
  }

  function update(dt) {
    if (G.phase === 'paused' || G.phase === 'end' || G.phase === 'explain') return;
    var speed = runPx() * (G.dashing ? 6 : 1);
    var target = G.chosen == null ? 1 : G.chosen;
    G.laneY += (target - G.laneY) * Math.min(1, dt * 12);

    if (G.phase === 'run') {
      G.tRemain -= dt * (G.dashing ? 6 : 1);
      G.gateX = charX() + 22 + Math.max(0, G.tRemain) * runPx();
      G.scroll += speed * dt; G.runT += dt * (G.dashing ? 3 : 1);
      if (G.tRemain <= 0) resolve();
    } else if (G.phase === 'pass') { // 穿過門
      G.phaseT += dt; G.gateX -= runPx() * 1.6 * dt; G.scroll += runPx() * 1.6 * dt; G.runT += dt * 1.5;
      if (G.phaseT > .75) nextQuestion();
    } else if (G.phase === 'crash') {
      G.phaseT += dt;
      if (G.phaseT > .8) { G.phase = 'explain'; showExplain(); }
    }
    $('dist-fill').style.width = (G.phase === 'run' ? (1 - Math.max(0, G.tRemain) / G.T) * 100 : 100) + '%';

    G.particles.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; });
    G.particles = G.particles.filter(function (p) { return p.t < p.life; });
    G.floats.forEach(function (f) { f.t += dt; f.y -= 40 * dt; });
    G.floats = G.floats.filter(function (f) { return f.t < 1.1; });
  }

  function burst(x, y, n) {
    var colors = ['#FFD54A', '#FF8A3D', '#5BD18B', '#6FB7FF', '#FF6FA8'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      G.particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, t: 0, life: .7 + Math.random() * .4, c: colors[i % colors.length], s: 4 + Math.random() * 5 });
    }
  }

  function draw() {
    var L = lanes();
    // 天空
    var sky = ctx.createLinearGradient(0, 0, 0, L.top);
    sky.addColorStop(0, '#BFE3F5'); sky.addColorStop(1, '#EAF6FB');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, L.top + 2);
    // 太陽
    ctx.fillStyle = '#FFD86B'; ctx.beginPath(); ctx.arc(W - 50, Math.min(40, L.top * .45), 18, 0, 7); ctx.fill();
    // 雲
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    for (var c = 0; c < 4; c++) {
      var cx = ((c * 260 - G.scroll * .08) % (W + 260) + W + 260) % (W + 260) - 120, cy = 18 + (c % 2) * 16;
      if (cy > L.top - 20) continue;
      cloud(cx, cy);
    }
    // 山丘
    ctx.fillStyle = '#A9D98C';
    ctx.beginPath(); ctx.moveTo(0, L.top);
    for (var x = 0; x <= W + 10; x += 10) {
      var wx = x + G.scroll * .25;
      ctx.lineTo(x, L.top - 10 - Math.max(0, Math.sin(wx / 90) * 18 + Math.sin(wx / 37) * 6 + 10));
    }
    ctx.lineTo(W, L.top); ctx.closePath(); ctx.fill();

    // 跑道
    var laneFill = ['#F6DDB5', '#F2D3A2', '#EEC98F'];
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = laneFill[i]; ctx.fillRect(0, L.top + L.h * i, W, L.h + 1);
      ctx.fillStyle = LANE_COLORS[i]; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.arc(14, L.top + L.h * (i + .5), 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#C79B62'; ctx.fillRect(0, L.top, W, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = G.scroll % 40;
    for (var j = 1; j < 3; j++) { ctx.beginPath(); ctx.moveTo(0, L.top + L.h * j); ctx.lineTo(W, L.top + L.h * j); ctx.stroke(); }
    ctx.setLineDash([]);
    // 地上的小石頭（看得出在跑）
    ctx.fillStyle = 'rgba(150,110,60,.35)';
    for (var k = 0; k < 12; k++) {
      var sx = ((k * 137 - G.scroll) % (W + 40) + W + 40) % (W + 40) - 20;
      ctx.beginPath(); ctx.ellipse(sx, L.top + 10 + ((k * 53) % (L.h * 3 - 20)), 4, 2, 0, 0, 7); ctx.fill();
    }

    if (G.q && G.gateX < W + 20) drawGate(G.gateX, L);

    // 主角
    var cy = laneCenter(G.laneY), size = Math.min(L.h * .78, 70);
    if (G.phase === 'crash') {
      var p = Math.min(1, G.phaseT / .3);
      drawRunner(charX() - p * 26, cy - Math.sin(p * Math.PI) * 18, size, true);
    } else drawRunner(charX(), cy, size, false);

    // 粒子
    G.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c;
      star(p.x, p.y, p.s); ctx.fill();
    });
    ctx.globalAlpha = 1;
    G.floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
      ctx.font = '700 28px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = '#2D8A57'; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    if (G.dashing && G.phase === 'run') speedLines(L);
  }

  function cloud(x, y) {
    ctx.beginPath(); ctx.arc(x, y + 8, 14, 0, 7); ctx.arc(x + 18, y, 18, 0, 7); ctx.arc(x + 40, y + 8, 14, 0, 7); ctx.fill();
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function speedLines(L) {
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
    for (var i = 0; i < 8; i++) {
      var y = L.top + ((i * 71 + G.scroll * .3) % (L.h * 3)), x = (i * 211 + G.scroll * 2) % W;
      ctx.beginPath(); ctx.moveTo(W - x, y); ctx.lineTo(W - x - 60, y); ctx.stroke();
    }
  }

  function drawGate(x, L) {
    var gw = gateW(), q = G.q, res = G.result;
    for (var i = 0; i < 3; i++) {
      var y = L.top + L.h * i, pad = Math.max(4, L.h * .08), h = L.h - pad * 2, col = LANE_COLORS[i];
      var state = !res ? '' : i === res.correctLane ? 'right' : i === res.chosen ? 'wrong' : 'dim';
      if (state === 'right') col = '#2D8A57'; else if (state === 'wrong') col = '#D9483B';
      ctx.globalAlpha = state === 'dim' ? .4 : 1;
      // 門框
      ctx.fillStyle = col; roundRect(x, y + pad, gw, h, 14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.94)'; roundRect(x + 6, y + pad + 6, gw - 12, h - 12, 10); ctx.fill();
      // 文字
      var text = q.options[i], fs = Math.min(h * .55, 40);
      ctx.font = '700 ' + fs + 'px ' + FONT;
      while (ctx.measureText(text).width > gw - 24 && fs > 12) { fs -= 2; ctx.font = '700 ' + fs + 'px ' + FONT; }
      ctx.fillStyle = state === 'right' ? '#2D8A57' : state === 'wrong' ? '#D9483B' : '#2B2A28';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + gw / 2, y + L.h / 2 + 1);
      if (state === 'wrong') { ctx.font = '700 ' + Math.min(h * .5, 34) + 'px ' + FONT; ctx.fillText('✖', x + gw - 18, y + pad + 18); }
      if (state === 'right') { ctx.font = '700 ' + Math.min(h * .5, 34) + 'px ' + FONT; ctx.fillText('✔', x + gw - 18, y + pad + 18); }
      ctx.globalAlpha = 1;
    }
  }

  /* 小橘：圓滾滾的跑步小狐狸（自己畫，不用圖檔） */
  function drawRunner(x, y, s, hurt) {
    var t = G.runT * 14, r = s * .42, moving = G.phase === 'run' || G.phase === 'pass';
    var bob = moving ? Math.abs(Math.sin(t)) * s * .08 : 0;
    ctx.save(); ctx.translate(x, y - bob);
    if (hurt) ctx.rotate(-.35);
    // 影子
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, r + s * .12 + bob, r * .9, s * .07, 0, 0, 7); ctx.fill();
    // 腳
    ctx.strokeStyle = '#7A3F12'; ctx.lineWidth = Math.max(3, s * .08); ctx.lineCap = 'round';
    var sw = moving ? Math.sin(t) * .8 : 0;
    [sw, -sw].forEach(function (a, i) {
      ctx.beginPath(); ctx.moveTo(i ? -r * .3 : r * .3, r * .6);
      ctx.lineTo((i ? -r * .3 : r * .3) + Math.sin(a) * r * .7, r * .6 + Math.cos(a) * r * .6); ctx.stroke();
    });
    // 尾巴
    ctx.fillStyle = '#F08A3C';
    ctx.beginPath(); ctx.ellipse(-r * 1.05, -r * .05 + Math.sin(t * .5) * 3, r * .55, r * .28, -.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFF4E6'; ctx.beginPath(); ctx.ellipse(-r * 1.45, -r * .3 + Math.sin(t * .5) * 3, r * .18, r * .14, -.5, 0, 7); ctx.fill();
    // 耳朵
    ctx.fillStyle = '#F08A3C';
    [[-.45, -1.25], [.35, -1.3]].forEach(function (e) {
      ctx.beginPath(); ctx.moveTo(r * (e[0] - .28), -r * .6); ctx.lineTo(r * e[0], r * e[1]); ctx.lineTo(r * (e[0] + .3), -r * .65); ctx.closePath(); ctx.fill();
    });
    // 身體
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFF4E6'; ctx.beginPath(); ctx.ellipse(r * .25, r * .35, r * .55, r * .48, 0, 0, 7); ctx.fill();
    // 頭帶（數學藍）
    ctx.strokeStyle = '#2A63A8'; ctx.lineWidth = Math.max(3, r * .18);
    ctx.beginPath(); ctx.arc(0, 0, r * .92, -2.6, -.55); ctx.stroke();
    // 眼睛
    if (hurt) {
      ctx.strokeStyle = '#2B2A28'; ctx.lineWidth = 2.5;
      [[.15, -.2], [.6, -.2]].forEach(function (e) {
        ctx.beginPath(); ctx.moveTo(r * e[0] - 4, r * e[1] - 4); ctx.lineTo(r * e[0] + 4, r * e[1] + 4);
        ctx.moveTo(r * e[0] + 4, r * e[1] - 4); ctx.lineTo(r * e[0] - 4, r * e[1] + 4); ctx.stroke();
      });
    } else {
      ctx.fillStyle = '#2B2A28';
      ctx.beginPath(); ctx.arc(r * .18, -r * .18, r * .11, 0, 7); ctx.arc(r * .62, -r * .18, r * .11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(r * .21, -r * .22, r * .04, 0, 7); ctx.arc(r * .65, -r * .22, r * .04, 0, 7); ctx.fill();
    }
    // 鼻子、臉頰
    ctx.fillStyle = '#2B2A28'; ctx.beginPath(); ctx.arc(r * .95, r * .02, r * .09, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,120,.55)'; ctx.beginPath(); ctx.arc(r * .7, r * .15, r * .1, 0, 7); ctx.fill();
    ctx.restore();
    if (hurt) { // 頭上轉圈圈的星星
      ctx.fillStyle = '#FFC93C';
      for (var i = 0; i < 3; i++) { var a = G.phaseT * 8 + i * 2.1; star(x + Math.cos(a) * r, y - r * 1.4 + Math.sin(a) * r * .3, 6); ctx.fill(); }
    }
  }

  if (/[?&]debug\b/.test(location.search)) window.__peek = function () { return G; }; // 測試用
})();
