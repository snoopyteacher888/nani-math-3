/*
 * 打地鼠
 *
 * 地鼠拿著數字從洞裡跑出來：符合上面規則的就打（點牠），不符合的不要打。
 * 關卡的 waves() 給一到三條規則（例如質數；偶數→奇數→偶數；3 的倍數→24 的因數→7 的倍數），
 * 2 分鐘平均分給每一條規則，換規則時會停一下、念出新規則。
 * 地鼠會越來越快、越來越多。打錯會說明為什麼（例如 51 ＝ 3 × 17）。
 * 偶爾出現金色地鼠（一定要打的），打到分數比較多。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, SFX = App.SFX;
  var TIME = 120, HOLES = 9;
  var M = null;

  var MOLE_SVG =
    '<svg class="mole-svg" viewBox="0 0 100 110" aria-hidden="true">' +
      '<g stroke="#5A3A22" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
        '<ellipse class="m-ear" cx="24" cy="26" rx="8" ry="7"/><ellipse class="m-ear" cx="76" cy="26" rx="8" ry="7"/>' +
        '<path class="m-body" d="M14 110 C10 60 22 18 50 18 C78 18 90 60 86 110 Z"/>' +
        '<ellipse class="m-face" cx="50" cy="46" rx="20" ry="14"/>' +
      '</g>' +
      '<g class="eyes-open" fill="#2B2A28"><circle cx="38" cy="36" r="4"/><circle cx="62" cy="36" r="4"/>' +
        '<circle cx="39.3" cy="34.6" r="1.3" fill="#fff"/><circle cx="63.3" cy="34.6" r="1.3" fill="#fff"/></g>' +
      '<g class="eyes-x" stroke="#2B2A28" stroke-width="2.6" stroke-linecap="round"><path d="M34 32 l8 8 M42 32 l-8 8 M58 32 l8 8 M66 32 l-8 8"/></g>' +
      '<g class="cheeks" fill="#F2A7A0" opacity=".7"><ellipse cx="28" cy="46" rx="5" ry="3"/><ellipse cx="72" cy="46" rx="5" ry="3"/></g>' +
      '<g stroke="#5A3A22" stroke-width="1.6" stroke-linecap="round"><path d="M40 45 L27 41 M40 48 L26 49 M60 45 L73 41 M60 48 L74 49"/></g>' +
      '<ellipse cx="50" cy="44" rx="6" ry="4.5" fill="#E8838B" stroke="#5A3A22" stroke-width="2"/>' +
      '<path class="m-mouth" d="M44 52 Q50 57 56 52" fill="none" stroke="#5A3A22" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g fill="#E9C9A6" stroke="#5A3A22" stroke-width="2.2"><ellipse cx="24" cy="74" rx="8" ry="6"/><ellipse cx="76" cy="74" rx="8" ry="6"/></g>' +
    '</svg>';

  var IMG = 'images/tutorial/';
  var SLIDES = {
    mole: [
      { img: IMG + 'mole-1.webp', text: '地鼠會拿著數字，從洞裡跑出來。' },
      { img: IMG + 'mole-2.webp', text: '是質數，就快點牠！打到就加分。' },
      { img: IMG + 'mole-3.webp', text: '1 和合數不要打！打錯了，下面會告訴你為什麼。' },
      { img: IMG + 'mole-4.webp', text: '金色地鼠分數比較多。一共 2 分鐘，地鼠會越來越快喔！', say: '金色地鼠分數比較多。一共2分鐘，地鼠會越來越快喔！' }
    ],
    'mole-switch': [
      { img: IMG + 'mole-s1.webp', text: '地鼠會拿著數字跑出來。先看上面的規則。' },
      { img: IMG + 'mole-s2.webp', text: '符合規則的地鼠，就快點牠！打到就加分。' },
      { img: IMG + 'mole-s3.webp', text: '不符合的不要打！打錯了，下面會告訴你為什麼。' },
      { img: IMG + 'mole-s4.webp', text: '規則會換喔！換的時候會念給你聽，看清楚再打。' }
    ]
  };
  function slidesOf(s) { return SLIDES[s.tut] || SLIDES.mole; }

  function open(s) {
    App.intro({
      mode: s.tut || 'mole', title: '關卡 ' + s.id + '　' + s.name, desc: s.desc, slides: slidesOf(s),
      start: function (box) {
        box.innerHTML = '<button class="big-btn go-btn" type="button" aria-label="開始">▶</button>';
        box.querySelector('button').onclick = function () { prepare(s); App.showScreen('mole'); App.countdown(function () { start(s); }); };
      }
    });
  }
  App.modes.mole = { open: open };
  $('help-mole').onclick = function () {
    if (!M || M.phase === 'end') return;
    var was = M.phase; M.phase = 'paused';
    App.replay({ title: '遊戲說明', slides: slidesOf(M.stage), onClose: function () { if (M && M.phase === 'paused') { M.phase = was; M.last = performance.now(); } } });
  };

  /* ---------- 畫面 ---------- */
  function buildBoard() {
    var h = '';
    for (var i = 0; i < HOLES; i++) {
      h += '<button type="button" class="hole" data-h="' + i + '" aria-label="第 ' + (i + 1) + ' 個洞">' +
        '<span class="mole">' + MOLE_SVG + '<span class="m-num"></span></span>' +
        '<span class="dirt"></span><span class="pop-txt"></span></button>';
    }
    $('m-board').innerHTML = h;
  }
  function holeEl(i) { return $('m-board').children[i]; }

  function setRule(rule) {
    $('m-ask-text').innerHTML = rule.ask;
    $('m-ask-say').dataset.say = rule.say;
  }

  function prepare(s) {
    buildBoard();
    $('m-title').textContent = s.id + ' ' + s.name;
    $('m-msg').textContent = ''; $('m-msg').className = 'm-msg';
    $('m-banner').hidden = true;
    $('m-count').textContent = 0; $('m-combo').hidden = true;
    $('m-fill').style.width = '100%'; $('m-sec').textContent = '2 分 0 秒';
    s._waves = s.waves();
    setRule(s._waves[0]);
  }

  function start(s) {
    if (!s._waves) prepare(s);
    var waves = s._waves; s._waves = null;
    M = { stage: s, waves: waves, wave: 0, t: 0, left: TIME, score: 0, combo: 0, hits: 0, wrong: 0, wrongs: [], missed: [], holes: [],
      nextSpawn: .3, phase: 'play', last: performance.now(), lastTick: 0, lastN: 0, cool: {} };
    for (var i = 0; i < HOLES; i++) M.holes.push(null);
    M.rule = waves[0];
    setRule(M.rule);
    App.showScreen('mole');
    hud();
    if (waves.length > 1 || App.store.autoSay) App.speak(M.rule.say);
    requestAnimationFrame(loop);
  }

  /* 時間越久：出來越頻繁、停留越短、同時越多隻 */
  function pace() {
    var e = TIME - M.left, k = Math.min(1, e / TIME);
    return { gap: 1.15 - .55 * k, stay: 2.5 - 1.1 * k, max: e < 25 ? 1 : e < 70 ? 2 : 3 };
  }

  function spawn() {
    var p = pace(), up = 0, free = [];
    M.holes.forEach(function (h, i) { if (h) up++; else if (!M.cool[i] || M.cool[i] < M.t) free.push(i); });
    if (up >= p.max || !free.length) return;
    var q, tries = 0;
    do { q = M.rule.gen(); tries++; } while (tries < 8 && (q.n === M.lastN || M.holes.some(function (h) { return h && h.q.n === q.n; })));
    M.lastN = q.n;
    var i = free[Math.floor(Math.random() * free.length)];
    var gold = q.ok && Math.random() < .08;
    M.holes[i] = { q: q, until: M.t + p.stay * (gold ? .8 : 1), gold: gold, done: false };
    var el = holeEl(i), num = el.querySelector('.m-num');
    num.textContent = q.n; num.classList.toggle('long', String(q.n).length >= 4);
    el.className = 'hole up' + (gold ? ' gold' : '');
  }

  function down(i, delay) {
    var el = holeEl(i);
    M.cool[i] = M.t + .35 + (delay || 0);
    M.holes[i] = null;
    setTimeout(function () { if (!M || M.holes[i]) return; el.classList.remove('up'); }, (delay || 0) * 1000);
    setTimeout(function () { if (!M || M.holes[i]) return; el.className = 'hole'; }, ((delay || 0) + .3) * 1000);
  }

  function popText(i, txt, cls) {
    var t = holeEl(i).querySelector('.pop-txt');
    t.textContent = txt; t.className = 'pop-txt ' + cls; void t.offsetWidth; t.className = 'pop-txt show ' + cls;
  }

  function msg(text, cls) { var el = $('m-msg'); el.textContent = text; el.className = 'm-msg ' + cls; void el.offsetWidth; el.classList.add('flash'); }

  function remember(list, q) { if (!list.some(function (x) { return x.n === q.n && x.rule === M.wave; })) list.push({ n: q.n, why: q.why, rule: M.wave }); }

  function whack(i) {
    if (!M || M.phase !== 'play') return;
    var h = M.holes[i], el = holeEl(i);
    if (!h || h.done) return;
    h.done = true;
    if (h.q.ok) {
      M.hits++; M.combo++;
      var add = (h.gold ? 30 : 10) + Math.min(M.combo - 1, 5) * 2;
      M.score += add;
      el.classList.add('hit');
      popText(i, '+' + add, 'good');
      SFX.good();
      if (M.combo >= 5 && M.combo % 5 === 0) msg('連續打中 ' + M.combo + ' 隻！', 'good');
      down(i, .45);
    } else {
      M.wrong++; M.combo = 0; M.score = Math.max(0, M.score - 5);
      remember(M.wrongs, h.q);
      el.classList.add('oops');
      popText(i, '－5', 'bad');
      msg(h.q.why + '，不要打喔！', 'bad');
      SFX.bad();
      down(i, .7);
    }
    hud();
  }

  /* 換規則：地鼠全部躲起來，橫幅念新規則，停 2 秒 */
  function nextWave() {
    M.wave++; M.rule = M.waves[M.wave];
    M.holes.forEach(function (h, i) { if (h) down(i); });
    setRule(M.rule);
    $('m-banner-text').innerHTML = '換規則！<br><b>' + App.esc(M.rule.banner) + '</b>';
    $('m-banner').hidden = false;
    $('m-msg').textContent = '';
    M.phase = 'switch'; M.switchUntil = M.t + 2.2; M.combo = 0;
    SFX.dash(); App.speak('換規則！' + M.rule.say);
    hud();
  }

  function hud() {
    var sec = Math.max(0, Math.ceil(M.left)), m = Math.floor(sec / 60), r = sec % 60;
    $('m-sec').textContent = (m ? m + ' 分 ' : '') + r + ' 秒';
    $('m-fill').style.width = Math.min(100, M.left / TIME * 100) + '%';
    $('m-fill').classList.toggle('low', M.left <= 10);
    $('m-count').textContent = M.score;
    $('m-combo').hidden = M.combo < 2; $('m-combo').textContent = '🔥' + M.combo;
  }

  function loop(now) {
    if (!M || M.phase === 'end' || $('mole').hidden) return;
    requestAnimationFrame(loop);
    var dt = Math.min((now - M.last) / 1000, .1); M.last = now;
    if (M.phase === 'switch') {
      M.t += dt; // 換規則的停頓不算在 2 分鐘裡，只用來計時停多久
      if (M.t >= M.switchUntil) { $('m-banner').hidden = true; M.phase = 'play'; M.nextSpawn = M.t + .2; }
      return;
    }
    if (M.phase !== 'play') return;
    M.t += dt; M.left -= dt;
    var per = TIME / M.waves.length;
    if (M.wave < M.waves.length - 1 && TIME - M.left >= per * (M.wave + 1)) { nextWave(); return; }
    if (M.t >= M.nextSpawn) { spawn(); M.nextSpawn = M.t + pace().gap * (.75 + Math.random() * .5); }
    M.holes.forEach(function (h, i) {
      if (!h || h.done || M.t < h.until) return;
      if (h.q.ok) {
        remember(M.missed, h.q);
        M.combo = 0;
        popText(i, '溜走了', 'miss');
        msg(h.q.n + ' 要打，溜走了！', 'miss');
      }
      down(i);
    });
    if (M.left <= 10 && Math.ceil(M.left) !== M.lastTick && M.left > 0) { M.lastTick = Math.ceil(M.left); SFX.tick(); }
    hud();
    if (M.left <= 0) finish();
  }

  $('m-board').addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-h]'); if (!b) return;
    e.preventDefault(); whack(+b.dataset.h);
  });
  /* 電腦：數字鍵 1～9 對應九個洞（跟數字鍵盤一樣排） */
  var KEYMAP = { '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 };
  document.addEventListener('keydown', function (e) {
    if (!M || $('mole').hidden || !$('ov-pause').hidden || !$('ov-end').hidden || !$('ov-tut').hidden) return;
    if (e.key in KEYMAP) { e.preventDefault(); whack(KEYMAP[e.key]); }
    else if (e.key === 'Escape') pause();
  });

  function pause() {
    if (!M || M.phase === 'end' || M.phase === 'paused') return;
    var was = M.phase, s = M.stage; M.phase = 'paused';
    App.pause({
      resume: function () { M.phase = was; M.last = performance.now(); },
      restart: function () { prepare(s); App.countdown(function () { start(s); }); },
      quit: function () { M = null; }
    });
  }
  $('m-pause').onclick = pause;
  document.addEventListener('visibilitychange', function () { if (document.hidden && M && (M.phase === 'play' || M.phase === 'switch') && !$('mole').hidden) pause(); });

  function finish() {
    M.phase = 'end'; M.left = 0; hud();
    $('m-banner').hidden = true;
    var s = M.stage, stars = M.hits >= 30 && M.wrong <= 3 ? 3 : M.hits >= 15 && M.wrong <= 6 ? 2 : 1;
    var r = App.saveResult(s.id, stars, M.score);
    var title = stars === 3 ? '打地鼠高手！太厲害了！' : stars === 2 ? '打得好！再快一點就三顆星！' : '完成了！看看下面再來挑戰！';
    var rv = '';
    if (M.wrongs.length) rv += '<h3>不該打的</h3><ul>' + M.wrongs.slice(0, 8).map(function (x) { return '<li>' + esc(x.why) + '</li>'; }).join('') + '</ul>';
    if (M.missed.length) rv += '<h3>該打卻溜走的</h3><ul>' + M.missed.slice(0, 8).map(function (x) { return '<li>' + esc(x.why) + '</li>'; }).join('') + '</ul>';
    var seen = {};
    M.waves.forEach(function (w) { if (!seen[w.ref]) { seen[w.ref] = 1; rv += w.ref; } });
    App.showEnd({
      stars: stars, title: title,
      scoreHTML: '打中 <b>' + M.hits + '</b> 隻，打錯 ' + M.wrong + ' 次，得到 ' + M.score + ' 分', isRecord: r.isRecord,
      bestText: '這關最高紀錄：' + r.rec.best + ' 分', reviewHTML: rv,
      again: function () { prepare(s); App.countdown(function () { start(s); }); },
      say: title + '打中' + M.hits + '隻，打錯' + M.wrong + '次。'
    });
    M.holes.forEach(function (h, i) { if (h) down(i); });
  }
  if (/[?&]debug\b/.test(location.search)) { window.__peekM = function () { return M; }; } // 測試、截說明圖用
})();
