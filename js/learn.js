/*
 * 減少亂猜、答錯學會怎麼算（跑酷和 10 題小遊戲共用）
 *
 * 1. App.readLock：題目出現後，選項先變灰，讀完題目才能點（題目越長等越久，2～8 秒）；
 *    按 🔊 聽完題目也會馬上開放。開放後 1.5 秒內就答錯，提醒「先把題目讀完喔」。
 * 2. App.stepper：答錯後一步一步看解法：先想什麼 → 算式一行一行 → 最後才是答案，每一步都念出來。
 * 3. App.twinOf：找一題同類型、只換數字的題目，馬上再做一次（背答案沒有用）。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, fmt = App.fmt;
  function sayOf(html) { return App.plain(html).replace(/(\d+)又(\d+)\/(\d+)/g, '$1又$3分之$2').replace(/(\d+)\/(\d+)/g, '$2分之$1').replace(/(\d+):(\d+)/g, '$1比$2').replace(/%/g, '趴').replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/＋/g, '加').replace(/－/g, '減').replace(/＝/g, '等於').replace(/□/g, '方框'); }

  /* ---------- 1. 讀完題目才能作答 ---------- */
  App.readLock = function (bar, getBtns, text) {
    var len = App.plain(text || '').replace(/\s/g, '').length, sec = Math.max(2, Math.min(8, len / 4.5));
    var st = { until: Date.now() + sec * 1000, open: false, openedAt: 0, timer: null };
    function set(locked) { getBtns().forEach(function (b) { b.classList.toggle('locked', locked); }); }
    function open() {
      if (st.open) return; st.open = true; st.openedAt = Date.now(); clearTimeout(st.timer);
      set(false); bar.classList.add('done'); bar.querySelector('span').textContent = '讀完了，可以作答！';
    }
    set(true);
    bar.hidden = false; bar.classList.remove('done');
    bar.querySelector('span').textContent = '先把題目讀完……';
    var fill = bar.querySelector('i'); fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth;
    fill.style.transition = 'width ' + sec + 's linear'; fill.style.width = '100%';
    st.timer = setTimeout(open, sec * 1000);
    st.unlock = open;
    st.isLocked = function () { return !st.open; };
    st.tooFast = function () { return st.open && Date.now() - st.openedAt < 1500; };
    bar._lock = st;
    return st;
  };

  /* ---------- 2. 一步一步看解法 ---------- */
  App.solSteps = function (q) {
    var steps = [];
    if (q.hint) steps.push('<b>先想想：</b>' + esc(q.hint));
    String(q.explain || '').split(/<\/p>/).forEach(function (l) {
      var t = l.replace(/^\s*<p[^>]*>/, '').trim();
      if (t && !/^答案是/.test(App.plain(t))) steps.push(t);
    });
    var ans = q.answerText || q.answer;
    steps.push('<b>答案是 ' + fmt(ans) + (q.unit ? ' ' + esc(q.unit) : '') + '</b>');
    return steps;
  };
  /* box：放步驟的地方；last：最後一個按鈕的字；done：按了最後一個按鈕 */
  App.stepper = function (box, steps, last, done) {
    var i = 0;
    function render() {
      box.innerHTML = '<ol class="sol-steps">' + steps.slice(0, i + 1).map(function (s, k) {
        return '<li class="' + (k === i ? 'now' : 'past') + '">' + App.sayBtn(sayOf(s)) + '<span>' + s + '</span></li>';
      }).join('') + '</ol><div class="sol-ctrl"><span class="sol-n">第 ' + (i + 1) + ' 步／共 ' + steps.length + ' 步</span>' +
        '<button class="big-btn sol-next" type="button">' + (i < steps.length - 1 ? '下一步 ▶' : esc(last)) + '</button></div>';
      box.querySelector('.sol-ctrl button').onclick = function () {
        if (i < steps.length - 1) { i++; render(); App.speak(sayOf(steps[i])); }
        else done();
      };
      var cur = box.querySelector('li.now'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    render();
    App.speak(sayOf(steps[0]));
  };

  /* ---------- 3. 同類型、換數字的題目 ---------- */
  var NAMES = /小明|小華|小美|阿傑|安安|小真|平平|小宇|小偉|莉莉|哥哥|弟弟|姐姐|妹妹|爸爸|媽媽|丹丹|恬恬|佳佳|小花|明明|小頌|小森/g;
  function key(t) { return App.plain(t).replace(/[\d.]+(\/\d+)?/g, '#').replace(NAMES, '人').replace(/[，。？、：（）\s]/g, ''); }
  function grams(s) { var g = {}; for (var i = 0; i < s.length - 1; i++) g[s.substr(i, 2)] = 1; return g; }
  function sim(a, b) { var A = grams(a), B = grams(b), n = 0, na = 0, nb = 0, k; for (k in A) { na++; if (B[k]) n++; } for (k in B) nb++; return na + nb ? 2 * n / (na + nb) : 0; }
  App.twinOf = function (q, gen) {
    var kq = key(q.text), best = null, bs = -1;
    for (var i = 0; i < 120; i++) {
      var c = gen();
      if ((c.kind || 'run') !== (q.kind || 'run') || c.text === q.text || c.answer === q.answer) continue;
      var s = sim(kq, key(c.text));
      if (s > bs) { bs = s; best = c; }
      if (s > .92) break;
    }
    if (!best) return null;
    best.twin = (q.twin || 0) + 1;
    return best;
  };
})();
