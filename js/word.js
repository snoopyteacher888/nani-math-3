/*
 * 先做一題應用題，才能玩（練閱讀理解和推理）
 *
 * 點任何關卡（和「再玩一次」「重新開始」）之前，先做 1 題「該單元」的應用題（題庫在 js/wordq.js）：
 *   第 1 步 點出問的是哪一句 → 第 2 步 選算法（兩步驟的題目選兩次）→ 最後算出答案
 * 每一步答錯會說明再重來；錯兩次會把答案標出來，一定做得完。
 * 學輔班很多孩子共用一台電腦，所以不記任何東西：誰要玩，誰就先做一題。
 * 網址加 ?noword 可以跳過（測試用）。
 *
 * 也提供 App.scratch：螢幕上的計算紙（半透明，蓋在題目上還看得到題目）。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, fmt = App.fmt, SFX = App.SFX, speak = App.speak;
  var BANK = (window.MathQ.WORD || {})[App.GRADE] || {};
  var SKIP = /[?&]noword\b/.test(location.search);
  var W = null;

  function sayText(s) { return String(s).replace(/(\d+)\/(\d+)/g, '$2分之$1').replace(/□/g, '方框').replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/＋/g, '加').replace(/－/g, '減').replace(/(\d+):(\d+)/g, '$1比$2'); }
  function val(x) { x = String(x); if (x.indexOf('/') > 0) { var p = x.split('/'); return +p[0] / +p[1]; } return parseFloat(x); }
  function same(a, b) { return Math.abs(a - b) < 1e-6; }

  /* ---------- 入口：App.gate(關卡, 做完要做的事) ---------- */
  App.gate = function (s, cb) {
    App.curStage = s;
    var gen = s && s.unit && BANK[String(s.unit.id)];
    if (SKIP || !gen) return cb();
    var prev = ['map', 'game', 'timed', 'spot', 'round', 'nine', 'mole'].filter(function (id) { return !$(id).hidden; })[0] || 'map';
    W = { p: gen(), cb: cb, prev: prev, phase: 'ask', op: 0, tries: 0, vals: ['', ''], cur: 0, work: [] };
    App.showScreen('word');
    App.scratch.clear();
    render();
    if (App.store.autoSay) speak(allSay());
  };
  function allSay() { return sayText(W.p.sents.join('')); }

  /* ---------- 畫面 ---------- */
  function tokenize(s) { // 數字變成可以點的
    return esc(s).replace(/\d+(?:\.\d+)?(?:\/\d+)?/g, function (m) { return '<span class="wn" data-v="' + m + '">' + fmt(m) + '</span>'; });
  }
  function totalSteps() { return 2 + W.p.steps.length; }
  function stepNo() { return W.phase === 'ask' ? 1 : W.phase === 'op' ? 2 + W.op : totalSteps(); }
  function render() {
    var p = W.p;
    $('w-text').innerHTML = p.sents.map(function (s, i) {
      var cls = 'ws' + (W.askDone && i === p.ask ? ' ask-ok' : '') + (W.phase === 'ask' && W.tries >= 2 && i === p.ask ? ' hint' : '');
      return '<span class="' + cls + '" data-s="' + i + '">' + tokenize(s) + '</span>';
    }).join('');
    $('w-text').className = 'w-text phase-' + W.phase;
    markNums();
    $('w-work').innerHTML = W.work && W.work.length ? '<span class="w-work-h">算法</span>' + W.work.map(function (w, i) { return '<span class="w-line">' + (W.work.length > 1 ? (i + 1) + '. ' : '') + fmt(w) + '</span>'; }).join('') : '';
    $('w-prog').textContent = W.phase === 'done' ? '完成了！' : '第 ' + stepNo() + ' 步／共 ' + totalSteps() + ' 步';
    var pr = prompt();
    $('w-prompt').innerHTML = fmt(pr); $('w-psay').dataset.say = sayText(pr);
    renderArea();
    if (W.phase !== 'ask') requestAnimationFrame(function () { var el = W && W.phase === 'ans' ? $('w-area') : $('w-step-box'); if (el) el.scrollIntoView({ block: W && W.phase === 'ans' ? 'end' : 'nearest', behavior: 'smooth' }); });
  }
  function prompt() {
    var n = W.p.steps.length;
    if (W.phase === 'ask') return '這題問的是什麼？點題目裡「問問題」的那一句。';
    if (W.phase === 'op') { var q = W.p.steps[W.op].q; return q || (n === 1 ? '要怎麼算？' : W.op === 0 ? '第一步要先算什麼？' : '接著要怎麼算？（□ 是上一步算出來的數）'); }
    if (W.phase === 'ans') return '算出答案。可以按右上角的 ✏️ 打開計算紙。';
    return '';
  }
  function markNums() {} // 數字在題目裡用藍色粗體標出來，方便找
  function renderArea() {
    var a = $('w-area'), p = W.p;
    $('w-keypad').hidden = W.phase !== 'ans';
    if (W.phase === 'ask') a.innerHTML = '';
    else if (W.phase === 'op') {
      var st = p.steps[W.op];
      a.innerHTML = '<div class="w-opts">' + st.opts.map(function (o, i) {
        return '<button class="qa' + (W.tries >= 2 && o === st.ans ? ' hint' : '') + '" type="button" data-o="' + i + '">' + fmt(o) + '</button>';
      }).join('') + '</div>';
    } else if (W.phase === 'ans') {
      var frac = String(p.ans).indexOf('/') > 0;
      function box(i, label) { return '<button type="button" class="box' + (W.cur === i ? ' cur' : '') + '" data-f="' + i + '" aria-label="' + label + '">' + esc(W.vals[i]) + '</button>'; }
      a.innerHTML = '<div class="w-ans">' + (frac ? '<span class="ffrac">' + box(0, '分子') + '<span class="fline"></span>' + box(1, '分母') + '</span><span class="fhint">上面填分子，下面填分母</span>' : box(0, '答案')) +
        (p.unit ? '<span class="w-unit">' + esc(p.unit) + '</span>' : '') + '</div>';
      $('w-dot').style.visibility = !frac && String(p.ans).indexOf('.') > 0 ? 'visible' : 'hidden';
    } else { // done
      a.innerHTML = '<div class="w-done"><p class="ex-line">' + fmt(p.explain) + '</p><button class="big-btn go-btn" type="button" id="w-go">開始玩 ▶</button></div>';
    }
  }
  function fb(text, cls) { var el = $('w-fb'); el.innerHTML = fmt(text); el.className = 'w-fb ' + (cls || ''); el.hidden = !text; if (text) { el.classList.remove('shake'); void el.offsetWidth; if (cls === 'bad') el.classList.add('shake'); } }
  function next(phase) { W.phase = phase; W.tries = 0; render(); }
  function good(msg) { SFX.good(); fb(msg, 'good'); }
  function bad(msg) { SFX.bad(); W.tries++; fb(msg, 'bad'); render(); speak(sayText(msg)); }

  /* ---------- 第 1 步：問的是哪一句 ---------- */
  $('w-text').addEventListener('click', function (e) {
    if (!W) return;
    if (W.phase === 'ask') {
      var s = e.target.closest('.ws'); if (!s) return;
      if (+s.dataset.s === W.p.ask) { W.askDone = true; W.work = []; good('對！這題問的是：' + W.p.sents[W.p.ask]); next('op'); }
      else bad('這一句是在說「已經知道的事」。問問題的句子通常有「幾」「多少」或問號「？」。');
    }
  });
  /* ---------- 第 2 步：選算法；最後算答案 ---------- */
  $('w-area').addEventListener('click', function (e) {
    if (!W) return;
    var o = e.target.closest('[data-o]');
    if (o && W.phase === 'op') {
      var st = W.p.steps[W.op], c = st.opts[+o.dataset.o];
      if (c === st.ans) {
        if (!st.noWork) W.work.push(c); good('對！' + st.why);
        if (W.op + 1 < W.p.steps.length) { W.op++; W.tries = 0; render(); } else next('ans');
      } else bad('再想想：' + st.why);
      return;
    }
    var f = e.target.closest('[data-f]');
    if (f && W.phase === 'ans') { W.cur = +f.dataset.f; SFX.key(); renderArea(); return; }
    if (e.target.closest('#w-go')) finish();
  });
  /* ---------- 最後：算答案 ---------- */
  function key(k) {
    if (!W || W.phase !== 'ans') return;
    var frac = String(W.p.ans).indexOf('/') > 0;
    if (k === 'del') { W.vals[W.cur] = W.vals[W.cur].slice(0, -1); SFX.key(); }
    else if (k === 'ok') return check();
    else if (k === '.') { if (W.vals[W.cur].indexOf('.') < 0 && !frac) W.vals[W.cur] += W.vals[W.cur] ? '.' : '0.'; SFX.key(); }
    else if (W.vals[W.cur].length < 8) { W.vals[W.cur] += k; SFX.key(); if (frac && W.cur === 0) { /* 分子填好可以點分母 */ } }
    renderArea();
  }
  function check() {
    var p = W.p, frac = String(p.ans).indexOf('/') > 0, got;
    if (frac) { if (W.vals[0] === '' || W.vals[1] === '' || +W.vals[1] === 0) { bad('分子和分母都要填喔。'); return; } got = +W.vals[0] / +W.vals[1]; }
    else { if (W.vals[0] === '') { bad('先填答案喔。'); return; } got = parseFloat(W.vals[0]); }
    if (same(got, val(p.ans))) { SFX.win(); W.phase = 'done'; fb('答對了！太棒了！', 'good'); render(); speak('答對了！' + sayText(p.explain)); return; }
    if (W.tries >= 1) { SFX.bad(); W.phase = 'done'; fb('答案是 ' + p.ans + (p.unit ? ' ' + p.unit : '') + '。看看下面怎麼算，下次一定可以！', 'bad'); render(); speak(sayText('答案是' + p.ans + p.unit + '。' + p.explain)); return; }
    bad('還不對，再算一次。可以用計算紙列直式喔。');
  }
  $('w-keypad').addEventListener('click', function (e) { var b = e.target.closest('[data-wk]'); if (b) key(b.dataset.wk); });
  document.addEventListener('keydown', function (e) {
    if (!W || $('word').hidden || !$('scratch').hidden) return;
    if (W.phase === 'ans') {
      if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === '.') key('.'); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Enter') key('ok');
      else if (e.key === 'Tab' && String(W.p.ans).indexOf('/') > 0) { e.preventDefault(); W.cur = 1 - W.cur; renderArea(); }
    } else if (W.phase === 'done' && e.key === 'Enter') finish();
  });
  function finish() {
    var w = W; W = null; App.scratch.close(); App.scratch.clear(); $('w-fb').hidden = true;
    App.showScreen(w.prev); w.cb();
  }
  $('w-say').onclick = function () { if (W) speak(allSay()); };
  $('w-back').onclick = function () { W = null; App.scratch.close(); App.toMap(); };
  $('w-scratch').onclick = function () { App.scratch.open(); };

  /* =====================================================
   * 計算紙
   * ===================================================== */
  var cv = $('scratch-cv'), ctx = cv.getContext('2d'), tool = 'pen', drawing = false, last = null, saved = null;
  function fit() {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width === Math.round(w * dpr) && cv.height === Math.round(h * dpr)) return;
    var old = saved; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (old) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
  }
  function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); dot(last); });
  cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); line(last, p); last = p; });
  ['pointerup', 'pointercancel'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
  function style() { ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'; ctx.strokeStyle = ctx.fillStyle = '#1F3E6B'; ctx.lineWidth = tool === 'eraser' ? 28 : 3.5; }
  function dot(p) { style(); ctx.beginPath(); ctx.arc(p[0], p[1], ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); }
  function line(a, b) { style(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function snapshot() { if (!cv.width) return; var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); saved = c; }
  document.querySelectorAll('[data-tool]').forEach(function (b) {
    b.onclick = function () { tool = b.dataset.tool; document.querySelectorAll('[data-tool]').forEach(function (x) { x.classList.toggle('on', x === b); }); };
  });
  $('scratch-clear').onclick = function () { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); saved = null; };
  $('scratch-close').onclick = function () { App.scratch.close(); };
  window.addEventListener('resize', function () { if (!$('scratch').hidden) { snapshot(); fit(); } });
  App.scratch = {
    open: function () { $('scratch').hidden = false; fit(); },
    close: function () { if ($('scratch').hidden) return; snapshot(); $('scratch').hidden = true; },
    clear: function () { saved = null; if (cv.width) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); } }
  };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-scratch]')) App.scratch.open(); });

  if (/[?&]debug\b/.test(location.search)) window.__peekW = function () { return W; };
})();
