/*
 * 🏃 跑酷（第 1 單元這類「不用計算、要看清楚」的題目）
 *
 * 直向畫面：小橘從下面往上跑，左右換跑道。
 *   🪙 金幣：吃到 +1
 *   🪨 障礙物（石頭、三角錐、木箱）：撞到就停下來答一題，不限時間；答對 +10 金幣（連對再多），答錯看說明
 *   🚧 柵欄：太久沒撞到障礙物會出現，擋住整條路，一定要答題才能過（遊戲才會結束）
 * 撞到 10 個障礙物（答完 10 題）跑到終點就結束；題目是開始時從題庫隨機挑出的 10 題，不重複。
 * 開始和每次答完題都會倒數 3、2、1。
 * 操作：手機版用手指左右滑；網頁版 ◀ ▶ 按鈕、鍵盤 ← →（A、D）。點畫面左半邊／右半邊也可以。
 */
(function () {
  'use strict';

  var App = window.App, store = App.store, save = App.save, $ = App.$, esc = App.esc,
      speak = App.speak, SFX = App.SFX, show = App.show, hide = App.hide, STAGES = App.STAGES;
  var ROUND = 10;                 // 一局撞 10 個障礙物＝答 10 題
  var BANK = 150;                 // 題庫：開始時先出這麼多題（不重複），再從選的難度裡隨機挑 10 題
  /* obs：每一排出現障礙物的機會（老師說太多，調少）；fence：幾秒沒撞到就放柵欄 */
  /* 速度大家都一樣（老師要求）；選的是題目難度。f：跑多快、obs：障礙物多寡、fence：幾秒沒撞到就放柵欄 */
  var SPEED = { f: .5, obs: .2, fence: 13 };
  var LEVELS = { 1: '🌱 初階', 2: '🌿 中階', 3: '🌳 進階' };
  var BASE_FONT = '"LXGW WenKai TC", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  function FONTF() { return (App.store.zhuyin ? "'Bpmf Zihi Kai Std', " : '') + BASE_FONT; }

  /* ---------- 說明（一頁一小塊遊戲畫面）＋選速度 ---------- */
  var IMG = 'images/tutorial/';
  function slides() {
    var web = App.device === 'web';
    return [
      { img: IMG + (web ? 'run-1w.webp' : 'run-1.webp'), text: web ? '小橘會一直往上跑。按鍵盤的 ← →，或按下面的「左」「右」，換跑道。' : '小橘會一直往上跑。用手指在畫面上往左、往右滑，就能換跑道。',
        say: web ? '小橘會一直往上跑。按鍵盤的左右鍵，或按下面的左、右，換跑道。' : '小橘會一直往上跑。用手指在畫面上往左、往右滑，就能換跑道。' },
      { img: IMG + 'run-2.webp', text: '吃到金幣，就得到 1 個金幣。' },
      { img: IMG + 'run-3.webp', text: '撞到石頭、三角錐、木箱，就要回答一題！' },
      { img: IMG + 'run-5.webp', text: '題目不限時間，慢慢想，點正確的答案。答對多拿 10 個金幣；答錯會告訴你為什麼。' },
      { img: IMG + 'run-4.webp', text: '很久沒撞到的話，柵欄會擋住整條路，一定要答題才能過去。' },
      { img: IMG + 'run-6.webp', text: '撞到 10 個、答完 10 題，跑到終點就完成了！答錯越少，星星越多。' }
    ];
  }
  var SPEED_BTNS = '<p class="tut-start-title">選一個難度，開始跑！</p><div class="speed-list">' +
    '<button class="speed" type="button" data-level="1"><span class="ic">🌱</span><b>初階</b><small>基本題，先從這裡開始</small></button>' +
    '<button class="speed" type="button" data-level="2"><span class="ic">🌿</span><b>中階</b><small>多想一步的題目</small></button>' +
    '<button class="speed" type="button" data-level="3"><span class="ic">🌳</span><b>進階</b><small>最容易錯的挑戰題</small></button></div>';
  function openSpeed(s) {
    App.intro({
      mode: 'run', title: '🏃 關卡 ' + s.id + '　' + s.name, desc: s.desc, slides: slides(),
      start: function (box) {
        box.innerHTML = SPEED_BTNS;
        box.querySelectorAll('.speed').forEach(function (b) {
          b.classList.toggle('last', b.dataset.level === String(store.level || 1));
          b.onclick = function () { store.level = +b.dataset.level; save(); startGame(s.id, +b.dataset.level); };
        });
      }
    });
  }
  $('help-run').onclick = function () {
    if (!G || G.phase !== 'run') return;
    G.phase = 'paused';
    App.replay({ title: '📖 遊戲說明', slides: slides(), onClose: function () {
      if (!G) return; G.phase = 'count'; lastT = 0; App.countdown(function () { if (G) G.phase = 'run'; }, true);
    } });
  };
  App.modes.run = { open: openSpeed };

  /* =====================================================
   * 遊戲狀態
   * ===================================================== */
  var G = null;
  var cv = $('cv'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1;

  function startGame(id, level) {
    var s = STAGES[id];
    G = {
      stage: s, level: level, sp: SPEED,
      bank: pickTen(s, level), wrong: 0, wrongList: [], combo: 0, coins: 0, answered: 0, sinceHit: 0, safeRows: 3,
      lane: 1, laneX: 1, objs: [], dist: 0, rowAcc: 0, rows: 0, finishing: false,
      phase: 'count', t: 0, stunT: 0, invT: 0, boost: 1, particles: [], floats: [], q: null
    };
    App.showScreen('game');
    $('hud-stage').textContent = s.id + ' ' + s.name + '・' + LEVELS[level];
    $('key-hint').hidden = false;
    $('key-hint').textContent = App.device === 'web' ? '⌨️ 鍵盤 ← → 也可以移動' : '👈 用手指左右滑 👉';
    $('key-hint').classList.remove('fade'); void $('key-hint').offsetWidth; $('key-hint').classList.add('fade');
    resize();
    // 一開始先放幾排金幣，讓孩子知道要吃金幣
    for (var i = 0; i < 4; i++) addObj('coin', 1, -i * rowGap() * .5 + H * .35);
    renderHud();
    lastT = 0;
    if (!raf) raf = requestAnimationFrame(loop);
    App.countdown(function () { if (G) G.phase = 'run'; });
  }

  /* 題庫：先出一大批題目（去掉重複），再挑 10 題選的難度（q.lv）。
     那個難度不夠 10 題，就從難度最接近的補；沒有標難度的題目算中階。 */
  function pickTen(s, level) {
    var seen = {}, list = [], tries = 0;
    while (list.length < BANK && tries++ < BANK * 4) {
      var q = s.gen(), k = q.text + '|' + (q.big || '') + '|' + (q.review || '') + '|' + q.answer;
      if (!seen[k]) { seen[k] = 1; list.push(q); }
    }
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    list.sort(function (a, b) { return Math.abs((a.lv || 2) - level) - Math.abs((b.lv || 2) - level); }); // 一樣接近的保持亂數順序
    return list.slice(0, ROUND);
  }
  App.pickTen = pickTen; // 測試用

  function renderHud() {
    $('score').textContent = G.coins;
    $('hud-left').textContent = G.finishing ? '🏁 衝向終點！' : '第 ' + Math.min(ROUND, G.answered + 1) + ' / ' + ROUND + ' 題';
    var c = $('combo'); c.hidden = G.combo < 2; c.textContent = '🔥' + G.combo;
  }

  /* ---------- 跑道上的東西 ---------- */
  function laneW() { return Math.min(W * .3, 150); }
  function laneCX(l) { return W / 2 + (l - 1) * laneW(); }
  function charY() { return H * .8; }
  function rowGap() { return Math.max(110, H * .2); }
  function speedPx() { return H * G.sp.f * G.boost; } // 大家一樣快

  function addObj(type, lane, y, kind) { G.objs.push({ type: type, lane: lane, y: y, kind: kind || 0, hit: false, t: Math.random() * 6 }); }

  function spawnRow() {
    G.rows++;
    var y = -40, lanes = [0, 1, 2].sort(function () { return Math.random() - .5; });
    if (G.finishing) {
      if (!G.finishSpawned && G.rows >= G.finishRow) { G.finishSpawned = true; addObj('finish', 1, y); }
      else if (!G.finishSpawned) addObj('coin', lanes[0], y);
      return;
    }
    if (G.safeRows > 0) { G.safeRows--; addObj('coin', G.coinLane != null ? G.coinLane : lanes[0], y); return; } // 剛答完題，先給幾排金幣
    if (G.sinceHit > G.sp.fence && !G.fenceOnField) { addObj('fence', 1, y); G.fenceOnField = true; G.safeRows = 1; return; } // 太久沒撞到：柵欄擋整條路
    if (Math.random() < G.sp.obs) {
      addObj('obs', lanes[0], y, Math.floor(Math.random() * 3)); // 一排最多一個障礙物
      if (Math.random() < .6) addObj('coin', lanes[1], y);
      G.safeRows = 1; // 障礙物後面空一排，不會連續
    } else {
      // 一排金幣：沿用上一排的跑道，看起來是一條金幣線
      var l = G.coinLane != null && Math.random() < .75 ? G.coinLane : lanes[0];
      G.coinLane = l; addObj('coin', l, y);
    }
  }

  /* ---------- 操作 ---------- */
  function move(dir) {
    if (!G || G.phase !== 'run') return;
    var n = Math.max(0, Math.min(2, G.lane + dir));
    if (n !== G.lane) { G.lane = n; SFX.pick(); }
  }
  document.querySelectorAll('.move').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); move(+b.dataset.dir); });
  });
  /* 手指滑：移動超過 28px 就換跑道（不用等放開，比較跟手）；滑很長可以連換兩條 */
  var downX = null, downY = null, swiped = false, track = $('track');
  track.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; swiped = false; });
  track.addEventListener('pointermove', function (e) {
    if (downX == null) return;
    var dx = e.clientX - downX, dy = e.clientY - downY;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * .8) { move(dx > 0 ? 1 : -1); swiped = true; downX = e.clientX; downY = e.clientY; }
  });
  function endTouch(e) {
    if (downX == null) return;
    if (!swiped && e.type === 'pointerup') { var r = cv.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? -1 : 1); } // 點左半邊／右半邊
    downX = null;
  }
  track.addEventListener('pointerup', endTouch);
  track.addEventListener('pointercancel', endTouch);
  document.addEventListener('keydown', function (e) {
    if (!G || $('game').hidden) return;
    if (!$('ov-pause').hidden || !$('ov-end').hidden || !$('ov-count').hidden) return;
    if (!$('ov-explain').hidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('ex-next').click(); } return; }
    if (!$('ov-q').hidden) { if (/^[1-4]$/.test(e.key)) answer(+e.key - 1); return; }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); move(1); }
    else if (e.key === 'Escape') pause();
  });

  /* ---------- 撞到障礙物：出題（不限時間） ---------- */
  function hitObstacle(cx, cy) {
    G.stunT = .5; G.invT = 1.2; G.sinceHit = 0;
    G.floats.push({ x: cx, y: cy - 50, t: 0, text: '答一題！', bad: true });
    SFX.bad(); burst(cx, cy - 30, 14, false);
    G.phase = 'hit';
    setTimeout(function () { if (G && G.phase === 'hit') openQuestion(); }, 450); // 先看到撞到，再出題
  }
  function openQuestion() {
    G.phase = 'question'; G.q = G.bank[G.answered];
    var q = G.q;
    $('q-text').innerHTML = (q.again ? '🔁 ' : '') + App.fmt(q.text);
    $('q-big').hidden = !q.big; $('q-big').textContent = q.big || '';
    var vis = $('q-visual'); vis.hidden = !q.visual; vis.innerHTML = q.visual || '';
    $('q-opts').classList.toggle('zh', q.cls === 'zh');
    document.querySelectorAll('#q-opts .qa').forEach(function (b, i) {
      b.hidden = i >= q.options.length;
      if (!b.hidden) b.innerHTML = App.fmt(q.options[i]);
      b.className = 'qa' + (q.cls === 'zh' ? ' zh' : ''); b.disabled = false;
    });
    show('ov-q');
    SFX.dash();
    if (store.autoSay) speak(q.say);
  }
  $('q-say').onclick = function () { if (G && G.q) speak(G.q.say); };
  document.querySelectorAll('#q-opts .qa').forEach(function (b) { b.onclick = function () { answer(+b.dataset.i); }; });

  function answer(i) {
    if (!G || G.phase !== 'question') return;
    var q = G.q, ok = q.options[i] === q.answer, btns = document.querySelectorAll('#q-opts .qa');
    if (i >= q.options.length) return;
    btns.forEach(function (b, j) { b.disabled = true; if (q.options[j] === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    G.answered++;
    G.phase = 'answered';
    if (ok) {
      G.combo++;
      var pts = 10 + Math.min(G.combo - 1, 5) * 2;
      G.coins += pts; SFX.good();
      burst(laneCX(G.laneX), charY() - 30, 30, true);
      G.floats.push({ x: laneCX(G.laneX), y: charY() - 60, t: 0, text: '答對 +' + pts });
      setTimeout(function () { hide('ov-q'); afterQuestion(); }, 700);
    } else {
      G.combo = 0; G.wrong++; G.wrongList.push(q); // 一局固定 10 題，答錯的列在結算畫面
      SFX.bad();
      setTimeout(function () { hide('ov-q'); showExplain(); }, 600);
    }
    renderHud();
  }

  function showExplain() {
    var q = G.q;
    $('ex-title').textContent = '差一點！';
    $('ex-q').innerHTML = App.fmt(q.text) + (q.big ? '　' + esc(q.big) : '');
    $('ex-ans').innerHTML = App.fmt(q.answer);
    $('ex-hint').textContent = q.hint;
    $('ex-work').innerHTML = q.explain || '';
    show('ov-explain');
    speak('差一點。正確答案是' + q.answer.replace(/(\d+)\/(\d+)/g, '$2分之$1') + '。' + q.hint);
  }
  $('ex-say').onclick = function () { if (G) speak('正確答案是' + G.q.answer + '。' + G.q.hint); };
  $('ex-next').onclick = function () { hide('ov-explain'); afterQuestion(); };

  function afterQuestion() {
    if (!G) return;
    G.safeRows = 2; G.sinceHit = 0;
    G.boost = Math.min(1.3, G.boost + .02);    // 越跑越快一點點
    if (G.answered >= ROUND) { G.finishing = true; G.finishRow = G.rows + 3; }
    renderHud();
    G.phase = 'count';
    App.countdown(function () { if (G) G.phase = 'run'; }, true);
  }

  function finish() {
    if (!G || G.phase === 'end') return;
    G.phase = 'end';
    var stars = G.wrong <= 1 ? 3 : G.wrong <= 3 ? 2 : 1;
    var r = App.saveResult(G.stage.id, stars, G.coins);
    var title = stars === 3 ? '太厲害了！' : stars === 2 ? '很棒喔！' : '完成了！再試試拿更多星星！';
    var rv = '';
    if (G.wrongList.length) {
      var seen = {};
      rv = '<h3>📝 這次答錯的題目</h3><ul>' + G.wrongList.filter(function (q) { var k = (q.review || q.text) + q.big; if (seen[k]) return false; seen[k] = 1; return true; })
        .map(function (q) { return '<li>' + App.fmt(q.review || q.text) + (q.big ? '　' + esc(q.big) : '') + ' → <b>' + App.fmt(q.answer) + '</b></li>'; }).join('') + '</ul>';
    }
    var id = G.stage.id, sp = G.level;
    App.showEnd({
      stars: stars, title: '🏁 ' + title, scoreHTML: '吃到 <b>' + G.coins + '</b> 個金幣 🪙', isRecord: r.isRecord,
      bestText: '這關最多：' + r.rec.best + ' 個金幣', reviewHTML: rv,
      again: function () { startGame(id, sp); }, say: '到終點了！' + title + '吃到' + G.coins + '個金幣。'
    });
  }

  /* ---------- 暫停 ---------- */
  var pausedPhase = null;
  function pause() {
    if (!G || G.phase !== 'run') return;
    pausedPhase = G.phase; G.phase = 'paused';
    var id = G.stage.id, sp = G.level;
    App.pause({
      resume: function () { G.phase = 'count'; lastT = 0; App.countdown(function () { if (G) G.phase = 'run'; }, true); },
      restart: function () { startGame(id, sp); },
      quit: function () { G = null; }
    });
  }
  $('btn-pause').onclick = pause;
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.phase === 'run' && !$('game').hidden) pause(); });

  /* =====================================================
   * 每一格畫面
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

  var raf = 0, lastT = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!G || $('game').hidden) { cancelAnimationFrame(raf); raf = 0; return; }
    var dt = lastT ? Math.min((t - lastT) / 1000, .05) : 0; lastT = t;
    update(dt); draw();
  }

  function update(dt) {
    G.t += dt;
    G.laneX += (G.lane - G.laneX) * Math.min(1, dt * 14);
    G.particles.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; });
    G.particles = G.particles.filter(function (p) { return p.t < p.life; });
    G.floats.forEach(function (f) { f.t += dt; f.y -= 50 * dt; });
    G.floats = G.floats.filter(function (f) { return f.t < 1.1; });
    if (G.phase !== 'run') return;

    var v = speedPx() * (G.stunT > 0 ? .35 : 1);
    G.stunT = Math.max(0, G.stunT - dt); G.invT = Math.max(0, G.invT - dt);
    G.dist += v * dt; G.rowAcc += v * dt;
    while (G.rowAcc >= rowGap()) { G.rowAcc -= rowGap(); spawnRow(); }

    var cx = laneCX(G.laneX), cy = charY(), lw = laneW();
    G.objs.forEach(function (o) {
      o.y += v * dt; o.t += dt;
      if (o.hit) return;
      var ox = laneCX(o.lane), near = Math.abs(ox - cx) < lw * .45 && Math.abs(o.y - cy) < lw * .38;
      if (o.type === 'finish' && o.y >= cy) { o.hit = true; burst(cx, cy - 40, 40, true); SFX.win(); setTimeout(finish, 600); return; }
      if (o.type === 'fence' && o.y >= cy - lw * .3 && G.phase === 'run') { o.hit = true; G.fenceOnField = false; hitObstacle(cx, cy); return; }
      if (!near) return;
      if (o.type === 'coin') { o.hit = true; G.coins++; SFX.key(); sparkle(ox, o.y); renderHud(); }
      else if (o.type === 'obs' && G.invT <= 0 && G.phase === 'run') { o.hit = true; hitObstacle(cx, cy); }
    });
    G.sinceHit += dt;
    G.objs = G.objs.filter(function (o) { return o.y < H + 80 && !(o.hit && o.type === 'coin'); });
  }

  function burst(x, y, n, stars) {
    var colors = ['#FFD54A', '#FF8A3D', '#5BD18B', '#6FB7FF', '#FF6FA8'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 260;
      G.particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, t: 0, life: .7 + Math.random() * .4, c: colors[i % colors.length], s: stars ? 4 + Math.random() * 5 : 3 + Math.random() * 3 });
    }
  }
  function sparkle(x, y) {
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; G.particles.push({ x: x, y: y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 60, t: 0, life: .35, c: '#FFD54A', s: 3 }); }
  }

  function draw() {
    var lw = laneW(), roadW = lw * 3 + 20, roadL = W / 2 - roadW / 2, scroll = G.dist;
    // 草地
    ctx.fillStyle = '#A9D98C'; ctx.fillRect(0, 0, W, H);
    for (var k = 0; k < 18; k++) { // 兩邊的花草和樹，往下捲
      var side = k % 2, yy = ((k * 97 + scroll * 1) % (H + 80)) - 40;
      var xx = side ? roadL + roadW + 14 + (k * 37 % Math.max(10, roadL - 30)) : 8 + (k * 53 % Math.max(10, roadL - 30));
      if (k % 3 === 0) tree(xx + 10, yy); else flower(xx, yy, k);
    }
    // 跑道
    ctx.fillStyle = '#C79B62'; roundRect(roadL - 6, -10, roadW + 12, H + 20, 10); ctx.fill();
    ctx.fillStyle = '#F2D3A2'; ctx.fillRect(roadL, -10, roadW, H + 20);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.setLineDash([26, 22]); ctx.lineDashOffset = -scroll % 48;
    for (var j = 1; j < 3; j++) { var lx = roadL + 10 + lw * j; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke(); }
    ctx.setLineDash([]);

    G.objs.forEach(function (o) {
      if (o.hit && o.type !== 'obs' && o.type !== 'finish') return;
      var x = laneCX(o.lane);
      if (o.type === 'coin') coin(x, o.y, lw * .17, o.t);
      else if (o.type === 'obs') obstacle(x, o.y, lw * .3, o.kind, o.hit);
      else if (o.type === 'fence') fence(roadL, o.y, roadW, o.hit);
      else if (o.type === 'q') qbox(x, o.y, lw * .3, o.t);
      else if (o.type === 'finish') finishLine(roadL, o.y, roadW);
    });

    // 主角
    var blink = G.invT > 0 && Math.floor(G.t * 12) % 2 === 0;
    if (!blink) runner(laneCX(G.laneX), charY(), Math.min(lw * .8, 90), G.stunT > 0);

    G.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c; star(p.x, p.y, p.s); ctx.fill();
    });
    ctx.globalAlpha = 1;
    G.floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
      ctx.font = '700 26px ' + FONTF(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.bad ? '#D9483B' : '#2D8A57'; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function tree(x, y) {
    ctx.fillStyle = '#8A5A2B'; ctx.fillRect(x - 3, y, 6, 14);
    ctx.fillStyle = '#5DAE4E'; ctx.beginPath(); ctx.arc(x, y - 4, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#74C262'; ctx.beginPath(); ctx.arc(x - 5, y - 8, 7, 0, 7); ctx.fill();
  }
  function flower(x, y, k) {
    ctx.fillStyle = ['#FF8FB1', '#FFD54A', '#FFFFFF'][k % 3];
    for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#E99A1E'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
  }
  function coin(x, y, r, t) {
    var sx = Math.max(.25, Math.abs(Math.cos(t * 4)));
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    ctx.fillStyle = '#E0A800'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(0, 0, r * .78, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-r * .25, -r * .3, r * .22, 0, 7); ctx.fill();
    ctx.restore();
  }
  function obstacle(x, y, s, kind, hit) {
    ctx.save(); ctx.translate(x, y); if (hit) ctx.globalAlpha = .45;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, s * .75, s * .9, s * .2, 0, 0, 7); ctx.fill();
    if (kind === 0) { // 石頭
      ctx.fillStyle = '#8C8C8C'; ctx.beginPath(); ctx.ellipse(0, s * .2, s, s * .7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#A8A8A8'; ctx.beginPath(); ctx.ellipse(-s * .25, 0, s * .5, s * .35, 0, 0, 7); ctx.fill();
    } else if (kind === 1) { // 三角錐
      ctx.fillStyle = '#F07A28'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .7, s * .7); ctx.lineTo(-s * .7, s * .7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-s * .38, -s * .05, s * .76, s * .22);
      ctx.fillStyle = '#C45A16'; ctx.fillRect(-s * .9, s * .62, s * 1.8, s * .2);
    } else { // 木箱
      ctx.fillStyle = '#B5793D'; ctx.fillRect(-s * .8, -s * .7, s * 1.6, s * 1.4);
      ctx.strokeStyle = '#7A4E22'; ctx.lineWidth = 4; ctx.strokeRect(-s * .8, -s * .7, s * 1.6, s * 1.4);
      ctx.beginPath(); ctx.moveTo(-s * .8, -s * .7); ctx.lineTo(s * .8, s * .7); ctx.moveTo(s * .8, -s * .7); ctx.lineTo(-s * .8, s * .7); ctx.stroke();
    }
    ctx.restore();
  }
  function fence(x, y, w, hit) { // 🚧 擋住整條路的柵欄
    ctx.save(); if (hit) ctx.globalAlpha = .45;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 6, y + 22, w - 12, 8);
    for (var i = 0; i < 4; i++) { var px = x + 14 + i * (w - 28) / 3; ctx.fillStyle = '#8A5A2B'; ctx.fillRect(px - 5, y - 22, 10, 46); }
    for (var r = 0; r < 2; r++) {
      var yy = y - 16 + r * 20; ctx.fillStyle = r ? '#F2B705' : '#E35D4F'; ctx.fillRect(x + 6, yy, w - 12, 13);
      ctx.fillStyle = r ? '#2B2A28' : '#fff';
      for (var s2 = x + 6; s2 < x + w - 12; s2 += 26) { ctx.beginPath(); ctx.moveTo(s2, yy + 13); ctx.lineTo(s2 + 10, yy); ctx.lineTo(s2 + 18, yy); ctx.lineTo(s2 + 8, yy + 13); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }
  function qbox(x, y, s, t) {
    var bob = Math.sin(t * 4) * 4, glow = .5 + Math.sin(t * 6) * .3;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.fillStyle = 'rgba(255,215,64,' + glow * .5 + ')'; ctx.beginPath(); ctx.arc(0, 0, s * 1.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#F2B705'; roundRect(-s, -s, s * 2, s * 2, s * .35); ctx.fill();
    ctx.fillStyle = '#2A63A8'; roundRect(-s * .82, -s * .82, s * 1.64, s * 1.64, s * .28); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(s * 1.4) + 'px ' + BASE_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Q', 0, s * .06);
    ctx.fillStyle = '#FFF2A8'; star(s * .95, -s * .95, s * .28); ctx.fill();
    ctx.restore();
  }
  function finishLine(x, y, w) {
    var n = 10, c = w / n;
    for (var r = 0; r < 2; r++) for (var i = 0; i < n; i++) { ctx.fillStyle = (i + r) % 2 ? '#2B2A28' : '#fff'; ctx.fillRect(x + i * c, y + r * c * .6, c, c * .6); }
    ctx.font = '700 28px ' + FONTF(); ctx.textAlign = 'center'; ctx.fillStyle = '#2B2A28'; ctx.fillText('🏁 終點', x + w / 2, y - 18);
  }

  /* 小橘（從後面看）：往上跑 */
  function runner(x, y, s, hurt) {
    var t = G.t * (G.phase === 'run' ? 14 : 4), r = s * .36, step = Math.sin(t);
    ctx.save(); ctx.translate(x, y);
    if (hurt) ctx.rotate(Math.sin(G.t * 30) * .15);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, r * 1.25, r * 1.1, r * .3, 0, 0, 7); ctx.fill();
    // 腳
    ctx.fillStyle = '#7A3F12';
    ctx.beginPath(); ctx.ellipse(-r * .45, r * .95 + step * r * .25, r * .22, r * .3, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * .45, r * .95 - step * r * .25, r * .22, r * .3, 0, 0, 7); ctx.fill();
    // 尾巴（在身體下面左右甩）
    ctx.fillStyle = '#F08A3C';
    ctx.save(); ctx.rotate(Math.sin(t * .5) * .35);
    ctx.beginPath(); ctx.ellipse(0, r * 1.15, r * .3, r * .6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFF4E6'; ctx.beginPath(); ctx.ellipse(0, r * 1.6, r * .2, r * .18, 0, 0, 7); ctx.fill();
    ctx.restore();
    // 身體
    ctx.fillStyle = '#F08A3C'; ctx.beginPath(); ctx.ellipse(0, r * .35, r * .85, r * .75, 0, 0, 7); ctx.fill();
    // 手
    ctx.beginPath(); ctx.ellipse(-r * .85, r * .3 - step * r * .2, r * .2, r * .32, .3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * .85, r * .3 + step * r * .2, r * .2, r * .32, -.3, 0, 7); ctx.fill();
    // 頭
    ctx.beginPath(); ctx.arc(0, -r * .55, r * .72, 0, 7); ctx.fill();
    [[-1], [1]].forEach(function (e) {
      ctx.beginPath(); ctx.moveTo(e[0] * r * .2, -r * 1.05); ctx.lineTo(e[0] * r * .6, -r * 1.65); ctx.lineTo(e[0] * r * .72, -r * .8); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = '#7A3F12';
    [[-1], [1]].forEach(function (e) { ctx.beginPath(); ctx.moveTo(e[0] * r * .4, -r * 1.15); ctx.lineTo(e[0] * r * .58, -r * 1.48); ctx.lineTo(e[0] * r * .64, -r * 1.0); ctx.closePath(); ctx.fill(); });
    // 頭帶（數學藍）＋蝴蝶結
    ctx.fillStyle = '#2A63A8'; ctx.fillRect(-r * .72, -r * .62, r * 1.44, r * .22);
    ctx.beginPath(); ctx.moveTo(0, -r * .5); ctx.lineTo(-r * .3, -r * .2 + step * 2); ctx.lineTo(r * .05, -r * .35); ctx.lineTo(r * .3, -r * .15 - step * 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (hurt) {
      ctx.fillStyle = '#FFC93C';
      for (var i = 0; i < 3; i++) { var a = G.t * 8 + i * 2.1; star(x + Math.cos(a) * r, y - r * 1.6 + Math.sin(a) * r * .3, 6); ctx.fill(); }
    }
  }

  if (/[?&]debug\b/.test(location.search)) window.__peek = function () { return G; }; // 測試用
})();
