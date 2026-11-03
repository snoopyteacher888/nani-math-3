/*
 * 一局 10 題的小遊戲（不限時間）
 *   quiz  ⭕❌ 快答／🧩 選答案：點大大的選項（答得快多一點分）
 *   tap   點圖：📏 數線跳跳（點刻度，青蛙跳過去）、🔍 找找看（點圖上的線）
 *   sort  🗑️ 分類丟丟樂：卡片拖進（或點）正確的格子
 *   paint 🍕 塗色：點一塊塗一塊，塗好按確定
 *   fill  📏 自己填：用數字鍵盤填格子
 * 答對 ⭕、答錯 ❌ 並說明，這題等一下會再出現。星星看答錯幾題。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, fmt = App.fmt, speak = App.speak, SFX = App.SFX;
  var ROUND = 10, IMG = 'images/tutorial/';
  var Q = null;

  /* ---------- 說明頁 ---------- */
  var END_SLIDE = { img: IMG + 'round-end.webp', text: '一局 10 題，不限時間。答錯的題目等一下會再出現；答錯 0～1 題拿 3 顆星，2～3 題拿 2 顆星。',
    say: '一局10題，不限時間。答錯的題目，等一下會再出現。答錯0到1題，拿3顆星，答錯2到3題，拿2顆星。' };
  var SLIDES = {
    frog: [
      { img: IMG + 'frog-1.webp', text: '看看青蛙要跳到哪一個數。先看數線上 1 小格是多少。' },
      { img: IMG + 'frog-2.webp', text: '點一下那個刻度，青蛙就會跳過去。跳對了就答對！' },
      END_SLIDE],
    fill: [
      { img: IMG + 'fill-1.webp', text: '看鉛筆從哪裡開始、到哪裡結束。小心，不一定從 0 開始！' },
      { img: IMG + 'fill-2.webp', text: '點一下格子，用數字鍵盤填「幾公分」和「幾毫米」，填好按「確定」。', say: '點一下格子，用數字鍵盤填幾公分、和幾毫米，填好按確定。' },
      END_SLIDE],
    quiz: [
      { img: IMG + 'quiz-1.webp', text: '看清楚題目，點你覺得對的答案。' },
      { img: IMG + 'quiz-2.webp', text: '答對會出現圈圈，答得越快分數越多；答錯會出現叉叉，告訴你為什麼。' },
      END_SLIDE],
    sort: [
      { img: IMG + 'sort-1.webp', text: '卡片掉下來了！看看它是哪一種。' },
      { img: IMG + 'sort-2.webp', text: '把卡片拖到正確的格子裡，或是直接點那個格子。' },
      END_SLIDE],
    paint: [
      { img: IMG + 'paint-1.webp', text: '看題目要塗幾分之幾。分母是平分成幾份，分子是要塗幾份。' },
      { img: IMG + 'paint-2.webp', text: '點一塊就會塗上顏色，再點一下可以擦掉。塗好了按「塗好了」。', say: '點一塊就會塗上顏色，再點一下可以擦掉。塗好了，按塗好了。' },
      END_SLIDE],
    fillnum: [
      { img: IMG + 'fillnum-1.webp', text: '看清楚題目，點一下格子，用數字鍵盤把答案打進去，再按「確定」。', say: '看清楚題目，點一下格子，用數字鍵盤把答案打進去，再按確定。' },
      { img: IMG + 'fillnum-2.webp', text: '答案是分數的時候，上面填分子、下面填分母，記得約成最簡分數。' },
      END_SLIDE],
    find: [
      { img: IMG + 'find-1.webp', text: '看題目要找半徑還是直徑。' },
      { img: IMG + 'find-2.webp', text: '在圓上點一下那一條線。點對了就答對！' },
      END_SLIDE]
  };

  function open(s) {
    App.intro({
      mode: 'round-' + s.tut, title: '關卡 ' + s.id + '　' + s.name, desc: s.desc, slides: SLIDES[s.tut],
      start: function (box) {
        box.innerHTML = '<button class="big-btn go-btn" type="button" aria-label="開始">▶</button>';
        box.querySelector('button').onclick = function () { clearScreen(); App.showScreen('round'); App.countdown(function () { start(s); }); };
      }
    });
  }
  App.modes.round = { open: open };
  $('help-round').onclick = function () { if (Q && Q.phase !== 'end') App.replay({ title: '📖 遊戲說明', slides: SLIDES[Q.stage.tut], onClose: function () {} }); };

  function clearScreen() { ['r-text', 'r-visual', 'r-opts', 'r-fields'].forEach(function (id) { $(id).innerHTML = ''; }); $('r-fb').hidden = true; }


  /* ---------- 打怪獸：答對一題，小橘丟一顆星星打怪獸；10 題全對（含訂正）怪獸就被打倒 ---------- */
  var FOX = '<svg viewBox="0 0 100 100"><g stroke="#5A3A22" stroke-width="3" stroke-linejoin="round">' +
    '<path d="M22 40 L18 8 L44 28 Z" fill="#F08A3C"/><path d="M78 40 L82 8 L56 28 Z" fill="#F08A3C"/>' +
    '<path d="M50 24 C76 24 88 44 84 62 C80 80 64 90 50 90 C36 90 20 80 16 62 C12 44 24 24 50 24 Z" fill="#F08A3C"/>' +
    '<path d="M50 56 C62 56 72 66 70 76 C66 86 58 90 50 90 C42 90 34 86 30 76 C28 66 38 56 50 56 Z" fill="#FFF3E2"/></g>' +
    '<path d="M18 40 Q50 30 82 40" stroke="#2A63A8" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<circle cx="37" cy="54" r="4.5" fill="#2B2A28"/><circle cx="63" cy="54" r="4.5" fill="#2B2A28"/>' +
    '<ellipse cx="50" cy="66" rx="5" ry="3.6" fill="#2B2A28"/><path d="M44 74 Q50 79 56 74" stroke="#2B2A28" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
  var MON_COLORS = [['#8E7CC3', '#6B5AA6'], ['#5DB4A0', '#3F8C7A'], ['#E88AA8', '#C2607F'], ['#7FB0E0', '#4F84B8'], ['#B5C95A', '#879A33']];
  function monSVG(c) {
    return '<svg viewBox="0 0 100 100"><g stroke="' + c[1] + '" stroke-width="3" stroke-linejoin="round">' +
      '<path d="M30 30 L24 8 L42 24 Z M70 30 L76 8 L58 24 Z" fill="#FFE9A8"/>' +
      '<path d="M50 20 C80 20 92 46 90 70 C88 86 76 94 50 94 C24 94 12 86 10 70 C8 46 20 20 50 20 Z" fill="' + c[0] + '"/></g>' +
      '<g class="mf-normal"><circle cx="37" cy="52" r="9" fill="#fff"/><circle cx="63" cy="52" r="9" fill="#fff"/><circle cx="39" cy="54" r="4.5" fill="#2B2A28"/><circle cx="61" cy="54" r="4.5" fill="#2B2A28"/>' +
        '<path d="M38 72 Q50 80 62 72" stroke="#2B2A28" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 74 l3 5 l3 -4 l3 4 l3 -5" fill="#fff" stroke="#2B2A28" stroke-width="1.5"/></g>' +
      '<g class="mf-hurt" stroke="#2B2A28" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M30 48 l12 8 M30 58 l12 -2 M70 48 l-12 8 M70 58 l-12 -2"/><ellipse cx="50" cy="75" rx="6" ry="5" fill="#2B2A28"/></g>' +
      '<g class="mf-laugh" stroke="#2B2A28" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M30 54 Q37 46 44 54 M56 54 Q63 46 70 54"/><path d="M36 68 Q50 86 64 68 Z" fill="#C2405A"/></g>' +
      '<g class="cheeks" fill="#F2A7A0" opacity=".7"><ellipse cx="24" cy="66" rx="6" ry="3.5"/><ellipse cx="76" cy="66" rx="6" ry="3.5"/></g></svg>';
  }
  var STAR = '<svg viewBox="0 0 40 40"><path d="M20 3 L25 15 L38 15.5 L28 24 L31.5 37 L20 29.5 L8.5 37 L12 24 L2 15.5 L15 15 Z" fill="#F2B705" stroke="#C98F00" stroke-width="2" stroke-linejoin="round"/></svg>';
  function arenaInit(s) {
    var h = 0; for (var i = 0; i < s.id.length; i++) h = h * 31 + s.id.charCodeAt(i);
    $('r-fox').innerHTML = FOX; $('r-mon').innerHTML = monSVG(MON_COLORS[Math.abs(h) % MON_COLORS.length]);
    $('r-mon').className = 'ar-mon'; $('r-fox').className = 'ar-fox'; $('r-shot').className = 'ar-shot'; $('r-shot').innerHTML = STAR;
    Q.hp = ROUND; arenaHP();
  }
  function arenaHP() { $('r-hp').style.width = (Q.hp / ROUND * 100) + '%'; $('r-hp').classList.toggle('low', Q.hp <= 3); }
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function arenaHit(big) {
    Q.hp = Math.max(0, Q.hp - 1);
    replay($('r-fox'), 'throw'); replay($('r-shot'), 'fly');
    setTimeout(function () {
      if (!Q) return;
      var mon = $('r-mon'); mon.classList.remove('laugh');
      replay(mon, big ? 'hurt-big' : 'hurt'); arenaHP();
      if (Q.hp === 0) mon.classList.add('down');
    }, 380);
  }
  function arenaMiss() { var mon = $('r-mon'); mon.classList.remove('hurt', 'hurt-big'); replay(mon, 'laugh'); replay($('r-fox'), 'bonk'); }

  /* ---------- 一局 ---------- */
  function start(s) {
    Q = { stage: s, newCount: 0, retry: [], answered: 0, wrong: 0, score: 0, combo: 0, wrongList: [], phase: 'play', q: null };
    $('r-title').textContent = s.id + ' ' + s.name;
    App.showScreen('round');
    arenaInit(s);
    next();
  }
  function next() {
    if (Q.newCount >= ROUND && !Q.retry.length) return finish();
    var due = Q.retry.findIndex(function (r) { return r.due <= Q.answered; }), q;
    if (due >= 0 || Q.newCount >= ROUND) { q = Q.retry.splice(due >= 0 ? due : 0, 1)[0].q; q.again = true; if (q.options) q.options = q.options.slice().sort(function () { return Math.random() - .5; }); }
    else { q = Q.stage.gen(); Q.newCount++; }
    Q.q = q; Q.phase = 'play'; Q.t0 = Date.now();
    render();
    if (App.store.autoSay) speak(q.say);
  }
  function hud() {
    var left = Math.max(0, ROUND - Q.newCount) + Q.retry.length + (Q.phase === 'play' ? 1 : 0);
    $('r-prog').textContent = '還有 ' + left + ' 題';
    $('r-score').textContent = Q.score;
    $('r-combo').hidden = Q.combo < 2; $('r-combo').textContent = '🔥' + Q.combo;
  }

  function render() {
    var q = Q.q, k = q.kind;
    clearScreen();
    $('r-text').innerHTML = (q.again ? '🔁 ' : '') + fmt(q.text);
    $('r-big').hidden = !q.big; $('r-big').textContent = q.big || '';
    $('round').className = 'screen game round-' + k;
    $('r-keypad').hidden = k !== 'fill';
    if (k === 'quiz') {
      $('r-visual').innerHTML = q.visual || '';
      $('r-opts').innerHTML = q.options.map(function (o, i) { return '<button class="qa' + (q.cls === 'zh' ? ' zh' : '') + '" type="button" data-o="' + i + '">' + fmt(o) + '</button>'; }).join('');
    } else if (k === 'tap') {
      $('r-visual').innerHTML = q.svg;
    } else if (k === 'sort') {
      $('r-visual').innerHTML = '<div class="sort-card" id="sort-card">' + q.card + '</div>';
      $('r-opts').innerHTML = '<div class="bins bins-' + q.bins.length + '">' + q.bins.map(function (b, i) {
        return '<button class="bin" type="button" data-bin="' + i + '">' + (q.binIcons ? '<span class="bin-ic">' + q.binIcons[i] + '</span>' : '') + '<span>' + esc(b) + '</span></button>'; }).join('') + '</div>';
      dragSetup();
    } else if (k === 'paint') {
      $('r-visual').innerHTML = q.svg + '<p class="paint-count" id="paint-count">塗了 0 份</p>';
      $('r-opts').innerHTML = '<button class="big-btn go-btn" type="button" id="paint-ok">✔ 塗好了</button>';
      Q.painted = {};
    } else if (k === 'fill') {
      $('r-visual').innerHTML = q.visual || '';
      Q.vals = q.fields.map(function () { return ''; }); Q.cur = 0;
      renderFields();
    }
    hud();
  }

  /* ---------- quiz ---------- */
  $('r-opts').addEventListener('click', function (e) {
    if (!Q || Q.phase !== 'play') return;
    var b = e.target.closest('[data-o]'); if (b) { var o = Q.q.options[+b.dataset.o]; markOpts(o); judge(o === Q.q.answer, o); return; }
    var bin = e.target.closest('[data-bin]'); if (bin) { dropTo(+bin.dataset.bin); return; }
    if (e.target.closest('#paint-ok')) paintDone();
  });
  function markOpts(chosen) {
    document.querySelectorAll('#r-opts .qa').forEach(function (b, i) {
      var o = Q.q.options[i]; b.disabled = true;
      if (o === Q.q.answer) b.classList.add('right'); else if (o === chosen) b.classList.add('wrong');
    });
  }

  /* ---------- tap ---------- */
  $('r-visual').addEventListener('click', function (e) {
    if (!Q || Q.phase !== 'play') return;
    var q = Q.q;
    if (q.kind === 'tap') {
      var h = e.target.closest('[data-hit]'); if (!h) return;
      var id = h.dataset.hit;
      Q.phase = 'wait';
      if (q.frog) frogJump(+id, function () { tapResult(id); }); else tapResult(id);
    } else if (q.kind === 'paint') {
      var part = e.target.closest('[data-part]'); if (!part) return;
      var i = part.dataset.part; Q.painted[i] = !Q.painted[i];
      part.setAttribute('fill', Q.painted[i] ? '#FF9F43' : '#fff'); SFX.key();
      $('paint-count').textContent = '塗了 ' + count(Q.painted) + ' 份';
    } else if (q.kind === 'fill') {
      var f = e.target.closest('[data-f]'); // 格子在 r-fields，不會到這裡
    }
  });
  function tapResult(id) {
    var q = Q.q, ok = id === q.answer;
    document.querySelectorAll('#r-visual [data-hit]').forEach(function (el) {
      if (el.dataset.hit === q.answer) el.classList.add('right'); else if (el.dataset.hit === id) el.classList.add('wrong');
    });
    judge(ok, q.frog ? null : id);
  }
  function frogJump(i, done) {
    var g = document.querySelector('#r-visual .frog'); if (!g) { done(); return; }
    var x0 = +g.dataset.x0, dx = +g.dataset.dx, y = +g.dataset.y, from = Q.frogX == null ? x0 : Q.frogX, to = x0 + dx * i, t0 = performance.now(), T = 520;
    SFX.dash();
    (function step(now) {
      var p = Math.min(1, (now - t0) / T), x = from + (to - from) * p, yy = y - Math.sin(p * Math.PI) * 60;
      g.setAttribute('transform', 'translate(' + x + ',' + yy + ')');
      if (p < 1) requestAnimationFrame(step); else done();
    })(t0);
  }

  /* ---------- sort：拖卡片或點格子 ---------- */
  function dragSetup() {
    var card = $('sort-card'), sx, sy, dragging = false;
    card.addEventListener('pointerdown', function (e) {
      if (Q.phase !== 'play') return;
      dragging = true; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.classList.add('dragging');
    });
    card.addEventListener('pointermove', function (e) { if (dragging) card.style.transform = 'translate(' + (e.clientX - sx) + 'px,' + (e.clientY - sy) + 'px) rotate(' + ((e.clientX - sx) / 20) + 'deg)'; });
    card.addEventListener('pointerup', function (e) {
      if (!dragging) return; dragging = false; card.classList.remove('dragging');
      card.style.visibility = 'hidden';
      var el = document.elementFromPoint(e.clientX, e.clientY); card.style.visibility = '';
      var bin = el && el.closest && el.closest('[data-bin]');
      if (bin) dropTo(+bin.dataset.bin); else card.style.transform = '';
    });
  }
  function dropTo(i) {
    if (!Q || Q.phase !== 'play') return;
    var q = Q.q, chosen = q.bins[i], card = $('sort-card'), bin = document.querySelector('[data-bin="' + i + '"]');
    Q.phase = 'wait';
    var cr = card.getBoundingClientRect(), br = bin.getBoundingClientRect();
    card.style.transition = 'transform .35s ease-in, opacity .35s';
    card.style.transform = 'translate(' + (br.left + br.width / 2 - cr.left - cr.width / 2) + 'px,' + (br.top + br.height / 2 - cr.top - cr.height / 2) + 'px) scale(.25)';
    card.style.opacity = '.2';
    setTimeout(function () {
      document.querySelectorAll('.bin').forEach(function (b, j) { if (q.bins[j] === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
      card.style.transition = ''; card.style.transform = ''; card.style.opacity = '';
      judge(chosen === q.answer, chosen);
    }, 360);
  }

  /* ---------- paint ---------- */
  function count(o) { return Object.keys(o).filter(function (k) { return o[k]; }).length; }
  function paintDone() {
    var n = count(Q.painted), q = Q.q;
    if (!n) { $('paint-count').textContent = '還沒有塗喔！點一塊塗上顏色'; return; }
    judge(n === q.paint.k, '塗了 ' + n + ' 份');
  }

  /* ---------- fill ---------- */
  function renderFields() {
    var q = Q.q;
    function box(i) { return '<button class="box' + (Q.phase === 'play' && i === Q.cur ? ' cur' : '') + (Q.res ? ' ' + Q.res[i] : '') + '" type="button" data-f="' + i + '" aria-label="' + (q.layout === 'frac' ? (i ? '分母' : '分子') : '答案') + '">' + Q.vals[i] + '</button>'; }
    if (q.layout === 'frac') { // 分數：上面分子、下面分母
      $('r-fields').innerHTML = '<span class="ffrac">' + box(0) + '<span class="fline"></span>' + box(1) + '</span><span class="fhint">上面填分子，下面填分母</span>';
      return;
    }
    $('r-fields').innerHTML = q.fields.map(function (f, i) {
      return '<span class="fbox-wrap">' + box(i) + '<span class="flabel">' + esc(f.label) + '</span></span>';
    }).join('');
  }
  $('r-fields').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b && Q.phase === 'play') { Q.cur = +b.dataset.f; SFX.key(); renderFields(); } });
  function fillKey(k) {
    if (!Q || Q.phase !== 'play' || Q.q.kind !== 'fill') return;
    var q = Q.q;
    if (k === 'ok') {
      if (Q.vals.some(function (v) { return v === ''; })) { $('r-fields').classList.remove('shake'); void $('r-fields').offsetWidth; $('r-fields').classList.add('shake'); speak('每一格都要填喔，沒有就填0。'); return; }
      Q.res = q.fields.map(function (f, i) { return +Q.vals[i] === f.ans ? 'ok' : 'bad'; });
      Q.phase = 'wait'; renderFields();
      judge(Q.res.every(function (r) { return r === 'ok'; }), Q.vals.map(function (v, i) { return v + ' ' + q.fields[i].label; }).join(' '));
      return;
    }
    if (k === 'del') { if (Q.vals[Q.cur] === '' && Q.cur > 0) Q.cur--; Q.vals[Q.cur] = ''; }
    else {
      Q.vals[Q.cur] = Q.vals[Q.cur].length >= 4 ? Q.vals[Q.cur] : Q.vals[Q.cur] + k; // 最多 4 位數
      if (q.autoNext && Q.vals[Q.cur].length === 1 && Q.cur < q.fields.length - 1) Q.cur++; // 量長度：公分填好自動跳到毫米
    }
    SFX.key(); renderFields();
  }
  $('r-keypad').addEventListener('click', function (e) { var b = e.target.closest('[data-rk]'); if (b) fillKey(b.dataset.rk); });

  /* ---------- 判斷 ---------- */
  function judge(ok, chosen) {
    var q = Q.q;
    Q.answered++; Q.phase = 'fb'; Q.res = null;
    stamp(ok);
    if (ok) {
      Q.combo++;
      var quick = q.kind === 'quiz' ? Math.max(0, 5 - Math.floor((Date.now() - Q.t0) / 1500)) : 0;
      Q.score += 10 + Math.min(Q.combo - 1, 5) * 2 + quick; SFX.good();
      hud(); arenaHit(Q.combo >= 3);
      setTimeout(function () { if (Q && Q.phase === 'fb') { Q.frogX = null; next(); } }, Q.hp === 0 ? 1500 : 1000);
    } else {
      Q.combo = 0; Q.wrong++; Q.wrongList.push(q); Q.retry.push({ q: q, due: Q.answered + 2 });
      SFX.bad(); hud(); arenaMiss();
      var ans = q.answerText || q.answer;
      $('r-fb').innerHTML = '<div class="fb-ans">' + App.sayBtn('正確答案是' + ans.replace(/(\d+)\/(\d+)/g, '$2分之$1') + '。' + q.hint) + '<span>正確答案是 <b>' + fmt(ans) + '</b></span></div>' +
        '<p class="ex-hint">' + esc(q.hint) + '</p><div class="ex-work">' + (q.explain || '') + '</div>' +
        '<button class="big-btn" type="button" id="r-next">我懂了，下一題 ▶</button>';
      $('r-fb').hidden = false;
      setTimeout(function () { $('r-fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
      speak('差一點。正確答案是' + ans.replace(/(\d+)\/(\d+)/g, '$2分之$1') + '。' + q.hint);
    }
  }
  $('r-fb').addEventListener('click', function (e) { if (e.target.closest('#r-next')) { Q.frogX = null; next(); } });
  function stamp(ok) {
    var s = $('r-stamp'); s.textContent = ok ? '⭕' : '❌'; s.className = 'r-stamp'; void s.offsetWidth; s.className = 'r-stamp show ' + (ok ? 'ok' : 'no');
  }
  document.addEventListener('keydown', function (e) {
    if (!Q || $('round').hidden || !$('ov-pause').hidden || !$('ov-end').hidden || !$('ov-tut').hidden) return;
    if (Q.phase === 'fb' && !$('r-fb').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); Q.frogX = null; next(); return; }
    if (Q.q.kind === 'quiz' && /^[1-4]$/.test(e.key)) { var b = document.querySelector('#r-opts [data-o="' + (+e.key - 1) + '"]'); if (b) b.click(); }
    if (Q.q.kind === 'sort' && /^[1-3]$/.test(e.key)) dropTo(+e.key - 1);
    if (Q.q.kind === 'fill') { if (/^[0-9]$/.test(e.key)) fillKey(e.key); else if (e.key === 'Backspace') { e.preventDefault(); fillKey('del'); } else if (e.key === 'Enter') { e.preventDefault(); fillKey('ok'); } }
    if (e.key === 'Escape') pause();
  });
  $('r-say').onclick = function () { if (Q && Q.q) speak(Q.q.say); };

  function pause() {
    if (!Q || Q.phase === 'end') return;
    var s = Q.stage;
    App.pause({ resume: function () {}, restart: function () { App.countdown(function () { start(s); }); }, quit: function () { Q = null; } });
  }
  $('r-pause').onclick = pause;

  function finish() {
    Q.phase = 'end';
    var s = Q.stage, stars = Q.wrong <= 1 ? 3 : Q.wrong <= 3 ? 2 : 1, r = App.saveResult(s.id, stars, Q.score);
    var title = stars === 3 ? '太厲害了！' : stars === 2 ? '很棒喔！' : '完成了！再試試拿更多星星！', seen = {};
    var rv = Q.wrongList.filter(function (q) { var k = q.review || q.text; if (seen[k]) return false; seen[k] = 1; return true; });
    rv = rv.length ? '<h3>這次答錯的題目</h3><ul>' + rv.map(function (q) { return '<li>' + fmt(q.review || q.text) + ' → <b>' + fmt(q.answerText || q.answer) + '</b></li>'; }).join('') + '</ul>' : '';
    App.showEnd({
      stars: stars, title: title, scoreHTML: '得到 <b>' + Q.score + '</b> 分', isRecord: r.isRecord,
      bestText: '這關最高紀錄：' + r.rec.best + ' 分', reviewHTML: rv,
      again: function () { App.countdown(function () { start(s); }); }, say: title + '得到' + Q.score + '分。'
    });
  }
  if (/[?&]debug\b/.test(location.search)) { window.__peekR = function () { return Q; }; window.__renderR = render; }
})();
