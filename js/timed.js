/*
 * ⏱️ 2 分鐘挑戰（計算題）
 *
 * 用數字鍵盤從個位開始往前填答案（跟在紙上寫直式一樣）。
 * 2 分鐘倒數，答對再加時間，時間到就結束，比答對幾題。
 * 直式上面的紅色小格子：點一下，就能用數字鍵盤寫進位、借位的數字（最多 2 位，例如 10、12）。
 * 題目的黑色數字點一下會畫上紅色斜線（借位時把數字畫掉），就像在紙上算一樣。
 * 答錯會暫停計時、顯示正確答案和提示，這題等一下會再出現。
 */
(function () {
  'use strict';

  var App = window.App, $ = App.$, esc = App.esc, speak = App.speak, SFX = App.SFX, len = window.MathQ.len;
  var START = 120; // 2 分鐘（老師說 60 秒太少）
  var T = null; // 這一局的狀態

  var IMG = 'images/tutorial/';
  function slides(s) {
    var web = App.device === 'web', g = s.goals;
    return [
      { img: IMG + 'timed-1.webp', text: '有 2 分鐘。從個位開始，用' + (web ? '數字鍵盤（或電腦鍵盤）' : '下面的數字鍵盤') + '填答案。',
        say: '有2分鐘。從個位開始，用' + (web ? '數字鍵盤，或電腦鍵盤' : '下面的數字鍵盤') + '填答案。' },
      { img: IMG + 'timed-2.webp', text: '填完按「確定」。答對了，會再加 ' + s.bonus + ' 秒！', say: '填完按確定。答對了，會再加' + s.bonus + '秒！' },
      { img: IMG + 'timed-3.webp', text: '直式上面的紅色小格子點一下，就可以寫進位或借位的數字。' },
      { img: IMG + 'timed-4.webp', text: '黑色的數字點一下，會畫上紅色斜線，就像在紙上借位一樣。' },
      { img: IMG + 'timed-5.webp', text: '算錯了，紅色的格子就是算錯的位。看完說明，再按「下一題」。', say: '算錯了，紅色的格子就是算錯的位。看完說明，再按下一題。' },
      { img: IMG + 'timed-6.webp', text: '時間到就結束。答對 ' + g[0] + ' 題拿 1 顆星、' + g[1] + ' 題拿 2 顆星、' + g[2] + ' 題拿 3 顆星！',
        say: '時間到就結束。答對' + g[0] + '題拿1顆星，' + g[1] + '題拿2顆星，' + g[2] + '題拿3顆星！' }
    ];
  }
  function open(s) {
    App.intro({
      mode: 'timed', title: '⏱️ 關卡 ' + s.id + '　' + s.name, desc: s.desc, slides: slides(s),
      start: function (box) {
        box.innerHTML = '<button class="big-btn go-btn" type="button" aria-label="開始">▶</button>';
        box.querySelector('button').onclick = function () { $('t-q').innerHTML = ''; $('t-msg').innerHTML = ''; App.showScreen('timed'); App.countdown(function () { start(s); }); };
      }
    });
  }
  $('help-timed').onclick = function () {
    if (!T || T.phase === 'end' || T.phase === 'paused') return;
    var was = T.phase; T.phase = 'paused';
    App.replay({ title: '📖 遊戲說明', slides: slides(T.stage), onClose: function () {
      if (!T) return; App.countdown(function () { if (T) { T.phase = was; T.last = performance.now(); } }, true);
    } });
  };
  App.modes.timed = { open: open };

  function start(s) {
    $('timed').classList.remove('show-ans');
    T = { stage: s, left: START, count: 0, combo: 0, n: 0, retry: [], wrongList: [], phase: 'play', p: null, last: 0, lastTick: 0 };
    App.showScreen('timed');
    $('t-title').textContent = s.id + ' ' + s.name;
    next();
    T.last = performance.now();
    requestAnimationFrame(loop);
  }

  function next() {
    var r = T.retry.findIndex(function (x) { return x.due <= T.n; });
    T.p = r >= 0 ? T.retry.splice(r, 1)[0].p : T.stage.make();
    T.p.again = r >= 0;
    T.n++;
    var p = T.p;
    T.C = p.op === '－' ? len(p.a) : Math.max(len(p.a), len(p.b)) + 1;
    T.digits = []; for (var i = 0; i < T.C; i++) T.digits.push('');
    T.marks = {}; T.cur = 0; T.mk = null; T.struck = {}; T.phase = 'play';
    $('t-msg').className = 't-msg'; $('t-msg').innerHTML = '';
    $('t-next').hidden = true;
    $('t-again').hidden = !p.again;
    render();
    if (App.store.autoSay) speak(p.say);
  }

  function render() {
    var p = T.p;
    $('t-q').innerHTML = App.vgrid({
      a: p.a, op: p.op, b: p.b, C: T.C,
      mark: function (i) {
        if (i === 0 && p.op !== '－') return ''; // 個位上面不會有進位；減法要留給借位
        return '<button type="button" class="mk' + (T.phase === 'play' && T.mk === i ? ' cur' : '') + '" data-mk="' + i + '" aria-label="' +
          ['個', '十', '百', '千', '萬'][i] + '位上面的小格子">' + (T.marks[i] || '') + '</button>';
      },
      digit: function (row, i, ch) {
        var k = row + '-' + i;
        return '<button type="button" class="dg' + (T.struck[k] ? ' struck' : '') + '" data-st="' + k + '" aria-label="畫掉">' + ch + '</button>';
      },
      ans: function (i) {
        var cls = 'box' + (T.phase === 'play' && T.mk === null && i === T.cur ? ' cur' : '') + (T.res && T.res[i] ? ' ' + T.res[i] : '');
        return '<button type="button" class="' + cls + '" data-box="' + i + '">' + T.digits[i] + '</button>';
      }
    });
    hud();
  }
  function hud() {
    $('t-count').textContent = T.count;
    var sec = Math.max(0, Math.ceil(T.left)), m = Math.floor(sec / 60), r = sec % 60;
    $('t-sec').textContent = (m ? m + ' 分 ' : '') + r + ' 秒';
    $('t-fill').style.width = Math.min(100, T.left / START * 100) + '%';
    $('t-fill').classList.toggle('low', T.left <= 10);
    $('t-combo').hidden = T.combo < 2; $('t-combo').textContent = '🔥' + T.combo;
  }

  /* ---------- 輸入 ---------- */
  function press(k) {
    if (!T || T.phase !== 'play') return;
    if (k === 'ok') return submit();
    if (T.mk !== null) { // 正在寫上面的小格子
      var m = T.marks[T.mk] || '';
      T.marks[T.mk] = k === 'del' ? m.slice(0, -1) : (m.length >= 2 ? k : m + k);
      SFX.key(); render(); return;
    }
    if (k === 'del') {
      if (T.digits[T.cur] === '' && T.cur > 0) T.cur--;
      T.digits[T.cur] = '';
    } else {
      T.digits[T.cur] = k;
      if (T.cur < T.C - 1) T.cur++;
    }
    SFX.key(); T.res = null; render();
  }
  $('keypad').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  $('t-q').addEventListener('click', function (e) {
    if (!T || T.phase !== 'play') return;
    var b = e.target.closest('[data-box]');
    if (b) { T.mk = null; T.cur = +b.dataset.box; tipMk(); render(); return; }
    var m = e.target.closest('[data-mk]');
    if (m) { var i = +m.dataset.mk; T.mk = T.mk === i ? null : i; SFX.key(); tipMk(); render(); return; }
    var d = e.target.closest('[data-st]');
    if (d) { var k = d.dataset.st; T.struck[k] = !T.struck[k]; SFX.key(); render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!T || $('timed').hidden || !$('ov-pause').hidden || !$('ov-end').hidden) return;
    if (T.phase === 'wrong' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('t-next').click(); return; }
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
    else if (e.key === 'ArrowLeft') { if (T.cur < T.C - 1) T.cur++; render(); }
    else if (e.key === 'ArrowRight') { if (T.cur > 0) T.cur--; render(); }
    else if (e.key === 'Escape') pause();
  });
  $('t-say').onclick = function () { if (T && T.p) speak(T.p.say + '，等於多少？'); };

  function tipMk() { // 告訴孩子現在鍵盤在寫哪裡
    if (T.mk !== null) { $('t-msg').className = 't-msg tip'; $('t-msg').innerHTML = App.sayBtn('在紅色小格子寫數字；寫完，點下面的答案格子回來。') + '<span>✏️ 在紅色小格子寫數字；寫完點下面的答案格子回來。</span>'; }
    else if ($('t-msg').classList.contains('tip')) { $('t-msg').className = 't-msg'; $('t-msg').textContent = ''; }
  }

  function value() { // 中間有空格就不算
    var s = '', seen = false;
    for (var i = T.C - 1; i >= 0; i--) {
      if (T.digits[i] === '') { if (seen) return null; continue; }
      seen = true; s += T.digits[i];
    }
    return s === '' ? null : +s;
  }

  function submit() {
    T.mk = null;
    var v = value(), p = T.p;
    if (v === null) {
      $('t-msg').className = 't-msg warn';
      $('t-msg').textContent = T.digits.join('') === '' ? '先從個位開始填答案喔！' : '中間有空格，每一位都要填喔！';
      return;
    }
    // 每一格對或錯（給孩子看哪一位算錯）
    var s = String(p.ans);
    T.res = {};
    for (var i = 0; i < T.C; i++) {
      var want = i < s.length ? s[s.length - 1 - i] : '';
      if (T.digits[i] !== '' || want !== '') T.res[i] = T.digits[i] === want ? 'ok' : 'bad';
    }
    if (v === p.ans) {
      T.count++; T.combo++; T.left += T.stage.bonus; T.phase = 'good';
      SFX.good();
      $('t-msg').className = 't-msg good';
      $('t-msg').textContent = '答對了！ ＋' + T.stage.bonus + ' 秒' + (T.combo >= 3 ? '　🔥 連對 ' + T.combo : '');
      render();
      setTimeout(function () { if (T && T.phase === 'good') { T.res = null; next(); } }, 700);
    } else {
      T.combo = 0; T.phase = 'wrong';
      T.wrongList.push(p); T.retry.push({ p: p, due: T.n + 2 });
      SFX.bad();
      $('t-msg').className = 't-msg bad';
      $('t-msg').innerHTML = App.sayBtn('正確答案是' + p.ans + '。紅色的位算錯了。' + p.hint) +
        '<div>正確答案是 <b>' + p.ans + '</b>（紅色的位算錯了）<br>' + esc(p.hint) + (p.check ? '<br>驗算：' + p.check : '') + '</div>';
      $('t-next').hidden = false;
      $('timed').classList.add('show-ans');
      render();
      speak('正確答案是' + p.ans + '。' + p.hint);
    }
  }
  $('t-next').onclick = function () { $('timed').classList.remove('show-ans'); T.res = null; T.last = performance.now(); next(); };

  /* ---------- 計時 ---------- */
  function loop(now) {
    if (!T || $('timed').hidden) return;
    requestAnimationFrame(loop);
    var dt = Math.min((now - T.last) / 1000, .1); T.last = now;
    if (T.phase !== 'play') return; // 看答案、暫停時不計時
    T.left -= dt;
    if (T.left <= 10 && Math.ceil(T.left) !== T.lastTick && T.left > 0) { T.lastTick = Math.ceil(T.left); SFX.tick(); }
    hud();
    if (T.left <= 0) finish();
  }

  function pause() {
    if (!T || T.phase === 'end' || T.phase === 'paused') return;
    var was = T.phase, s = T.stage; T.phase = 'paused';
    App.pause({
      resume: function () { T.phase = was; T.last = performance.now(); },
      restart: function () { App.countdown(function () { start(s); }); },
      quit: function () { T = null; }
    });
  }
  $('t-pause').onclick = pause;
  document.addEventListener('visibilitychange', function () { if (document.hidden && T && T.phase === 'play' && !$('timed').hidden) pause(); });

  function finish() {
    T.phase = 'end'; T.left = 0; hud();
    var s = T.stage, n = T.count, g = s.goals, stars = n >= g[2] ? 3 : n >= g[1] ? 2 : n >= g[0] ? 1 : 0;
    var r = App.saveResult(s.id, stars, n);
    var title = stars === 3 ? '太厲害了！' : stars === 2 ? '很棒喔！' : stars === 1 ? '完成了！再挑戰更多題！' : '時間到！多練習幾次會越來越快喔！';
    var seen = {}, rv = '';
    var list = T.wrongList.filter(function (p) { var k = p.a + p.op + p.b; if (seen[k]) return false; seen[k] = 1; return true; });
    if (list.length) rv = '<h3>📝 這次算錯的題目</h3><ul>' + list.map(function (p) { return '<li>' + p.a + ' ' + p.op + ' ' + p.b + ' ＝ <b>' + p.ans + '</b></li>'; }).join('') + '</ul>';
    var next3 = stars < 3 ? '<p class="sub">再答對 ' + (g[stars] - n) + ' 題就能拿到 ' + (stars + 1) + ' 顆星！</p>' : '';
    App.showEnd({
      stars: stars, title: title, scoreHTML: '答對 <b>' + n + '</b> 題', isRecord: r.isRecord && n > 0,
      bestText: '這關最多答對 ' + r.rec.best + ' 題', reviewHTML: next3 + rv,
      again: function () { App.countdown(function () { start(s); }); }, say: '時間到！答對' + n + '題。' + title
    });
  }
  if (/[?&]debug\b/.test(location.search)) { window.__peekT = function () { return T; }; window.__renderT = render; } // 測試、截說明圖用
})();
