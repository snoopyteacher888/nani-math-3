/*
 * 共用：紀錄、念出來、音效、關卡地圖、通用對話框（準備、暫停、結算）
 * 每種遊戲（跑酷 run、限時挑戰 timed、小偵探 spot）在自己的檔案裡註冊到 App.modes。
 */
(function () {
  'use strict';

  var UNITS = window.MathQ.UNITS;
  var STAGES = {};
  UNITS.forEach(function (u) { u.stages.forEach(function (s) { s.unit = u; s.mode = s.mode || 'run'; STAGES[s.id] = s; }); });

  /* ---------- 紀錄（只存在這台裝置的瀏覽器） ---------- */
  var KEY = 'nani-math-3:v1';
  var store = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  store.stages = store.stages || {};
  if (store.sound === undefined) store.sound = true;
  if ((store.v || 1) < 2) { // 第 2、3 單元從跑酷改成 60 秒挑戰／小偵探，舊的分數意思不一樣了，清掉
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function starsHTML(n) { var h = ''; for (var i = 0; i < 3; i++) h += '<span' + (i < n ? '' : ' class="off"') + '>⭐</span>'; return h; }
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
  var MODE_IC = { run: '🏃', timed: '⏱️', spot: '🔍' };
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
        html += '<button class="stage-card" type="button" data-stage="' + s.id + '" data-ic="' + MODE_IC[s.mode] + '">' +
          '<span class="sid">關卡 ' + s.id + '・' + modeName(s.mode) + '</span><span class="sname">' + esc(s.name) + '</span><span class="sdesc">' + esc(s.desc) + '</span>' +
          '<span class="srow"><span class="stars">' + starsHTML(st) + '</span><span class="best">' + best + '</span></span></button>';
      });
      html += '</div></section>';
    });
    $('units').innerHTML = html + (soon ? '<div class="soon-grid">' + soon + '</div>' : '');
    $('total-stars').textContent = total;
  }
  function modeName(m) { return { run: '跑酷', timed: '60 秒挑戰', spot: '小偵探' }[m]; }
  $('units').addEventListener('click', function (e) {
    var b = e.target.closest('[data-stage]');
    if (b) { var s = STAGES[b.dataset.stage]; App.modes[s.mode].open(s); }
  });
  $('opt-autosay').checked = !!store.autoSay;
  $('opt-sound').checked = !!store.sound;
  $('opt-autosay').onchange = function () { store.autoSay = this.checked; save(); };
  $('opt-sound').onchange = function () { store.sound = this.checked; save(); if (this.checked) SFX.good(); };

  /* 切換畫面：map、game（跑酷）、timed、spot */
  function showScreen(id) {
    ['map', 'game', 'timed', 'spot'].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  function toMap() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    ['ov-ready', 'ov-pause', 'ov-end'].forEach(hide);
    showScreen('map'); renderMap();
  }

  /* ---------- 通用對話框 ---------- */
  var readyCb = null;
  function ready(o) { // { title, desc, tips:[], onStart }
    $('ready-title').textContent = o.title;
    $('ready-desc').textContent = o.desc || '';
    $('ready-tips').innerHTML = (o.tips || []).map(function (t) { return '<p class="tip">' + t + '</p>'; }).join('');
    readyCb = o.onStart; show('ov-ready');
    speak(o.say || o.title);
  }
  $('ready-go').onclick = function () { hide('ov-ready'); if (readyCb) readyCb(); };
  $('ready-back').onclick = function () { hide('ov-ready'); };

  var pauseCb = null;
  function pause(o) { pauseCb = o; show('ov-pause'); } // { resume, restart }
  $('pause-resume').onclick = function () { hide('ov-pause'); if (pauseCb) pauseCb.resume(); };
  $('pause-restart').onclick = function () { hide('ov-pause'); if (pauseCb) pauseCb.restart(); };
  $('pause-quit').onclick = function () { hide('ov-pause'); if (pauseCb && pauseCb.quit) pauseCb.quit(); toMap(); };

  var againCb = null;
  function showEnd(o) { // { stars, title, scoreHTML, isRecord, bestText, reviewHTML, again, say }
    $('end-stars').innerHTML = starsHTML(o.stars);
    $('end-title').textContent = o.title;
    $('end-score').innerHTML = o.scoreHTML;
    $('end-record').hidden = !o.isRecord;
    $('end-best').textContent = o.bestText || '';
    $('end-review').innerHTML = o.reviewHTML || '';
    againCb = o.again; show('ov-end');
    if (o.stars > 0) SFX.win();
    speak(o.say || o.title);
  }
  $('end-again').onclick = function () { hide('ov-end'); if (againCb) againCb(); };
  $('end-map').onclick = function () { hide('ov-end'); toMap(); };

  /* ---------- 直式（可以點的格子） ----------
   * o = { a, op, b, C(答案最多幾位), mark(i) → 上方小格 HTML, ans(i) → 答案格 HTML }；i 是位數（0＝個位）
   */
  function vgrid(o) {
    var cols = o.C + 1, h = '', sa = String(o.a), sb = String(o.b);
    function digit(s, i) { return i < s.length ? s[s.length - 1 - i] : ''; }
    for (var c = 0; c < cols; c++) h += '<span class="vg-mark">' + (c && o.mark ? o.mark(cols - 1 - c) : '') + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-d">' + (c ? digit(sa, cols - 1 - c) : '') + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-d ul">' + (c ? digit(sb, cols - 1 - c) : o.op) + '</span>';
    for (c = 0; c < cols; c++) h += '<span class="vg-a">' + (c ? o.ans(cols - 1 - c) : '') + '</span>';
    return '<div class="vg" style="--cols:' + cols + '">' + h + '</div>';
  }

  window.App = {
    vgrid: vgrid,
    UNITS: UNITS, STAGES: STAGES, store: store, save: save, saveResult: saveResult,
    $: $, esc: esc, starsHTML: starsHTML, show: show, hide: hide, speak: speak, SFX: SFX,
    showScreen: showScreen, toMap: toMap, ready: ready, pause: pause, showEnd: showEnd, renderMap: renderMap,
    modes: {}
  };
  renderMap();
})();
