/*
 * 共用：紀錄、念出來、音效、關卡地圖、通用對話框（準備、暫停、結算）
 * 每種遊戲（跑酷 run、限時挑戰 timed、小偵探 spot）在自己的檔案裡註冊到 App.modes。
 */
(function () {
  'use strict';

  /* 年級：學習樂園的五、六年級數學還沒有課本單元，先用 ?grade=5 / ?grade=6 打開「只有九九乘法」的版本（自己的紀錄、預設不加注音） */
  var GRADE = (/[?&]grade=([356])\b/.exec(location.search) || [])[1] || window.SITE_GRADE || '3'; // 每個網站的 js/site.js 設定年級
  var UNITS = GRADE === '5' ? window.MathQ.G5 : GRADE === '6' ? window.MathQ.G6 : window.MathQ.UNITS; // 五、六年級：翰林版
  var STAGES = {};
  UNITS.forEach(function (u) { u.stages.forEach(function (s) { s.unit = u; s.mode = s.mode || 'run'; STAGES[s.id] = s; }); });

  /* ---------- 紀錄（只存在這台裝置的瀏覽器） ---------- */
  var KEY = GRADE === '3' ? 'nani-math-3:v1' : 'math-g' + GRADE + ':v1';
  var store = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  store.stages = store.stages || {};
  if (store.sound === undefined) store.sound = true;
  if (store.zhuyin === undefined) store.zhuyin = GRADE === '3'; // 三年級預設加注音；五、六年級不用
  if ((store.v || 1) < 2) { // 第 2、3 單元從跑酷改成計時挑戰／小偵探，舊的分數意思不一樣了，清掉
    ['2-1', '2-2', '3-1', '3-2'].forEach(function (id) { delete store.stages[id]; });
    store.v = 2;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 無痕模式等：不存 */ } }

  /* 記錄一局的結果；回傳 { rec, isRecord } */
  function saveResult(id, stars, score) {
    var rec = store.stages[id] || {}, isRecord = score > (rec.best || 0);
    rec.stars = Math.max(rec.stars || 0, stars);
    rec.best = Math.max(rec.best || 0, score);
    rec.plays = (rec.plays || 0) + 1;
    store.stages[id] = rec; save();
    return { rec: rec, isRecord: isRecord };
  }

  function $(id) { return document.getElementById(id); }

  /* ---------- 手機版／網頁版 ----------
   * 學習樂園首頁一開始讓學生選，存在 localStorage 的 sedu:device（同一個 github.io 網址底下國語、數學共用），
   * 也會用 ?device=phone|web 帶進來。都沒有的話：觸控小螢幕當手機版，其他當網頁版。
   */
  var DEV_KEY = 'sedu:device';
  function detectDevice() {
    var m = /[?&]device=(phone|web)\b/.exec(location.search);
    if (m) { try { localStorage.setItem(DEV_KEY, m[1]); } catch (e) {} return m[1]; }
    try { var v = localStorage.getItem(DEV_KEY); if (v === 'phone' || v === 'web') return v; } catch (e) {}
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    return coarse && Math.min(screen.width, screen.height) < 600 ? 'phone' : 'web';
  }
  function setDevice(d) {
    App.device = d;
    try { localStorage.setItem(DEV_KEY, d); } catch (e) {}
    document.documentElement.classList.toggle('dev-phone', d === 'phone');
    document.documentElement.classList.toggle('dev-web', d === 'web');
    document.querySelectorAll('[data-dev]').forEach(function (b) { b.classList.toggle('on', b.dataset.dev === d); b.setAttribute('aria-pressed', b.dataset.dev === d); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 分數 3/8 顯示成上下的分數 */
  function fmt(s) { return esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>'); }
  function starsHTML(n) { var h = ''; for (var i = 0; i < 3; i++) h += '<span' + (i < n ? '' : ' class="off"') + '>⭐</span>'; return h; }
  /* 🔊 按鈕（班上有不識字的學生，看得到字的地方都要能念出來） */
  function plain(html) { return String(html).replace(/<[^>]+>/g, '').replace(/[⭐✔✏️💡📝🔍⏱️🏃]/g, '').replace(/\s+/g, ' ').trim(); }
  function sayBtn(text) { return '<button class="say" type="button" data-say="' + esc(plain(text)) + '" aria-label="念出來">🔊</button>'; }
  function show(id) { $(id).hidden = false; }
  function hide(id) { $(id).hidden = true; }

  /* ---------- 念出來（班上有不識字的學生） ---------- */
  function speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = 'zh-TW'; u.rate = .9;
      var v = speechSynthesis.getVoices().filter(function (x) { return /zh[-_]TW/i.test(x.lang); })[0];
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* 不支援就算了 */ }
  }
  /* 念完再做事（說明頁用）：不支援語音就照字數估時間 */
  function speakThen(text, done) {
    var called = false; function fin() { if (!called) { called = true; done(); } }
    if (!text || !('speechSynthesis' in window)) { setTimeout(fin, Math.max(1500, String(text).length * 200)); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = 'zh-TW'; u.rate = .9;
      var v = speechSynthesis.getVoices().filter(function (x) { return /zh[-_]TW/i.test(x.lang); })[0];
      if (v) u.voice = v;
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
      // 沒有中文語音、或根本沒開始念：照字數估時間
      setTimeout(function () { if (!speechSynthesis.speaking && !speechSynthesis.pending) setTimeout(fin, Math.max(1200, text.length * 200)); }, 1200);
    } catch (e) { setTimeout(fin, Math.max(1500, text.length * 200)); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-say]');
    if (b) { e.preventDefault(); speak(b.dataset.say); }
  });

  /* ---------- 音效（不用音檔，直接合成） ---------- */
  var actx = null;
  function tone(notes, type, vol) {
    if (!store.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime;
      notes.forEach(function (n) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'triangle'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0, t + n[1]);
        g.gain.linearRampToValueAtTime(vol || .18, t + n[1] + .02);
        g.gain.exponentialRampToValueAtTime(.001, t + n[1] + n[2]);
        o.connect(g); g.connect(actx.destination);
        o.start(t + n[1]); o.stop(t + n[1] + n[2] + .05);
      });
    } catch (e) { /* 沒有音效也能玩 */ }
  }
  var SFX = {
    pick: function () { tone([[660, 0, .08]], 'sine', .12); },
    key: function () { tone([[520, 0, .05]], 'sine', .08); },
    dash: function () { tone([[440, 0, .1], [660, .06, .1], [880, .12, .15]], 'square', .06); },
    good: function () { tone([[784, 0, .12], [1047, .1, .25]], 'triangle', .2); },
    bad: function () { tone([[220, 0, .25], [165, .15, .35]], 'sawtooth', .08); },
    tick: function () { tone([[1200, 0, .04]], 'square', .05); },
    win: function () { tone([[523, 0, .15], [659, .15, .15], [784, .3, .15], [1047, .45, .4]], 'triangle', .2); }
  };

  /* =====================================================
   * 地圖
   * ===================================================== */
  var MODE_IC = { run: '🏃', timed: '⏱️', spot: '🔍', round: '🎯', nine: '🗺️' };
  function renderMap() {
    var total = 0, html = '', soon = '';
    UNITS.forEach(function (u) {
      var no = typeof u.id === 'number' ? '第 ' + u.id + ' 單元' : '';
      if (!u.stages.length) {
        soon += '<div class="soon-card"><span>' + u.ic + '</span><span>' + (no ? no + ' ' : '') + esc(u.name) + '</span><span class="tag">準備中</span></div>';
        return;
      }
      html += '<section class="unit"><h2 class="unit-title"><span>' + u.ic + '</span><span class="no">' + no + '</span><span>' + esc(u.name) + '</span></h2><div class="stages">';
      u.stages.forEach(function (s) {
        var rec = store.stages[s.id] || {}, st = rec.stars || 0;
        total += st;
        var best = !rec.plays && !rec.best ? '還沒玩過' : s.mode === 'timed' ? '最多答對 ' + (rec.best || 0) + ' 題' : '最高 ' + (rec.best || 0) + ' 分';
        var mn = s.label || modeName(s.mode), starRow = starsHTML(st);
        if (s.mode === 'nine') { // 九九：顯示破了幾座島
          var medals = 0;
          [2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(function (t) { var r9 = store.stages['99-' + t]; if (r9 && r9.stars) { medals++; total += r9.stars; } });
          starRow = '<span class="medals">🏅 × ' + medals + '</span>'; best = '破了 ' + medals + ' / 9 座島';
        }
        html += '<div class="cell">' + sayBtn((s.mode === 'nine' ? '' : '關卡 ' + s.id + '，') + s.name + '，' + mn + '。' + s.desc) +
          '<button class="stage-card" type="button" data-stage="' + s.id + '" data-ic="' + (s.ic || MODE_IC[s.mode]) + '">' +
          '<span class="sid">' + (s.mode === 'nine' ? '每天練一練' : '關卡 ' + s.id + '・' + mn) + '</span><span class="sname">' + esc(s.name) + '</span><span class="sdesc">' + esc(s.desc) + '</span>' +
          '<span class="srow"><span class="stars">' + starRow + '</span><span class="best">' + best + '</span></span></button></div>';
      });
      html += '</div></section>';
    });
    $('units').innerHTML = html + (soon ? '<div class="soon-grid">' + soon + '</div>' : '');
    $('total-stars').textContent = total;
  }
  function modeName(m) { return { run: '跑酷', timed: '2 分鐘挑戰', spot: '小偵探' }[m]; }
  $('units').addEventListener('click', function (e) {
    var b = e.target.closest('[data-stage]');
    if (b) { var s = STAGES[b.dataset.stage]; App.modes[s.mode].open(s); }
  });
  /* ---------- 注音：全站改用注音字型，新出現的文字自動標上正確的破音字讀音 ---------- */
  var zyObserver = null;
  function walk(node) {
    if (node.nodeType === 3) {
      var t = node.nodeValue, m = window.Zhuyin.mark(t);
      if (m !== t) node.nodeValue = m;
      return;
    }
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(node.nodeName)) return;
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function applyZhuyin() {
    var on = !!store.zhuyin;
    document.documentElement.classList.toggle('zhuyin', on);
    if (zyObserver) { zyObserver.disconnect(); zyObserver = null; }
    if (!on || !window.Zhuyin || !window.MutationObserver) return;
    walk(document.body);
    zyObserver = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') walk(m.target);
        else Array.prototype.forEach.call(m.addedNodes, walk);
      });
    });
    zyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  $('opt-zhuyin').checked = !!store.zhuyin;
  $('opt-zhuyin').onchange = function () { store.zhuyin = this.checked; save(); applyZhuyin(); };

  document.querySelectorAll('[data-dev]').forEach(function (b) { b.onclick = function () { setDevice(b.dataset.dev); SFX.pick(); }; });

  $('opt-autosay').checked = !!store.autoSay;
  $('opt-sound').checked = !!store.sound;
  $('opt-autosay').onchange = function () { store.autoSay = this.checked; save(); };
  $('opt-sound').onchange = function () { store.sound = this.checked; save(); if (this.checked) SFX.good(); };

  /* 切換畫面：map、game（跑酷）、timed、spot */
  function showScreen(id) {
    ['map', 'game', 'timed', 'spot', 'round', 'nine'].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  function toMap() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    clearTimeout(countTimer);
    ['ov-tut', 'ov-pause', 'ov-end', 'ov-count', 'ov-q', 'ov-explain'].forEach(hide);
    showScreen('map'); renderMap();
  }

  /* ---------- 通用對話框 ---------- */
  var pauseCb = null;
  function pause(o) { pauseCb = o; show('ov-pause'); } // { resume, restart }
  $('pause-resume').onclick = function () { hide('ov-pause'); if (pauseCb) pauseCb.resume(); };
  $('pause-restart').onclick = function () { hide('ov-pause'); if (pauseCb) pauseCb.restart(); };
  $('pause-quit').onclick = function () { hide('ov-pause'); if (pauseCb && pauseCb.quit) pauseCb.quit(); toMap(); };

  /* ---------- 倒數 3、2、1 ----------（fast：答完題繼續跑時用，快一點） */
  var countTimer = null;
  function countdown(cb, fast) {
    var el = $('ov-count'), num = $('count-num'), n = 3, gap = fast ? 450 : 800;
    clearTimeout(countTimer);
    show('ov-count');
    function step() {
      if (n > 0) { num.textContent = n; num.className = 'pop'; void num.offsetWidth; num.className = 'pop go'; SFX.tick(); n--; countTimer = setTimeout(step, gap); }
      else {
        num.textContent = fast ? '跑！' : '開始！'; num.className = 'pop'; void num.offsetWidth; num.className = 'pop go start'; SFX.good();
        countTimer = setTimeout(function () { hide('ov-count'); cb(); }, fast ? 350 : 600);
      }
    }
    step();
  }

  var againCb = null;
  function showEnd(o) { // { stars, title, scoreHTML, isRecord, bestText, reviewHTML, again, say }
    $('end-stars').innerHTML = starsHTML(o.stars);
    $('end-title').textContent = o.title;
    $('end-score').innerHTML = o.scoreHTML;
    $('end-record').hidden = !o.isRecord;
    $('end-best').textContent = o.bestText || '';
    $('end-review').innerHTML = o.reviewHTML || '';
    $('end-say').dataset.say = plain(o.say || o.title);
    againCb = o.again; show('ov-end');
    if (o.stars > 0) SFX.win();
    speak(o.say || o.title);
  }
  $('end-again').onclick = function () { hide('ov-end'); if (againCb) againCb(); };
  $('end-map').onclick = function () { hide('ov-end'); toMap(); };

  /* ---------- 直式（可以點的格子） ----------
   * o = { a, op, b, C(答案最多幾位), mark(i) → 上方小格 HTML, ans(i) → 答案格 HTML,
   *       digit(row, i, ch) → 題目數字的 HTML（可省略；row 0＝上面的數、1＝下面的數） }；i 是位數（0＝個位）
   */
  function vgrid(o) {
    var cols = o.C + 1, h = '', sa = String(o.a), sb = String(o.b);
    function digit(s, i, row) {
      var ch = i < s.length ? s[s.length - 1 - i] : '';
      return ch && o.digit ? o.digit(row, i, ch) : ch;
    }
    for (var c = 0; c < cols; c++) h += '<span class="vg-mark">' + (c && o.mark ? o.mark(cols - 1 - c) : '') + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-d">' + (c ? digit(sa, cols - 1 - c, 0) : '') + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-d ul">' + (c ? digit(sb, cols - 1 - c, 1) : o.op) + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-a">' + (c ? o.ans(cols - 1 - c) : '') + '</span>';
    return '<div class="vg" style="--cols:' + cols + '">' + h + '</div>';
  }

  window.App = {
    vgrid: vgrid, sayBtn: sayBtn, fmt: fmt, plain: plain, countdown: countdown, setDevice: setDevice, device: 'web',
    UNITS: UNITS, STAGES: STAGES, store: store, save: save, saveResult: saveResult,
    $: $, esc: esc, starsHTML: starsHTML, show: show, hide: hide, speak: speak, SFX: SFX,
    showScreen: showScreen, toMap: toMap, speakThen: speakThen, pause: pause, showEnd: showEnd, renderMap: renderMap,
    modes: {}
  };
  if (GRADE !== '3') {
    var gname = GRADE === '5' ? '五' : '六';
    document.title = '數學' + gname + '上學習樂園';
    document.querySelector('.map-hero h1').innerHTML = '<span class="brand">數學</span>' + gname + '上學習樂園';
    $('grade-sub').textContent = '翰林版・' + gname + '年級上學期';
    document.querySelector('.map-hero .say').dataset.say = '數學' + gname + '上學習樂園。選一個關卡開始練習吧！';
  }
  setDevice(detectDevice());
  renderMap();
  applyZhuyin();
})();
