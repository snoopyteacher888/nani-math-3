/*
 * 🦊 九九乘法大冒險
 *   選一座島（2～9 的乘法、🌈 綜合）→ 地圖 9 格：答對往前走一格（第 5 格 🍎 補一顆愛心）
 *   → 第 10 格 👾 大魔王：5 格血，答對打一下，每題 10 秒，時間到或答錯會被打。
 *   用數字鍵盤自己打答案（背九九，不是猜）。答錯只寫數字（不寫國字、不放喇叭），會念出口訣，同一題要再答對才能走。
 *   愛心 3 顆；破關剩幾顆愛心就拿幾顆星，還有 🏅。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, speak = App.speak, SFX = App.SFX, zh = window.MathQ.zh;
  var IMG = 'images/tutorial/', HEARTS = 3, BOSS_HP = 5, BOSS_TIME = 10;
  var N = null;

  var chant = window.MathQ.chant;

  var SLIDES = [
    { img: IMG + 'nine-1.webp', text: '先選一座島：2 的乘法到 9 的乘法，或是綜合挑戰。' },
    { img: IMG + 'nine-2.webp', text: '用數字鍵盤打出答案，按「確定」。答對了，小狐狸就往前走一格！', say: '用數字鍵盤打出答案，按確定。答對了，小狐狸就往前走一格！' },
    { img: IMG + 'nine-3.webp', text: '答錯會少一顆愛心，還會念口訣給你聽，再答對一次才能往前走。走到蘋果可以補愛心。' },
    { img: IMG + 'nine-4.webp', text: '最後要打倒乘法大魔王！每題 10 秒，答對就打牠一下，打 5 下就贏了。', say: '最後要打倒乘法大魔王！每題10秒，答對就打牠一下，打5下就贏了。' },
    { img: IMG + 'nine-5.webp', text: '破關時剩幾顆愛心，就拿幾顆星，還有獎牌喔！' }
  ];

  function open(s) {
    App.intro({
      mode: 'nine', title: '九九乘法大冒險', desc: '答對往前走，打倒乘法大魔王！', slides: SLIDES,
      start: function (box) { box.innerHTML = '<button class="big-btn go-btn" type="button" aria-label="開始，選一座島">▶</button>'; box.querySelector('button').onclick = picker; }
    });
  }
  App.modes.nine = { open: open };

  /* ---------- 選島 ---------- */
  function picker() {
    App.showScreen('nine');
    $('n-title').textContent = '九九乘法大冒險';
    $('n-hearts').innerHTML = ''; $('n-left').textContent = '選一座島';
    $('nine').className = 'screen game nine-pick';
    var h = '<p class="n-pick-title">選一座島開始冒險！</p><div class="islands">';
    [2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(function (t) {
      var rec = App.store.stages['99-' + t] || {}, st = rec.stars || 0;
      h += '<button class="island' + (t ? '' : ' mix') + '" type="button" data-t="' + t + '"><b>' + (t ? t + ' 的乘法' : '綜合挑戰') + '</b>' +
        '<span class="stars">' + App.starsHTML(st) + '</span>' + (st ? '<span class="medal">🏅</span>' : '') + '</button>';
    });
    $('n-board').innerHTML = h + '</div>';
    $('n-play').hidden = true; $('n-keypad').hidden = true;
  }
  $('n-board').addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]');
    if (b) { var t = +b.dataset.t; App.countdown(function () { start(t); }); }
  });

  /* ---------- 冒險 ---------- */
  function start(t) {
    N = { t: t, pos: 0, hearts: HEARTS, score: 0, combo: 0, wrong: 0, wrongs: [], phase: 'play', boss: false, bossHp: BOSS_HP,
      order: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]), val: '', q: null, timeLeft: 0 };
    $('nine').className = 'screen game nine-run';
    $('n-title').textContent = t ? t + ' 的乘法島' : '🌈 綜合挑戰';
    $('n-play').hidden = false; $('n-keypad').hidden = false;
    nextQ();
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function pickT() { return N.t || 2 + Math.floor(Math.random() * 8); }
  function nextQ(same) {
    if (!same) {
      var a = pickT(), b = N.boss ? 1 + Math.floor(Math.random() * 9) : N.order[N.pos];
      if (!N.t) b = 2 + Math.floor(Math.random() * 8);
      N.q = Math.random() < .5 || N.t ? { a: a, b: b } : { a: b, b: a };
    }
    N.val = ''; N.phase = 'play'; N.timeLeft = BOSS_TIME; N.last = performance.now();
    render();
    if (App.store.autoSay) speak(N.q.a + '乘以' + N.q.b);
    if (N.boss) requestAnimationFrame(tick);
  }

  function render() {
    // 地圖：9 格＋大魔王
    var h = '<div class="path">';
    for (var i = 0; i < 10; i++) {
      var cls = 'tile' + (i < N.pos ? ' done' : '') + (i === N.pos ? ' here' : '') + (i === 4 ? ' apple' : '') + (i === 9 ? ' boss' : '');
      h += '<div class="' + cls + '"><span class="t-ic">' + (i === 9 ? '👾' : i === 4 ? '🍎' : (i + 1)) + '</span>' + (i === N.pos ? '<span class="fox">🦊</span>' : '') + '</div>';
    }
    h += '</div>';
    if (N.boss) h += '<div class="bossbar"><span>👾 大魔王</span><div class="hp"><div style="width:' + N.bossHp / BOSS_HP * 100 + '%"></div></div><span class="btime" id="n-btime"></span></div>';
    $('n-board').innerHTML = h;
    var hh = ''; for (var k = 0; k < HEARTS; k++) hh += '<span' + (k < N.hearts ? '' : ' class="off"') + '>❤️</span>';
    $('n-hearts').innerHTML = hh;
    $('n-left').textContent = N.boss ? '打倒大魔王！' : '第 ' + (N.pos + 1) + ' 格';
    $('n-score').textContent = N.score;
    $('n-q').innerHTML = N.q.a + ' × ' + N.q.b + ' ＝ <span class="n-ans' + (N.phase === 'play' ? ' cur' : '') + '">' + (N.val || '') + '</span>';
  }
  function msg(html, cls) { $('n-msg').className = 'n-msg ' + (cls || ''); $('n-msg').innerHTML = html; }

  function key(k) {
    if (!N || N.phase !== 'play') return;
    if (k === 'ok') return check();
    if (k === 'del') N.val = N.val.slice(0, -1);
    else if (N.val.length < 2) N.val += k;
    SFX.key(); render();
  }
  $('n-keypad').addEventListener('click', function (e) { var b = e.target.closest('[data-nk]'); if (b) key(b.dataset.nk); });
  document.addEventListener('keydown', function (e) {
    if (!N || $('nine').hidden || !$('ov-pause').hidden || !$('ov-end').hidden || !$('ov-tut').hidden || !$('ov-count').hidden) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); key('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); key('ok'); }
    else if (e.key === 'Escape') pause();
  });

  function check() {
    if (N.val === '') { msg('先打出答案喔！', 'warn'); return; }
    var q = N.q, ok = +N.val === q.a * q.b;
    N.phase = 'wait';
    if (ok) {
      N.combo++; N.score += 10 + Math.min(N.combo - 1, 5) * 2; SFX.good();
      msg('⭕ 答對了！' + (N.combo >= 3 ? '　🔥 連對 ' + N.combo : ''), 'good');
      if (N.boss) {
        N.bossHp--; render(); $('n-board').classList.add('hit'); setTimeout(function () { $('n-board').classList.remove('hit'); }, 400);
        if (N.bossHp <= 0) { setTimeout(function () { finish(true); }, 700); return; }
        setTimeout(function () { msg(''); nextQ(); }, 700);
      } else {
        setTimeout(function () {
          N.pos++;
          if (N.pos === 4 && N.hearts < HEARTS) { N.hearts++; msg('🍎 吃到蘋果，補一顆愛心！', 'good'); SFX.win(); }
          else msg('');
          if (N.pos === 9) { N.boss = true; msg('👾 大魔王出現了！每題 10 秒，打牠 5 下！', 'boss'); speak('大魔王出現了！'); }
          nextQ();
        }, 600);
      }
    } else {
      wrongHit(q, '答錯了');
    }
  }
  function wrongHit(q, why) {
    N.combo = 0; N.wrong++; N.hearts--; N.wrongs.push(q.a + ' × ' + q.b + ' ＝ ' + q.a * q.b);
    SFX.bad();
    var c = chant(q.a, q.b);
    msg('❌ ' + why + '！<b>' + q.a + ' × ' + q.b + ' ＝ ' + q.a * q.b + '</b>', 'bad'); // 只寫數字（老師：學生看得懂數字，國字反而是負擔）
    speak(c);
    render();
    if (N.hearts <= 0) { setTimeout(function () { finish(false); }, 1800); return; }
    setTimeout(function () { if (N && N.phase === 'wait') nextQ(!N.boss); }, 2200); // 地圖上要再答一次同一題；魔王換一題
  }

  /* 大魔王：每題 10 秒 */
  function tick(now) {
    if (!N || !N.boss || $('nine').hidden) return;
    if (N.phase !== 'play') { N.last = now; requestAnimationFrame(tick); return; }
    N.timeLeft -= (now - N.last) / 1000; N.last = now;
    var bt = $('n-btime'); if (bt) bt.textContent = '⏱️ ' + Math.max(0, Math.ceil(N.timeLeft));
    if (N.timeLeft <= 0) { N.phase = 'wait'; wrongHit(N.q, '時間到'); return; }
    requestAnimationFrame(tick);
  }

  function pause() {
    if (!N || N.phase === 'end') return;
    var was = N.phase, t = N.t; N.phase = 'paused';
    App.pause({ resume: function () { N.phase = was; N.last = performance.now(); }, restart: function () { App.countdown(function () { start(t); }); }, quit: function () { N = null; } });
  }
  $('n-pause').onclick = pause;
  $('help-nine').onclick = function () {
    if (!N || N.phase === 'end') { App.replay({ title: '📖 遊戲說明', slides: SLIDES, onClose: function () {} }); return; }
    var was = N.phase; N.phase = 'paused';
    App.replay({ title: '📖 遊戲說明', slides: SLIDES, onClose: function () { if (N) { N.phase = was; N.last = performance.now(); } } });
  };

  function finish(win) {
    N.phase = 'end';
    var t = N.t, stars = win ? N.hearts : 0, r = win ? App.saveResult('99-' + t, stars, N.score) : { rec: App.store.stages['99-' + t] || {}, isRecord: false };
    var name = t ? t + ' 的乘法島' : '綜合挑戰';
    var title = win ? '🏅 打倒大魔王！' + name + '破關了！' : '愛心用完了，背一背口訣再來一次！';
    var rv = N.wrongs.length ? '<h3>要再背一背</h3><ul>' + N.wrongs.filter(function (w, i, a) { return a.indexOf(w) === i; }).map(function (w) {
      return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '';
    App.showEnd({
      stars: stars, title: title, scoreHTML: '得到 <b>' + N.score + '</b> 分', isRecord: win && r.isRecord,
      bestText: r.rec.best ? '這座島最高紀錄：' + r.rec.best + ' 分' : '', reviewHTML: rv,
      again: function () { App.countdown(function () { start(t); }); }, say: title
    });
  }
  if (/[?&]debug\b/.test(location.search)) window.__peekN = function () { return N; };
})();
