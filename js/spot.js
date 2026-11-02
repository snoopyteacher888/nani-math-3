/*
 * 🔍 小偵探：找出同學算錯的地方
 *
 * 看同學寫的直式：算對了就按「✔ 算對了」；算錯了就點答案裡錯的那一位數字。
 * 七成的題目有一個常見錯誤（忘記進位、借了沒減 1……），三成是對的。
 * 每局 10 題。看完會說明錯在哪裡，並顯示正確的直式。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, speak = App.speak, SFX = App.SFX, MQ = window.MathQ;
  var ROUND = 10;
  var KIDS = ['小明', '小美', '阿傑', '小華', '安安', '平平', '小偉', '莉莉'];
  var S = null;

  var IMG = 'images/tutorial/';
  var SLIDES = [
    { img: IMG + 'spot-1.webp', text: '這是同學寫的直式。你要當小偵探，檢查他有沒有算對。可以先用計算紙自己算一次。' },
    { img: IMG + 'spot-2.webp', text: '同學算對了，就按綠色的「算對了」。', say: '同學算對了，就按綠色的算對了。' },
    { img: IMG + 'spot-3.webp', text: '同學算錯了，就點答案裡錯的那一位數字。' },
    { img: IMG + 'spot-4.webp', text: '抓到了！看看他錯在哪裡，自己不要犯一樣的錯喔。' },
    { img: IMG + 'spot-5.webp', text: '一共 10 題。錯 0～1 題拿 3 顆星，錯 2～3 題拿 2 顆星。', say: '一共10題。錯0到1題拿3顆星，錯2到3題拿2顆星。' }
  ];
  function open(s) {
    App.intro({
      mode: 'spot', title: '關卡 ' + s.id + '　' + s.name, desc: s.desc, slides: SLIDES,
      start: function (box) {
        box.innerHTML = '<button class="big-btn go-btn" type="button" aria-label="開始">▶</button>';
        box.querySelector('button').onclick = function () { $('s-q').innerHTML = ''; $('s-result').hidden = true; App.showScreen('spot'); App.countdown(function () { start(s); }); };
      }
    });
  }
  $('help-spot').onclick = function () { if (S && S.phase !== 'end') App.replay({ title: '📖 遊戲說明', slides: SLIDES, onClose: function () {} }); };
  App.modes.spot = { open: open };

  function start(s) {
    S = { stage: s, n: 0, right: 0, wrong: 0, score: 0, combo: 0, wrongList: [], phase: 'play', p: null };
    App.showScreen('spot');
    $('s-title').textContent = s.id + ' ' + s.name;
    next();
  }

  function next() {
    if (S.n >= ROUND) return finish();
    S.n++; S.p = S.stage.make(); S.kid = KIDS[Math.floor(Math.random() * KIDS.length)]; S.phase = 'play'; S.pick = null;
    var p = S.p;
    S.C = Math.max(MQ.len(p.a), MQ.len(p.b), MQ.len(p.shown), MQ.len(p.ans)) + (p.op === '－' ? 0 : 1);
    S.bad = {}; // 算錯的位
    for (var i = 0; i < S.C; i++) if (MQ.dig(p.shown, i) !== MQ.dig(p.ans, i)) S.bad[i] = true;
    $('s-who').textContent = '🕵️ ' + S.kid + '的作業';
    $('s-result').hidden = true; $('s-actions').hidden = false;
    render();
    if (App.store.autoSay) speak(S.kid + '算的' + p.say + '，算對了嗎？');
  }

  function render() {
    var p = S.p, sh = String(p.shown), done = S.phase !== 'play';
    $('s-q').innerHTML = App.vgrid({
      a: p.a, op: p.op, b: p.b, C: S.C,
      mark: null,
      ans: function (i) {
        var d = i < sh.length ? sh[sh.length - 1 - i] : '', cls = 'hand';
        if (done && S.bad[i]) cls += ' bad';
        if (S.pick === i) cls += ' picked';
        return '<button type="button" class="' + cls + '" data-col="' + i + '"' + (done ? ' disabled' : '') + '>' + d + '</button>';
      }
    });
    $('s-count').textContent = S.score;
    $('s-prog').textContent = '第 ' + S.n + ' / ' + ROUND + ' 題';
    $('s-combo').hidden = S.combo < 2; $('s-combo').textContent = '🔥' + S.combo;
  }

  function judge(col) { // col＝點的那一位；null＝按「算對了」
    if (!S || S.phase !== 'play') return;
    var p = S.p, isRight = p.shown === p.ans, good;
    S.pick = col;
    if (col == null) good = isRight;
    else good = !isRight && !!S.bad[col];
    S.phase = 'done';
    if (good) { S.right++; S.combo++; S.score += 10 + Math.min(S.combo - 1, 5) * 2; SFX.good(); }
    else { S.wrong++; S.combo = 0; S.wrongList.push(p); SFX.bad(); }

    var head, body;
    if (isRight) {
      head = good ? '答對了！' + S.kid + '真的算對了 👍' : '其實' + S.kid + '算對了喔！';
      body = '<p class="ex-line">' + p.a + ' ' + p.op + ' ' + p.b + ' ＝ ' + p.ans + '，每一位都對。</p>';
    } else {
      head = good ? '抓到了！🔍 錯的地方就在這裡' : col == null ? S.kid + '有算錯喔！紅色的地方錯了' : '有算錯，可是不是這一位喔！紅色的地方才錯了';
      body = '<p class="ex-why">❌ ' + esc(p.why) + '</p><p class="ex-line">正確的算法：</p>' + MQ.vertical(p.a, p.op, p.b, p.ans, p.marks) +
        (p.check ? '<p class="ex-line">驗算：' + p.check + '</p>' : '');
    }
    $('s-head').textContent = head;
    $('s-res-say').dataset.say = head + (isRight ? '' : '。' + p.why);
    $('s-head').className = 's-head ' + (good ? 'good' : 'bad');
    $('s-body').innerHTML = body;
    $('s-result').hidden = false; $('s-actions').hidden = true;
    render();
    speak(head + (isRight ? '' : p.why));
  }
  $('s-q').addEventListener('click', function (e) { var b = e.target.closest('[data-col]'); if (b) judge(+b.dataset.col); });
  $('s-ok').onclick = function () { judge(null); };
  $('s-next').onclick = function () { next(); };
  $('s-say').onclick = function () { if (S && S.p) speak(S.kid + '算的' + S.p.say + '，答案寫' + S.p.shown + '。算對了嗎？算對了，就按算對了；算錯了，就點錯的那一位數字。'); };
  document.addEventListener('keydown', function (e) {
    if (!S || $('spot').hidden || !$('ov-pause').hidden || !$('ov-end').hidden) return;
    if (S.phase === 'done' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
    else if (e.key === 'Escape') pause();
  });

  function pause() {
    if (!S || S.phase === 'end') return;
    var s = S.stage;
    App.pause({ resume: function () {}, restart: function () { start(s); }, quit: function () { S = null; } });
  }
  $('s-pause').onclick = pause;

  function finish() {
    S.phase = 'end';
    var s = S.stage, stars = S.wrong <= 1 ? 3 : S.wrong <= 3 ? 2 : 1;
    var r = App.saveResult(s.id, stars, S.score);
    var title = stars === 3 ? '神探出動！太厲害了！' : stars === 2 ? '很棒的小偵探！' : '完成了！再當一次小偵探吧！';
    var rv = S.wrongList.length ? '<h3>這次沒抓到的題目</h3><ul>' + S.wrongList.map(function (p) {
      return '<li>' + p.a + ' ' + p.op + ' ' + p.b + '：同學寫 ' + p.shown + '，' +
        (p.shown === p.ans ? '<b>其實算對了</b>' : '正確是 <b>' + p.ans + '</b>') + '</li>';
    }).join('') + '</ul>' : '';
    App.showEnd({
      stars: stars, title: title, scoreHTML: '10 題答對 <b>' + S.right + '</b> 題，得到 ' + S.score + ' 分', isRecord: r.isRecord,
      bestText: '這關最高紀錄：' + r.rec.best + ' 分', reviewHTML: rv,
      again: function () { start(s); }, say: title + '十題答對' + S.right + '題。'
    });
  }
  if (/[?&]debug\b/.test(location.search)) { window.__peekS = function () { return S; }; window.__renderS = render; } // 測試、截說明圖用
})();
