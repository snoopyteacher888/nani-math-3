/*
 * 遊戲說明（老師要求）：一頁一小塊遊戲畫面＋一句說明，自動念出來（不用按喇叭）。
 * 不用等念完就能滑到下一頁（會自己讀字的學生）；翻到最後一頁才出現「開始」。
 * 第一次玩這種遊戲一定要看完整套；之後進來直接看到開始畫面，可以按「📖 再看一次說明」。
 * 遊戲中上方的 📖 也能隨時再看一次（會先暫停）。
 *
 * App.intro({ mode, title, desc, slides:[{ img, text, say? }], start: function (box) { 放開始按鈕 } })
 * App.replay({ title, slides, onClose })：遊戲中再看一次
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, store = App.store;
  store.seenTut = store.seenTut || {};

  var cur = null; // { slides, i, heard:{}, gate, kind:'intro'|'replay', onClose, token }

  function narrate(text, done) {
    var token = cur.token = (cur.token || 0) + 1, finished = false, t0 = Date.now();
    var minMs = Math.max(2000, text.length * 170); // 至少要給這麼多時間（沒有中文語音的裝置會「馬上念完」）
    function end() {
      if (finished || !cur || cur.token !== token) return;
      var wait = minMs - (Date.now() - t0);
      if (wait > 0) { setTimeout(end, wait); return; }
      finished = true; done();
    }
    App.speakThen(text, end);
    setTimeout(end, Math.max(1800, text.length * 240) * 1.8 + 1500); // 有些手機念完不會通知，最晚這時候也讓孩子往下
  }

  function render(dir) {
    var s = cur.slides[cur.i], last = cur.i === cur.slides.length - 1;
    $('tut-title').textContent = cur.title;
    var img = $('tut-img');
    img.src = s.img; img.alt = s.text;
    $('tut-text').textContent = s.text;
    $('tut-page').textContent = (cur.i + 1) + ' / ' + cur.slides.length;
    var st = $('tut-stage'); st.className = 'tut-stage' + (dir ? (dir > 0 ? ' in-r' : ' in-l') : '');
    $('tut-dots').innerHTML = cur.slides.map(function (x, k) { return '<span class="' + (k === cur.i ? 'on' : cur.heard[k] ? 'done' : '') + '"></span>'; }).join('');
    $('tut-prev').disabled = cur.i === 0;
    updateNext();
    if (!cur.heard[cur.i]) {
      var i = cur.i;
      narrate(s.say || s.text, function () { cur.heard[i] = true; if (cur.i === i) render(0); });
    }
    if (last) allDone(); // 翻到最後一頁就可以開始
  }
  function canNext() { return true; } // 老師：有些學生會自己讀字，不用等念完就能往下
  function updateNext() {
    var last = cur.i === cur.slides.length - 1;
    $('tut-next').hidden = last;
    $('tut-next').disabled = !canNext();
    $('tut-wait').style.visibility = 'hidden';
  }
  function go(d) {
    if (!cur) return;
    var n = cur.i + d;
    if (n < 0 || n >= cur.slides.length) return;
    if (d > 0 && !canNext()) { nudge(); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    cur.i = n; App.SFX.pick(); render(d);
  }
  function nudge() { var w = $('tut-wait'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); }

  function allDone() {
    if (cur.kind === 'intro') {
      store.seenTut[cur.mode] = true; App.save();
      $('tut-start').hidden = false;

    }
  }

  /* 左右滑 */
  var sx = null, sy = null;
  $('tut-stage').addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
  $('tut-stage').addEventListener('pointerup', function (e) {
    if (sx == null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });
  $('tut-next').onclick = function () { go(1); };
  $('tut-prev').onclick = function () { go(-1); };
  document.addEventListener('keydown', function (e) {
    if (!cur || $('ov-tut').hidden) return;
    if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
  });

  function open(o, kind) {
    cur = { title: o.title, slides: o.slides, i: 0, heard: {}, gate: true, kind: kind, mode: o.mode, onClose: o.onClose, token: 0 };
    $('tut-learn').hidden = false; $('tut-menu').hidden = true;
    $('tut-start').hidden = kind !== 'intro' || !store.seenTut[o.mode];
    $('tut-done').hidden = true;
    $('tut-resume').hidden = kind !== 'replay'; // 遊戲中再看一次：隨時可以回去玩
    $('tut-back').hidden = kind !== 'intro';
    App.show('ov-tut');
    render(0);
  }
  function close() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (cur) cur.token++;
    App.hide('ov-tut');
  }

  /* 從地圖點關卡 */
  App.intro = function (o) {
    $('tut-start').innerHTML = ''; o.start($('tut-start'));
    $('tut-start').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', close); });
    if (!store.seenTut[o.mode]) { open(o, 'intro'); return; }
    // 看過了：開始畫面＋再看一次說明
    cur = { title: o.title, slides: o.slides, mode: o.mode, kind: 'intro', i: 0, heard: {}, token: 0 };
    $('tut-title').textContent = o.title;
    $('tut-menu-desc').textContent = o.desc || '';
    $('tut-menu-img').src = o.slides[0].img;
    $('tut-learn').hidden = true; $('tut-menu').hidden = false;
    $('tut-start').hidden = false; $('tut-done').hidden = true; $('tut-resume').hidden = true; $('tut-back').hidden = false;
    $('tut-again').onclick = function () { open(o, 'intro'); };
    App.show('ov-tut');
    App.speak(o.title + '。' + (o.desc || ''));
  };
  /* 遊戲中按 📖 */
  App.replay = function (o) { open(o, 'replay'); };
  $('tut-resume').onclick = function () { var cb = cur && cur.onClose; close(); if (cb) cb(); };
  $('tut-back').onclick = close;
})();
