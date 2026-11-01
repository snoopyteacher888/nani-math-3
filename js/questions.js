/*
 * 三上數學（南一版）出題程式
 *
 * 每個關卡有一個 gen()，每次呼叫都會隨機產生一題：
 *   text   ：題目（畫面上顯示）
 *   say    ：按 🔊 時念出來的話
 *   visual ：題目旁邊的圖（直式、數線），HTML 字串，可省略
 *   answer ：正確答案（字串）
 *   options：三個選項（含正確答案，已打亂），分別放在三條跑道的門上
 *   hint   ：答錯時的提示
 *   explain：答錯時顯示的解題過程（HTML），可省略
 *
 * 錯誤選項不是亂數，而是孩子最常算錯的答案（忘記進位、漏寫 0……）。
 */
(function (root) {
  'use strict';

  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function dig(n, i) { return Math.floor(n / Math.pow(10, i)) % 10; } // 第 i 位（0＝個位）
  function len(n) { return String(n).length; }

  /* 從候選的錯誤答案裡挑 2 個（不重複、不等於正確答案、合理範圍），不夠就用 ±10、±100 補 */
  function options(answer, wrongs, ok, fallback) {
    ok = ok || function (x) { return typeof x === 'number' ? (x > 0 && x <= 99999 && Number.isInteger(x)) : !!x; };
    var key = String(answer), seen = {}, out = [];
    seen[key] = true;
    function add(x) { var k = String(x); if (out.length < 2 && !seen[k] && ok(x)) { seen[k] = true; out.push(x); } }
    wrongs.forEach(add);
    (fallback || [10, -10, 100, -100, 1, -1, 1000, -1000, 20, -20]).forEach(function (d) {
      if (typeof answer === 'number') add(answer + d);
    });
    return shuffle([answer].concat(out)).map(String);
  }

  /* ========== 國字數字 ========== */
  var ZD = '零一二三四五六七八九', ZU = ['千', '百', '十', ''];
  function zh(n) {
    if (n === 0) return '零';
    if (n === 10000) return '一萬';
    var s = String(n), pad = '0000'.slice(s.length) + s, out = '', zero = false, started = false;
    for (var i = 0; i < 4; i++) {
      var d = +pad[i];
      if (d === 0) { if (started) zero = true; continue; }
      if (zero) { out += '零'; zero = false; }
      out += ZD[d] + ZU[i]; started = true;
    }
    if (n >= 10 && n < 20) out = out.slice(1); // 十五，不寫一十五
    return out;
  }
  /* 「聽到什麼寫什麼」的錯誤：三千零五 → 305 */
  function literal(n) {
    var s = zh(n).split('').filter(function (c) { return ZD.indexOf(c) >= 0; }).map(function (c) { return ZD.indexOf(c); }).join('');
    return +s;
  }
  /* 「先寫 3000 再寫 5」的錯誤：三千零五 → 30005 */
  function concatParts(n) {
    var t = Math.floor(n / 1000) * 1000, rest = n % 1000;
    return (t > 0 && rest > 0 && rest < 100) ? +(String(t) + String(rest)) : null;
  }
  /* 數字放錯位置：3005 → 3050 */
  function shifts(n) {
    var d = String(n).split('').map(Number), out = [];
    for (var i = 1; i < d.length; i++) {
      if (d[i] === 0) continue;
      [i - 1, i + 1].forEach(function (j) {
        if (j >= 1 && j < d.length && d[j] === 0) { var c = d.slice(); c[j] = c[i]; c[i] = 0; out.push(+c.join('')); }
      });
    }
    return shuffle(out);
  }
  /* 產生中間有 0 的四位數 */
  function zeroNumber() {
    var t = pick(['a00b', 'a0b0', 'a0bc', 'ab0c', 'a00b', 'ab0c', 'ab00', 'a0b0']);
    return +t.split('').map(function (c) { return c === '0' ? 0 : R(1, 9); }).join('');
  }

  /* ========== 直式 ========== */
  /* rows：每列的數字；op：'＋' '－' '×'；res：答案（null 顯示 ？）；marks：{位數: 小字} 顯示在最上面（進位） */
  function vertical(top, op, bottom, res, marks) {
    var cols = Math.max(len(top), len(bottom), res == null ? 0 : len(res)) + 1;
    function row(n, sign, cls) {
      var s = n == null ? '' : String(n), cells = '';
      for (var c = 0; c < cols; c++) {
        var i = cols - 1 - c, ch = i < s.length ? s[s.length - 1 - i] : '';
        if (c === 0 && sign) ch = sign;
        cells += '<span>' + ch + '</span>';
      }
      return '<div class="vrow ' + (cls || '') + '">' + cells + '</div>';
    }
    var markRow = '';
    if (marks) {
      var cells = '';
      for (var c = 0; c < cols; c++) { var i = cols - 1 - c; cells += '<span>' + (marks[i] || '') + '</span>'; }
      markRow = '<div class="vrow vmark">' + cells + '</div>';
    }
    var resRow = res == null ? '<div class="vrow vres"><span class="vq" style="grid-column: 1 / -1">？</span></div>' : row(res, '', 'vres');
    return '<div class="vert" style="--cols:' + cols + '">' + markRow + row(top) + row(bottom, op, 'vline') + resRow + '</div>';
  }

  /* ========== 第 1 單元 數到 10000 ========== */
  function genReadWrite() {
    var n = zeroNumber(), type = R(0, 2);
    if (type === 0) { // 國字 → 數字
      return {
        text: '寫成數字是多少？', say: zh(n) + '，寫成數字是多少？', big: zh(n),
        answer: String(n), options: options(n, [literal(n), concatParts(n)].concat(shifts(n)), function (x) { return x > 0 && x < 100000; }),
        hint: '照位置來寫：千位、百位、十位、個位。沒有的位要寫 0 喔！',
        explain: placeTable(n)
      };
    }
    if (type === 1) { // 數字 → 國字
      var dz = zh(n).replace('零', '');
      var wrong = shifts(n).map(zh).concat([dz === zh(n) ? null : dz, zh(literal(n) < 10000 ? literal(n) : 0)]).filter(function (x) { return x && x !== '零'; });
      return {
        text: '這個數怎麼寫成國字？', say: '這個數，怎麼寫成國字？', big: String(n),
        answer: zh(n), options: options(zh(n), wrong), cls: 'zh',
        hint: '中間的 0 要念出「零」；最後面的 0 不用念。',
        explain: placeTable(n)
      };
    }
    // 位值：幾個千、幾個百……
    var parts = [], names = ['個一', '個十', '個百', '個千'];
    for (var i = 3; i >= 0; i--) if (dig(n, i)) parts.push(dig(n, i) + ' ' + names[i]);
    var nz = +String(n).replace(/0/g, '');
    return {
      text: parts.join('、') + '，合起來是多少？', say: parts.join('，').replace(/ /g, '') + '，合起來是多少？', big: null,
      answer: String(n), options: options(n, [nz, literal(n), concatParts(n)].concat(shifts(n)), function (x) { return x > 0 && x < 100000; }),
      hint: '把每個數字放進對的位置，沒有的位要補 0。',
      explain: placeTable(n)
    };
  }
  function placeTable(n) {
    var s = ('0000' + n).slice(-4), h = '<table class="place"><tr><th>千</th><th>百</th><th>十</th><th>個</th></tr><tr>';
    for (var i = 0; i < 4; i++) h += '<td' + (s[i] === '0' ? ' class="z"' : '') + '>' + s[i] + '</td>';
    return h + '</tr></table><p class="ex-line">' + n + ' 念作「' + zh(n) + '」</p>';
  }

  function numberLineSVG(s, step, k, mode) {
    var W = 640, x0 = 40, x1 = 600, y = 70, h = '';
    h += '<svg class="nline" viewBox="0 0 ' + W + ' 120" role="img" aria-label="數線">';
    h += '<line x1="20" y1="' + y + '" x2="620" y2="' + y + '" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>';
    h += '<path d="M620 ' + y + ' l-14 -9 v18 z" fill="currentColor"/>';
    for (var i = 0; i <= 10; i++) {
      var x = x0 + (x1 - x0) * i / 10, big = (i === 0 || i === 10 || i === 5);
      h += '<line x1="' + x + '" y1="' + (y - (big ? 14 : 9)) + '" x2="' + x + '" y2="' + (y + (big ? 14 : 9)) + '" stroke="currentColor" stroke-width="' + (big ? 4 : 3) + '"/>';
      var show = mode === 'ends' ? (i === 0 || i === 10) : (i === 0 || i === 5);
      if (show) h += '<text x="' + x + '" y="' + (y + 42) + '" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">' + (s + i * step) + '</text>';
    }
    var ax = x0 + (x1 - x0) * k / 10;
    h += '<path d="M' + ax + ' ' + (y - 18) + ' l-12 -22 h24 z" fill="#E0503A"/>';
    h += '<text x="' + ax + '" y="' + (y - 46) + '" text-anchor="middle" font-size="28" font-weight="700" fill="#E0503A">？</text>';
    return h + '</svg>';
  }
  function genNumberLine() {
    var step = pick([1, 10, 10, 100, 100, 100, 1000]), s;
    if (step === 1000) s = 0;
    else if (step === 100) s = R(0, 9) * 1000;
    else if (step === 10) s = R(10, 99) * 100;
    else s = R(100, 999) * 10;
    var k = pick([1, 2, 3, 4, 6, 7, 8, 9, 3, 7]), mode = Math.random() < .7 ? 'ends' : 'half', ans = s + k * step;
    var endLabel = mode === 'ends' ? (s + 10 * step) : (s + 5 * step), parts = mode === 'ends' ? 10 : 5;
    var wrongs = [];
    if (step > 1) wrongs.push(s + k * (step / 10), s + k);
    wrongs.push(s + (k + 1) * step, s + (k - 1) * step, s + k * step * 10);
    return {
      text: '箭頭指的是多少？', say: '數線上，箭頭指的是多少？', visual: numberLineSVG(s, step, k, mode), wide: true,
      review: '數線 ' + s + '～' + endLabel + '，箭頭在第 ' + k + ' 格（1 格是 ' + step + '）',
      answer: String(ans), options: options(ans, wrongs, function (x) { return x >= 0 && x <= 10000; }, [step, -step, 2 * step, -2 * step]),
      hint: '先看 1 小格是多少，再數箭頭在第幾格。',
      explain: '<p class="ex-line">從 ' + s + ' 到 ' + endLabel + ' 分成 ' + parts + ' 格，<b>1 格是 ' + step + '</b>。</p>' +
        '<p class="ex-line">箭頭在第 ' + k + ' 格：' + s + ' 再加 ' + k + ' 個 ' + step + '，是 <b>' + ans + '</b>。</p>'
    };
  }

  /* ========== 第 2、3 單元：計算題 ==========
   * 計算題不用跑酷，改用「⏱️ 60 秒挑戰」（自己填答案）和「🔍 小偵探」（找同學算錯的地方）。
   * 每個 make 函式回傳一題：
   *   a, op, b, ans ：算式和答案
   *   marks         ：直式上方的小字（進位）
   *   mistakes      ：常見的錯誤答案 [{ v: 錯的答案, why: 錯在哪裡 }]
   *   hint, say     ：提示、念出來的話
   */
  function addCarries(a, b) {
    var marks = {}, c = 0, count = 0, pos = [];
    for (var i = 0; i < 5; i++) {
      var s = dig(a, i) + dig(b, i) + c; c = s >= 10 ? 1 : 0;
      if (c) { marks[i + 1] = '1'; count++; pos.push(i + 1); }
    }
    return { marks: marks, count: count, pos: pos };
  }
  function noCarryAdd(a, b) {
    var r = 0, L = Math.max(len(a), len(b));
    for (var i = 0; i < L; i++) r += ((dig(a, i) + dig(b, i)) % 10) * Math.pow(10, i);
    return r;
  }
  var PLACE = ['個位', '十位', '百位', '千位', '萬位'];
  function makeAdd() { // 四位數加法，至少進位 2 次
    var a, b, c;
    do {
      a = R(1000, 8999); b = Math.random() < .35 ? R(100, 999) : R(1000, 8999);
      c = addCarries(a, b);
    } while (a + b > 9999 || c.count < 2);
    var ans = a + b, mistakes = [{ v: noCarryAdd(a, b), why: '每一位加起來滿 10 都沒有進位，只寫了個位數。' }];
    c.pos.forEach(function (p) { mistakes.push({ v: ans - Math.pow(10, p), why: PLACE[p - 1] + '加起來滿 10，進位的 1 忘記加到' + PLACE[p] + '了。' }); });
    return { a: a, op: '＋', b: b, ans: ans, marks: c.marks, mistakes: mistakes,
      hint: '滿 10 要進 1 到前一位，別忘了把進位的 1 加上去！', say: a + ' 加 ' + b };
  }

  function subInfo(a, b) {
    var br = 0, pos = [];
    for (var i = 0; i < 4; i++) {
      var d = dig(a, i) - dig(b, i) - br;
      if (d < 0) { br = 1; pos.push(i); } else br = 0;
    }
    return { count: pos.length, pos: pos };
  }
  function bigMinusSmall(a, b) { // 不夠減就倒過來減（大減小）的錯誤
    var r = 0;
    for (var i = 0; i < len(a); i++) r += Math.abs(dig(a, i) - dig(b, i)) * Math.pow(10, i);
    return r;
  }
  function makeSub() { // 四位數減法，一半是被減數中間有 0
    var a, b, info, zeroA = Math.random() < .55;
    for (;;) {
      a = zeroA ? zeroNumber() : R(2000, 9999);
      if (a < 2000) continue;
      b = Math.random() < .35 ? R(100, 999) : R(1000, a - 1);
      info = subInfo(a, b);
      if (a > b && info.count >= (zeroA ? 1 : 2) && a - b >= 100) break;
    }
    var ans = a - b, mistakes = [{ v: bigMinusSmall(a, b), why: '不夠減的時候，把上下倒過來，用大的減小的。應該要向前一位借 1 才對！' }];
    info.pos.forEach(function (p) {
      mistakes.push({ v: ans + Math.pow(10, p + 1), why: PLACE[p] + '不夠減，向' + PLACE[p + 1] + '借了 1，可是' + PLACE[p + 1] + '忘記少 1。' });
    });
    var hasZero = /0/.test(String(a).slice(1));
    return { a: a, op: '－', b: b, ans: ans, marks: null, mistakes: mistakes, check: ans + ' ＋ ' + b + ' ＝ ' + a,
      hint: hasZero ? '不夠減要向前一位借 1；前一位是 0 借不到，就再往前借，借過的那一位要少 1！'
                    : '不夠減要向前一位借 1 當 10，被借走的那一位要記得少 1！', say: a + ' 減 ' + b };
  }

  function mulInfo(a, m) {
    var marks = {}, c = 0, carries = [];
    for (var i = 0; i < len(a); i++) {
      var p = dig(a, i) * m + c; c = Math.floor(p / 10);
      if (c && i < len(a) - 1) { marks[i + 1] = String(c); carries.push([i + 1, c]); }
    }
    return { marks: marks, carries: carries };
  }
  function noCarryMul(a, m) {
    var r = 0;
    for (var i = 0; i < len(a); i++) r += ((dig(a, i) * m) % 10) * Math.pow(10, i);
    return r;
  }
  function makeMul() { // 二位數、三位數 × 一位數，會進位；三成是 105 × 4 這種中間有 0 的
    var a, m;
    do {
      var t = Math.random();
      a = t < .3 ? R(1, 9) * 100 + R(1, 9) : t < .6 ? R(12, 99) : R(102, 499);
      m = R(2, 9);
    } while (mulInfo(a, m).carries.length < 1 || a % 10 === 0 || a * m > 9999);
    var ans = a * m, info = mulInfo(a, m), mistakes = [];
    info.carries.forEach(function (pc) {
      mistakes.push({ v: ans - pc[1] * Math.pow(10, pc[0]), why: PLACE[pc[0] - 1] + '乘完要進 ' + pc[1] + '，可是' + PLACE[pc[0]] + '乘完忘記加上這個 ' + pc[1] + '。' });
    });
    mistakes.push({ v: noCarryMul(a, m), why: '每一位乘出來滿 10 都沒有進位，只寫了個位數。' });
    return { a: a, op: '×', b: m, ans: ans, marks: info.marks, mistakes: mistakes,
      hint: '從個位開始乘，乘出來滿 10 要進位，乘下一位時記得加上去！', say: a + ' 乘以 ' + m };
  }

  /* 小偵探：同學的作業（三成算對、七成有一個常見錯誤） */
  function spotFrom(make) {
    return function () {
      var p = make(), ok = p.mistakes.filter(function (m) { return m.v > 0 && m.v !== p.ans && m.v < 100000; });
      if (Math.random() < .3 || !ok.length) { p.shown = p.ans; p.why = null; }
      else { var m = pick(ok); p.shown = m.v; p.why = m.why; }
      return p;
    };
  }
  function makeAddSub() { return Math.random() < .5 ? makeAdd() : makeSub(); }

  /* ========== 關卡清單 ==========
   * mode：run 跑酷、timed 60 秒挑戰、spot 小偵探
   * timed：bonus＝答對加幾秒；goals＝拿 1、2、3 顆星要答對幾題
   */
  var UNITS = [
    { id: 1, name: '數到 10000', ic: '🔢', stages: [
      { id: '1-1', mode: 'run', name: '數字讀寫', desc: '國字和數字互換，中間的 0 別漏掉', gen: genReadWrite, time: 10 },
      { id: '1-2', mode: 'run', name: '數線大挑戰', desc: '1 小格是多少？箭頭指在哪裡？', gen: genNumberLine, time: 12 }
    ] },
    { id: 2, name: '四位數的加減', ic: '➕', stages: [
      { id: '2-1', mode: 'timed', name: '加法進位', desc: '滿 10 要進 1', make: makeAdd, bonus: 15, goals: [2, 4, 7] },
      { id: '2-2', mode: 'timed', name: '減法退位', desc: '不夠減要借；遇到 0 再往前借', make: makeSub, bonus: 20, goals: [2, 4, 6] },
      { id: '2-3', mode: 'spot', name: '找出加減的錯', desc: '同學的直式算對了嗎？錯在哪一位？', make: spotFrom(makeAddSub) }
    ] },
    { id: 3, name: '乘法', ic: '✖️', stages: [
      { id: '3-1', mode: 'timed', name: '乘法進位', desc: '乘完要加上進位', make: makeMul, bonus: 10, goals: [3, 6, 10] },
      { id: '3-2', mode: 'spot', name: '找出乘法的錯', desc: '同學忘記進位了嗎？', make: spotFrom(makeMul) }
    ] },
    { id: 4, name: '幾毫米', ic: '📏', stages: [] },
    { id: 5, name: '角、正方形和長方形', ic: '📐', stages: [] },
    { id: 'p1', name: '加油小站一', ic: '⛽', stages: [] },
    { id: 6, name: '除法', ic: '➗', stages: [] },
    { id: 7, name: '公升和毫升', ic: '🥛', stages: [] },
    { id: 8, name: '分數', ic: '🍕', stages: [] },
    { id: 9, name: '圓', ic: '⭕', stages: [] },
    { id: 'p2', name: '加油小站二', ic: '⛽', stages: [] }
  ];

  root.MathQ = { UNITS: UNITS, zh: zh, literal: literal, vertical: vertical, len: len, dig: dig,
    _gen: { genReadWrite: genReadWrite, genNumberLine: genNumberLine, makeAdd: makeAdd, makeSub: makeSub, makeMul: makeMul } };
})(typeof window !== 'undefined' ? window : globalThis);
