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
   * 計算題不用跑酷，改用「⏱️ 2 分鐘挑戰」（自己填答案）和「🔍 小偵探」（找同學算錯的地方）。
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

  /* =====================================================
   * 第 4～9 單元（和第 1 單元的數線跳跳）
   *   kind：run（跑酷 Q 題，選答案）、quiz（⭕❌ 快答、🧩 選答案）、tap（點圖：數線跳跳、找找看）、
   *         sort（🗑️ 分類）、paint（🍕 塗色）、fill（📏 自己填數字）
   * ===================================================== */
  /* 選項：直接給幾個（字串），打亂、去掉重複 */
  function opts(answer, wrongs, n) {
    n = n || 3;
    var out = [String(answer)];
    wrongs.forEach(function (w) { w = String(w); if (out.length < n && out.indexOf(w) < 0 && w !== '' && !/NaN|undefined|-/.test(w)) out.push(w); });
    return shuffle(out);
  }
  function cmmm(cm, mm) { return cm && mm ? cm + ' 公分 ' + mm + ' 毫米' : cm ? cm + ' 公分' : mm + ' 毫米'; }
  function lml(l, ml) { return l && ml ? l + ' 公升 ' + ml + ' 毫升' : l ? l + ' 公升' : ml + ' 毫升'; }
  function svgOpen(w, h, label, cls) { return '<svg class="' + (cls || 'shapes') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">'; }

  /* ---------- 1-2 📏 數線跳跳：點刻度，青蛙跳過去 ---------- */
  /* 自己畫的小青蛙（坐著、腳底在 y≈21），不用表情符號：各家手機的 🐸 長得不一樣 */
  var FROG = '<g stroke="#3F8A3A" stroke-width="2.5" stroke-linejoin="round">' +
    '<ellipse cx="-21" cy="13" rx="11" ry="7" fill="#6BB85F"/><ellipse cx="21" cy="13" rx="11" ry="7" fill="#6BB85F"/>' +
    '<ellipse cx="0" cy="2" rx="26" ry="19" fill="#86D27A"/>' +
    '<circle cx="-12" cy="-15" r="10" fill="#86D27A"/><circle cx="12" cy="-15" r="10" fill="#86D27A"/>' +
    '<ellipse cx="-9" cy="19" rx="7" ry="3.5" fill="#6BB85F"/><ellipse cx="9" cy="19" rx="7" ry="3.5" fill="#6BB85F"/></g>' +
    '<ellipse cx="0" cy="7" rx="15" ry="10" fill="#E4F7D2"/>' +
    '<circle cx="-12" cy="-15" r="6.5" fill="#fff"/><circle cx="12" cy="-15" r="6.5" fill="#fff"/>' +
    '<circle cx="-11" cy="-14" r="3.6" fill="#2B2A28"/><circle cx="13" cy="-14" r="3.6" fill="#2B2A28"/>' +
    '<circle cx="-10" cy="-15.5" r="1.3" fill="#fff"/><circle cx="14" cy="-15.5" r="1.3" fill="#fff"/>' +
    '<ellipse cx="-16" cy="-2" rx="4.5" ry="2.8" fill="#FF9FB0"/><ellipse cx="16" cy="-2" rx="4.5" ry="2.8" fill="#FF9FB0"/>' +
    '<path d="M-7 -4 Q0 3 7 -4" fill="none" stroke="#2B2A28" stroke-width="2.5" stroke-linecap="round"/>';
  function genFrog() {
    var step = pick([1, 10, 10, 100, 100, 100, 1000]), s;
    if (step === 1000) s = 0; else if (step === 100) s = R(0, 9) * 1000; else if (step === 10) s = R(10, 99) * 100; else s = R(100, 999) * 10;
    var k = pick([1, 2, 3, 4, 6, 7, 8, 9, 3, 7]), mode = Math.random() < .65 ? 'ends' : 'half', target = s + k * step;
    var W = 680, x0 = 50, x1 = 630, y = 120, h = svgOpen(W, 190, '數線', 'nline frogline');
    h += '<line x1="25" y1="' + y + '" x2="660" y2="' + y + '" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M662 ' + y + ' l-16 -10 v20 z" fill="currentColor"/>';
    for (var i = 0; i <= 10; i++) {
      var x = x0 + (x1 - x0) * i / 10, big = i === 0 || i === 10 || i === 5;
      h += '<line x1="' + x + '" y1="' + (y - (big ? 16 : 11)) + '" x2="' + x + '" y2="' + (y + (big ? 16 : 11)) + '" stroke="currentColor" stroke-width="' + (big ? 5 : 3.5) + '"/>';
      if (mode === 'ends' ? (i === 0 || i === 10) : (i === 0 || i === 5)) h += '<text x="' + x + '" y="' + (y + 48) + '" text-anchor="middle" font-size="34" font-weight="700" fill="currentColor">' + (s + i * step) + '</text>';
      if (i > 0) h += '<rect class="hit" data-hit="' + i + '" x="' + (x - 26) + '" y="' + (y - 50) + '" width="52" height="86" rx="10"/>';
    }
    h += '<g class="frog" data-x0="' + x0 + '" data-dx="' + (x1 - x0) / 10 + '" data-y="' + (y - 22) + '" transform="translate(' + x0 + ',' + (y - 22) + ')">' + FROG + '</g>';
    h += '</svg>';
    var endLabel = mode === 'ends' ? s + 10 * step : s + 5 * step, parts = mode === 'ends' ? 10 : 5;
    return { kind: 'tap', frog: true, text: '青蛙要跳到「' + target + '」，點那個刻度！', say: '青蛙要跳到' + target + '，點一下那個刻度！', svg: h,
      answer: String(k), answerText: target + '（第 ' + k + ' 格）', review: '數線 ' + s + '～' + endLabel + '，跳到 ' + target,
      hint: '先看 1 小格是多少：從 ' + s + ' 到 ' + endLabel + ' 分成 ' + parts + ' 格，1 格是 ' + step + '。',
      explain: '<p class="ex-line">1 格是 ' + step + '，' + target + ' 是從 ' + s + ' 往右數 <b>' + k + ' 格</b>。</p>' };
  }

  /* ---------- 第 4 單元 幾毫米 ---------- */
  function genMm() {
    var t = R(0, 3), cm = R(1, 25), mm = R(1, 9);
    if (t === 0) {
      var ans = cm * 10 + mm;
      return { text: cm + ' 公分 ' + mm + ' 毫米 ＝ ？ 毫米', say: cm + '公分' + mm + '毫米，是幾毫米？',
        answer: String(ans), options: opts(ans, [cm + mm, cm * 100 + mm, mm * 10 + cm, cm * 10, ans + 10]),
        hint: '1 公分 ＝ 10 毫米。' + cm + ' 公分是 ' + cm * 10 + ' 毫米，再加 ' + mm + ' 毫米。',
        explain: '<p class="ex-line">' + cm + ' 公分 ＝ ' + cm * 10 + ' 毫米</p><p class="ex-line">' + cm * 10 + ' ＋ ' + mm + ' ＝ <b>' + ans + '</b> 毫米</p>' };
    }
    if (t === 1) {
      var n = cm * 10 + mm;
      return { text: n + ' 毫米 ＝ ？', say: n + '毫米，是幾公分幾毫米？', cls: 'zh',
        answer: cmmm(cm, mm), options: opts(cmmm(cm, mm), [cmmm(mm, cm), n + ' 公分', cmmm(cm + 1, mm), cmmm(Math.floor(n / 100) || cm - 1, n % 100)]),
        hint: '10 毫米是 1 公分。' + n + ' 毫米裡有 ' + cm + ' 個 10 毫米，還剩 ' + mm + ' 毫米。',
        explain: '<p class="ex-line">' + n + ' 毫米 ＝ ' + cm * 10 + ' 毫米 ＋ ' + mm + ' 毫米 ＝ <b>' + cmmm(cm, mm) + '</b></p>' };
    }
    if (t === 2) {
      return { text: cm + ' 公分 ＝ ？ 毫米', say: cm + '公分，是幾毫米？',
        answer: String(cm * 10), options: opts(cm * 10, [cm * 100, cm, cm + 10, cm * 10 + 10]),
        hint: '1 公分 ＝ 10 毫米，' + cm + ' 公分就是 ' + cm + ' 個 10 毫米。',
        explain: '<p class="ex-line">' + cm + ' 公分 ＝ <b>' + cm * 10 + '</b> 毫米</p>' };
    }
    var a = cm * 10 + mm, bcm = Math.max(1, cm + pick([-1, 1, 2])), b = bcm * 10;
    var longer = a > b ? a + ' 毫米' : bcm + ' 公分';
    return { text: a + ' 毫米 和 ' + bcm + ' 公分，哪一個比較長？', say: a + '毫米，和' + bcm + '公分，哪一個比較長？', cls: 'zh',
      answer: longer, options: opts(longer, [a + ' 毫米', bcm + ' 公分', '一樣長']),
      hint: '先換成一樣的單位：' + bcm + ' 公分 ＝ ' + b + ' 毫米，再比大小。',
      explain: '<p class="ex-line">' + bcm + ' 公分 ＝ ' + b + ' 毫米。' + a + ' 毫米 和 ' + b + ' 毫米比，<b>' + longer + '</b>比較長。</p>' };
  }
  function rulerSVG(startMm, lenMm) {
    var W = 660, x0 = 30, u = 6;
    var c0 = Math.floor(startMm / 10), c1 = Math.min(10, Math.ceil((startMm + lenMm) / 10)); // 只畫鉛筆經過的幾公分
    var vx = x0 + c0 * 10 * u - 22, vw = (c1 - c0) * 10 * u + 44;
    var h = '<svg class="ruler" viewBox="' + vx + ' 0 ' + vw + ' 150" role="img" aria-label="尺">';
    var ax = x0 + startMm * u, bx = x0 + (startMm + lenMm) * u;
    h += '<rect x="' + ax + '" y="22" width="' + (bx - ax - 18) + '" height="26" rx="4" fill="#3C8DD9"/>';
    h += '<path d="M' + (bx - 18) + ' 22 L' + bx + ' 35 L' + (bx - 18) + ' 48 Z" fill="#F2D3A2"/><path d="M' + (bx - 6) + ' 31.5 L' + bx + ' 35 L' + (bx - 6) + ' 38.5 Z" fill="#2B2A28"/>';
    h += '<line x1="' + ax + '" y1="50" x2="' + ax + '" y2="72" stroke="#E0503A" stroke-width="2" stroke-dasharray="4 3"/><line x1="' + bx + '" y1="50" x2="' + bx + '" y2="72" stroke="#E0503A" stroke-width="2" stroke-dasharray="4 3"/>';
    h += '<rect x="' + (vx + 6) + '" y="72" width="' + (vw - 12) + '" height="66" rx="6" fill="#FFE9A8" stroke="#C9A548" stroke-width="2"/>';
    for (var m = c0 * 10; m <= c1 * 10; m++) {
      var x = x0 + m * u, L = m % 10 === 0 ? 26 : m % 5 === 0 ? 18 : 11;
      h += '<line x1="' + x + '" y1="72" x2="' + x + '" y2="' + (72 + L) + '" stroke="#2B2A28" stroke-width="' + (m % 10 === 0 ? 2.2 : 1.2) + '"/>';
      if (m % 10 === 0) h += '<text x="' + x + '" y="124" text-anchor="middle" font-size="20" font-weight="700" fill="#2B2A28">' + m / 10 + '</text>';
    }
    return h + '<text x="' + (vx + vw - 12) + '" y="134" text-anchor="end" font-size="13" fill="#7A6A3A">公分</text></svg>';
  }
  function rulerCase() {
    var start = pick([0, 10, 20, 30, 20, 10]), len = R(21, 69);
    if (start + len > 98) len = 98 - start;
    return { start: start, len: len, cm: Math.floor(len / 10), mm: len % 10, end: start + len };
  }
  function rulerTexts(c) {
    return {
      hint: c.start ? '鉛筆不是從 0 開始！從 ' + c.start / 10 + ' 開始數，或是用「結束的地方」減「開始的地方」。' : '先數有幾個大格（公分），再數剩下幾個小格（毫米）。',
      explain: '<p class="ex-line">鉛筆從 ' + c.start / 10 + ' 公分 量到 ' + cmmm(Math.floor(c.end / 10), c.end % 10) + '</p><p class="ex-line">' + c.end + ' 毫米 － ' + c.start + ' 毫米 ＝ ' + c.len + ' 毫米 ＝ <b>' + cmmm(c.cm, c.mm) + '</b></p>'
    };
  }
  function genRulerFill() { // 4-2 📏 自己填
    var c = rulerCase(), t = rulerTexts(c);
    return { kind: 'fill', text: '鉛筆有多長？', say: '鉛筆有多長？看看鉛筆從哪裡開始，到哪裡結束。', visual: rulerSVG(c.start, c.len), wide: true,
      fields: [{ label: '公分', ans: c.cm }, { label: '毫米', ans: c.mm }], autoNext: true, answer: cmmm(c.cm, c.mm), review: '鉛筆從 ' + c.start / 10 + ' 公分 量到 ' + cmmm(Math.floor(c.end / 10), c.end % 10),
      hint: t.hint, explain: t.explain };
  }
  function genRulerPick() { // 闖關用：選答案
    var c = rulerCase(), t = rulerTexts(c), ans = cmmm(c.cm, c.mm);
    return { text: '鉛筆有多長？', say: '鉛筆有多長？', visual: rulerSVG(c.start, c.len), wide: true, cls: 'zh',
      answer: ans, options: opts(ans, [cmmm(Math.floor(c.end / 10), c.end % 10), cmmm(c.cm + 1, c.mm), cmmm(c.cm, c.mm === 9 ? 8 : c.mm + 1)]),
      review: '鉛筆從 ' + c.start / 10 + ' 公分 量到 ' + cmmm(Math.floor(c.end / 10), c.end % 10), hint: t.hint, explain: t.explain };
  }

  /* ---------- 第 5 單元 角 ---------- */
  function angleSVG(x, y, deg, rot, l1, l2, label) {
    var r1 = rot * Math.PI / 180, r2 = (rot + deg) * Math.PI / 180;
    var p1 = [x + Math.cos(r1) * l1, y - Math.sin(r1) * l1], p2 = [x + Math.cos(r2) * l2, y - Math.sin(r2) * l2];
    var a1 = [x + Math.cos(r1) * 24, y - Math.sin(r1) * 24], a2 = [x + Math.cos(r2) * 24, y - Math.sin(r2) * 24];
    var h = '<path d="M' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' A24 24 0 0 0 ' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1) + '" fill="none" stroke="#E0503A" stroke-width="4"/>';
    h += '<line x1="' + x + '" y1="' + y + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" stroke="#2B2A28" stroke-width="5" stroke-linecap="round"/>';
    h += '<line x1="' + x + '" y1="' + y + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="#2B2A28" stroke-width="5" stroke-linecap="round"/>';
    h += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#2B2A28"/>';
    if (label) h += '<text x="' + x + '" y="' + (y + 42) + '" text-anchor="middle" font-size="30" font-weight="700" fill="#2A63A8">' + label + '</text>';
    return h;
  }
  function genAngleQuick() { // 5-1 ⭕❌ 比角的大小：2～4 個角（甲乙丙丁），邊的長短故意跟角的大小相反
    var n = pick([2, 3, 3, 4, 4]), names = ['甲', '乙', '丙', '丁'].slice(0, n), degs, same = n === 2 && Math.random() < .2;
    do { // 角度彼此至少差 15 度
      degs = names.map(function () { return R(25, 160); });
      if (same) degs[1] = degs[0];
    } while (!same && degs.some(function (d, i) { return degs.some(function (e, j) { return i !== j && Math.abs(d - e) < 15; }); }));
    var askMax = n === 2 || Math.random() < .6, target = askMax ? Math.max.apply(null, degs) : Math.min.apply(null, degs);
    var ans = same ? '一樣大' : names[degs.indexOf(target)];
    // 邊長：角越大邊越短（最常見的誤會是「邊長的角比較大」），偶爾打亂
    var order = degs.slice().sort(function (x, y) { return x - y; }), cols = 2, cw = 280, chH = 200;
    var svg = svgOpen(cols * cw, Math.ceil(n / cols) * chH, '幾個角');
    names.forEach(function (nm, i) {
      var rank = order.indexOf(degs[i]) / Math.max(1, n - 1), L = cw * (.44 - rank * .22);
      if (Math.random() < .2) L = cw * (.2 + Math.random() * .24);
      // 頂點放在格子中間：張很開的角往左邊伸也不會被切掉
      var col = i % cols, row = Math.floor(i / cols), x = col * cw + cw * .5, y = row * chH + chH * .7;
      svg += angleSVG(x, y, degs[i], R(-5, 15), L, L * (.85 + Math.random() * .15), nm);
    });
    svg += '</svg>';
    var q = askMax ? (n === 2 ? '哪一個角比較大？' : '哪一個角最大？') : '哪一個角最小？';
    return { kind: 'quiz', text: q, say: names.join('、') + '，' + q, visual: svg, wide: true,
      answer: ans, options: n === 2 ? ['甲', '一樣大', '乙'] : names.slice(), review: names.map(function (nm, i) { return nm + ' ' + degs[i] + ' 度'; }).join('、') + '：' + q.replace('？', ''),
      hint: '角的大小，看兩條邊「張開」多少，跟邊畫得長或短沒有關係！',
      explain: '<p class="ex-line">看紅色弧線：兩條邊張開得越大，角就越大；邊畫得長，角不會變大。</p><p class="ex-line">' +
        names.map(function (nm, i) { return nm + ' ' + degs[i] + '°'; }).join('、') + '，答案是 <b>' + ans + '</b>。</p>' };
  }
  function angleCard() {
    var kind = R(0, 2), deg = kind === 0 ? 90 : kind === 1 ? R(115, 155) : R(30, 65), rot = R(0, 359);
    return { kind: kind, deg: deg, svg: svgOpen(260, 260, '一個角') + angleSVG(130, 130, deg, rot, 105, 95, '') + '</svg>' };
  }
  var ANGLE_BINS = ['比直角小', '直角', '比直角大'];
  /* 分類格子上畫一個那一種的角（直角加上直角記號），讓孩子拿卡片來比 */
  function binAngle(deg, mark) {
    var r = deg * Math.PI / 180, x = 14 + Math.cos(r) * 44, y = 52 - Math.sin(r) * 44;
    return '<svg viewBox="0 0 80 60" width="64" height="48" aria-hidden="true"><path d="M58 52 L14 52 L' + x.toFixed(1) + ' ' + y.toFixed(1) + '" fill="none" stroke="#2B2A28" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      (mark ? '<path d="M14 42 L24 42 L24 52" fill="none" stroke="#E0503A" stroke-width="3"/>' : '<path d="M28 52 A14 14 0 0 0 ' + (14 + Math.cos(r) * 14).toFixed(1) + ' ' + (52 - Math.sin(r) * 14).toFixed(1) + '" fill="none" stroke="#E0503A" stroke-width="3"/>') + '</svg>';
  }
  var ANGLE_BIN_ICONS = [binAngle(45), binAngle(90, true), binAngle(135)];
  function genAngleSort() { // 5-2 🗑️ 分類
    var c = angleCard(), ans = ['直角', '比直角大', '比直角小'][c.kind];
    return { kind: 'sort', text: '這個角是哪一種？', say: '這個角是直角、比直角大，還是比直角小？', card: c.svg, bins: ANGLE_BINS, binIcons: ANGLE_BIN_ICONS,
      answer: ans, review: '一個 ' + c.deg + ' 度的角',
      hint: '拿三角板的直角來比：剛好疊在一起是直角；張開比較多是比直角大。',
      explain: '<p class="ex-line">' + c.deg + ' 度的角' + (c.kind === 0 ? '剛好是直角' : c.kind === 1 ? '張開得比直角大' : '張開得比直角小') + '，放進「<b>' + ans + '</b>」。</p>' };
  }
  function genAngleRun() { var q = genAngleQuick(); delete q.kind; q.lv = q.options.indexOf('一樣大') >= 0 ? 1 : q.options.length === 3 ? 2 : 3; return q; }

  /* ---------- 第 6 單元 除法 ---------- */
  function divCase() {
    var b = R(2, 9), q = R(2, 9), r = Math.random() < .75 ? R(1, b - 1) : 0, a = q * b + r;
    return a > 99 || a < 10 ? divCase() : { a: a, b: b, q: q, r: r };
  }
  function qr(q, r) { return q + ' … ' + r; }
  function genDivRun() { // 6-1 🏃 做除法
    var c = divCase(), ans = qr(c.q, c.r), w = [];
    if (c.q >= 2) w.push(qr(c.q - 1, c.r + c.b));
    w.push(qr(c.q + 1, Math.abs(c.r - c.b)), qr(c.q, c.r + 1 < c.b ? c.r + 1 : c.r - 1), qr(c.q, 0));
    return { text: c.a + ' ÷ ' + c.b + ' ＝ ？', say: c.a + ' 除以 ' + c.b + '，商是多少，餘數是多少？', answer: ans, options: opts(ans, w), cls: 'zh',
      hint: '想 ' + c.b + ' 的乘法：' + c.b + ' × ' + c.q + ' ＝ ' + c.b * c.q + '，' + c.a + ' － ' + c.b * c.q + ' ＝ ' + c.r + '。餘數一定要比 ' + c.b + ' 小！',
      explain: '<p class="ex-line">' + c.b + ' × ' + c.q + ' ＝ ' + c.b * c.q + '，' + c.a + ' － ' + c.b * c.q + ' ＝ ' + c.r + '</p><p class="ex-line">' + c.a + ' ÷ ' + c.b + ' ＝ <b>' + ans + '</b>（商 ' + c.q + '，餘數 ' + c.r + '）</p><p class="ex-line">驗算：' + c.b + ' × ' + c.q + ' ＋ ' + c.r + ' ＝ ' + c.a + '</p>' };
  }
  function genOddEven() { // 6-2 🗑️ 奇數偶數
    var n = pick([R(1, 99), R(100, 999), R(1000, 9999)]), ans = n % 2 ? '奇數' : '偶數';
    return { kind: 'sort', text: '這個數是奇數還是偶數？', say: n + '，是奇數還是偶數？', card: '<span class="card-num">' + n + '</span>', bins: ['奇數', '偶數'],
      answer: ans, review: String(n),
      hint: '只看個位：個位是 0、2、4、6、8 是偶數；1、3、5、7、9 是奇數。',
      explain: '<p class="ex-line">' + n + ' 的個位是 ' + n % 10 + '，所以是<b>' + ans + '</b>。</p>' };
  }
  function genLeftover() { // 6-3 🧩 剩下的怎麼辦？
    var b = R(3, 9), q = R(2, 9), r = R(1, b - 1), a = q * b + r, t = R(0, 2), s;
    if (t === 0) {
      s = pick([['個人去郊遊，每輛車最多坐', '人', '最少要幾輛車', '輛', '剩下的 ' + r + ' 個人也要坐車，所以要再多 1 輛'],
                ['個人要過河，每條船最多坐', '人', '最少要幾條船', '條', '剩下的 ' + r + ' 個人也要過河，所以要再多 1 條'],
                ['顆蛋，每個盒子最多裝', '顆', '最少要幾個盒子', '個', '剩下的 ' + r + ' 顆蛋也要裝，所以要再多 1 個']]);
      var ans0 = (q + 1) + ' ' + s[3];
      return { kind: 'quiz', text: '有 ' + a + ' ' + s[0] + ' ' + b + ' ' + s[1] + '。' + s[2] + '？', say: '有' + a + s[0] + b + s[1] + '。' + s[2] + '？',
        answer: ans0, options: opts(ans0, [q + ' ' + s[3], r + ' ' + s[3], (q + 2) + ' ' + s[3], (q - 1) + ' ' + s[3]]), cls: 'zh', review: a + ' ÷ ' + b + '：' + s[2],
        hint: a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '。' + s[4] + '！',
        explain: '<p class="ex-line">' + a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '</p><p class="ex-line">' + s[4] + '：' + q + ' ＋ 1 ＝ <b>' + ans0 + '</b></p>' };
    }
    if (t === 1) {
      s = pick([['顆糖，每', '顆裝一袋', '可以裝滿幾袋', '袋'], ['枝鉛筆，每', '枝綁成一把', '可以綁成幾把', '把'], ['張貼紙，每人分', '張', '可以分給幾個人', '人']]);
      var ans1 = q + ' ' + s[3];
      return { kind: 'quiz', text: '有 ' + a + ' ' + s[0] + ' ' + b + ' ' + s[1] + '，' + s[2] + '？', say: '有' + a + s[0] + b + s[1] + '，' + s[2] + '？',
        answer: ans1, options: opts(ans1, [(q + 1) + ' ' + s[3], r + ' ' + s[3], (q + 2) + ' ' + s[3], (q - 1) + ' ' + s[3]]), cls: 'zh', review: a + ' ÷ ' + b + '：' + s[2],
        hint: a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '。剩下的 ' + r + ' 個不夠 ' + b + ' 個，不能再多一' + s[3] + '。',
        explain: '<p class="ex-line">' + a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '</p><p class="ex-line">剩下的不夠，答案是 <b>' + ans1 + '</b>。</p>' };
    }
    s = pick([['顆糖，平分給', '個小朋友，每人分一樣多，還剩幾顆', '顆'], ['張卡片，平分給', '個人，每人分一樣多，還剩幾張', '張']]);
    var ans2 = r + ' ' + s[2];
    return { kind: 'quiz', text: '有 ' + a + ' ' + s[0] + ' ' + b + ' ' + s[1] + '？', say: '有' + a + s[0] + b + s[1] + '？',
      answer: ans2, options: opts(ans2, [q + ' ' + s[2], (r + b) + ' ' + s[2], b + ' ' + s[2], (r + 1) + ' ' + s[2]]), cls: 'zh', review: a + ' ÷ ' + b + '：還剩幾個',
      hint: a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '。問「還剩幾個」就是看餘數。',
      explain: '<p class="ex-line">' + a + ' ÷ ' + b + ' ＝ ' + q + ' … ' + r + '，每人 ' + q + ' ' + s[2] + '，還剩 <b>' + ans2 + '</b>。</p>' };
  }

  /* ---------- 第 7 單元 公升和毫升 ---------- */
  function genLiter() {
    var t = R(0, 3), l = R(1, 9), ml = pick([5, 8, 20, 50, 80, 250, 300, 600, 45, 705]);
    if (t === 0) {
      var ans = l * 1000 + ml;
      return { text: lml(l, ml) + ' ＝ ？ 毫升', say: l + '公升' + ml + '毫升，是幾毫升？', answer: String(ans),
        options: opts(ans, [+(String(l) + String(ml)), l * 10000 + ml, l * 1000 + ml * 10, l * 100 + ml]),
        hint: '1 公升 ＝ 1000 毫升。' + l + ' 公升是 ' + l * 1000 + ' 毫升，再加 ' + ml + ' 毫升；不夠的位要補 0。',
        explain: '<p class="ex-line">' + l + ' 公升 ＝ ' + l * 1000 + ' 毫升</p><p class="ex-line">' + l * 1000 + ' ＋ ' + ml + ' ＝ <b>' + ans + '</b> 毫升</p>' };
    }
    if (t === 1) {
      var n = l * 1000 + ml, a1 = lml(l, ml);
      return { text: n + ' 毫升 ＝ ？', say: n + '毫升，是幾公升幾毫升？', answer: a1, cls: 'zh',
        options: opts(a1, [lml(Math.floor(n / 100), n % 100), lml(l, ml * 10 < 1000 ? ml * 10 : ml + 1), n + ' 公升', lml(l * 10, ml)]),
        hint: '1000 毫升是 1 公升。' + n + ' 毫升裡有 ' + l + ' 個 1000 毫升，還剩 ' + ml + ' 毫升。',
        explain: '<p class="ex-line">' + n + ' 毫升 ＝ ' + l * 1000 + ' 毫升 ＋ ' + ml + ' 毫升 ＝ <b>' + a1 + '</b></p>' };
    }
    if (t === 2) {
      return { text: l + ' 公升 ＝ ？ 毫升', say: l + '公升，是幾毫升？', answer: String(l * 1000),
        options: opts(l * 1000, [l * 100, l * 10, l * 10000]),
        hint: '1 公升 ＝ 1000 毫升，' + l + ' 公升就是 ' + l + ' 個 1000 毫升。',
        explain: '<p class="ex-line">' + l + ' 公升 ＝ <b>' + l * 1000 + '</b> 毫升</p>' };
    }
    var m = R(2, 9) * 100 + pick([0, 50]) + 1000 * R(0, 2), lt = R(1, 3), more = m > lt * 1000 ? m + ' 毫升' : m === lt * 1000 ? '一樣多' : lt + ' 公升';
    return { text: m + ' 毫升 和 ' + lt + ' 公升，哪一個比較多？', say: m + '毫升，和' + lt + '公升，哪一個比較多？', cls: 'zh',
      answer: more, options: opts(more, [m + ' 毫升', lt + ' 公升', '一樣多']),
      hint: '先換成一樣的單位：' + lt + ' 公升 ＝ ' + lt * 1000 + ' 毫升。',
      explain: '<p class="ex-line">' + lt + ' 公升 ＝ ' + lt * 1000 + ' 毫升，和 ' + m + ' 毫升比，' + (more === '一樣多' ? '<b>一樣多</b>' : '<b>' + more + '</b>比較多') + '。</p>' };
  }

  /* ---------- 第 8 單元 分數 ---------- */
  function pieSVG(n, k, shape, hit, unequal) {
    var h = svgOpen(320, shape === 'bar' ? 150 : 300, '平分成 ' + n + ' 份的圖', 'shapes fracpic'), i;
    if (shape === 'bar') {
      var w = 280 / n, xs = [];
      if (unequal) { var cuts = [0, 40, 150, 210, 280]; for (i = 0; i < 4; i++) xs.push([20 + cuts[i], cuts[i + 1] - cuts[i]]); }
      else for (i = 0; i < n; i++) xs.push([20 + i * w, w]);
      xs.forEach(function (p, j) {
        h += '<rect ' + (hit ? 'class="part" data-part="' + j + '" ' : '') + 'x="' + p[0] + '" y="20" width="' + p[1] + '" height="110" fill="' + (j < k ? '#FF9F43' : '#fff') + '" stroke="#2B2A28" stroke-width="3"/>';
      });
    } else {
      var cx = 160, cy = 150, r = 130;
      if (n === 1) h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (k ? '#FF9F43' : '#fff') + '" stroke="#2B2A28" stroke-width="3"/>';
      for (i = 0; i < n && n > 1; i++) {
        var a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n;
        var d = 'M' + cx + ' ' + cy + ' L' + (cx + r * Math.cos(a0)).toFixed(1) + ' ' + (cy + r * Math.sin(a0)).toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1) + ' Z';
        h += '<path ' + (hit ? 'class="part" data-part="' + i + '" ' : '') + 'd="' + d + '" fill="' + (i < k ? '#FF9F43' : '#fff') + '" stroke="#2B2A28" stroke-width="3" stroke-linejoin="round"/>';
      }
    }
    return h + '</svg>';
  }
  function frac(a, b) { return a + '/' + b; }
  function genPaint() { // 8-1 🍕 塗色
    var shape = Math.random() < .55 ? 'pie' : 'bar', n = shape === 'pie' ? pick([2, 3, 4, 5, 6, 8, 10, 12]) : R(2, 10), k = R(1, n - 1);
    return { kind: 'paint', text: '把圖塗出 ' + frac(k, n) + '！', say: '把圖塗出' + n + '分之' + k + '。點一下就會塗上顏色，再點一下可以擦掉。',
      paint: { n: n, k: k, shape: shape }, svg: pieSVG(n, 0, shape, true), answer: frac(k, n), review: '塗出 ' + frac(k, n),
      hint: '分母 ' + n + '：整個平分成 ' + n + ' 份；分子 ' + k + '：塗其中的 ' + k + ' 份。',
      explain: '<p class="ex-line">' + frac(k, n) + '：平分成 ' + n + ' 份，塗 <b>' + k + ' 份</b>。</p>' };
  }
  function genFracRun() { // 8-2 🏃 看圖選分數、幾個幾分之一
    var t = R(0, 4), n, k;
    if (t <= 1) {
      var shape = t ? 'bar' : 'pie'; n = shape === 'pie' ? pick([3, 4, 5, 6, 8, 10, 12]) : R(3, 10); k = R(1, n - 1);
      return { text: '塗色的部分是全部的幾分之幾？', say: '塗色的部分，是全部的幾分之幾？', visual: pieSVG(n, k, shape, false), answer: frac(k, n),
        options: opts(frac(k, n), [frac(n - k, n), frac(k, n - k), frac(n, k)]), review: '平分成 ' + n + ' 份，塗了 ' + k + ' 份',
        hint: '數一數：全部平分成幾份（分母），塗了幾份（分子）。',
        explain: '<p class="ex-line">平分成 ' + n + ' 份，塗了 ' + k + ' 份，是 <b>' + frac(k, n) + '</b>。</p>' };
    }
    if (t === 2) {
      n = pick([4, 5, 6, 8, 9, 10, 12]); k = R(2, n - 1);
      if (Math.random() < .3) return { text: n + ' 個 ' + frac(1, n) + ' 合起來是多少？', say: n + '個' + n + '分之1，合起來是多少？', answer: '1',
        options: opts('1', [frac(n, n * n), frac(1, n)]), hint: n + ' 個 ' + frac(1, n) + ' 就是 ' + frac(n, n) + '，也就是 1 個整個。',
        explain: '<p class="ex-line">' + n + ' 個 ' + frac(1, n) + ' ＝ ' + frac(n, n) + ' ＝ <b>1</b></p>' };
      return { text: k + ' 個 ' + frac(1, n) + ' 是多少？', say: k + '個' + n + '分之1，是多少？', answer: frac(k, n),
        options: opts(frac(k, n), [frac(k, k * n), frac(1, k * n), frac(k + 1, n)]), hint: '分母不變，數一數有幾個 ' + frac(1, n) + '，就是分子。',
        explain: '<p class="ex-line">' + k + ' 個 ' + frac(1, n) + ' ＝ <b>' + frac(k, n) + '</b></p>' };
    }
    if (t === 3) { // 一定要平分
      var eq = Math.random() < .5;
      return { text: '這個圖塗色的部分，可以說是 ' + frac(1, 4) + ' 嗎？', say: '這個圖塗色的部分，可以說是4分之1嗎？', visual: pieSVG(4, 1, 'bar', false, !eq),
        answer: eq ? '可以' : '不可以', options: ['可以', '不可以'], review: (eq ? '平分' : '沒有平分') + '的 4 格',
        hint: '要「平分」，每一份一樣大，才可以用分數說。',
        explain: '<p class="ex-line">' + (eq ? '4 份一樣大，塗 1 份是 <b>' + frac(1, 4) + '</b>，可以。' : '4 份不一樣大，沒有平分，<b>不可以</b>說是 ' + frac(1, 4) + '。') + '</p>' };
    }
    k = R(2, 11);
    return { text: '1 打有 12 個，' + k + ' 個是幾打？', say: '1打有12個，' + k + '個是幾打？', answer: frac(k, 12),
      options: opts(frac(k, 12), [frac(12, k), frac(k, 1), frac(1, k)]), hint: '1 打平分成 12 個，1 個是 ' + frac(1, 12) + ' 打。',
      explain: '<p class="ex-line">1 個是 ' + frac(1, 12) + ' 打，' + k + ' 個是 <b>' + frac(k, 12) + '</b> 打。</p>' };
  }

  /* ---------- 第 9 單元 圓 ---------- */
  var CIRCLE_FACTS = [
    ['同一個圓的半徑，長度怎麼樣？', '都一樣長', ['都不一樣長', '有的長有的短']],
    ['一個圓有幾條半徑？', '很多很多條', ['1 條', '2 條']],
    ['直徑會經過圓的哪裡？', '圓心', ['圓的外面', '不一定']]
  ];
  function genCircleRun() { // 9-1 🏃 半徑和直徑
    var t = R(0, 2), r = R(2, 15);
    if (t === 0) return { text: '半徑 ' + r + ' 公分，直徑是幾公分？', say: '半徑' + r + '公分，直徑是幾公分？', answer: String(r * 2),
      options: opts(r * 2, [r, r + 2, r * 4, Math.floor(r / 2) || 1]), hint: '直徑 ＝ 2 條半徑，半徑 × 2。',
      explain: '<p class="ex-line">直徑 ＝ ' + r + ' × 2 ＝ <b>' + r * 2 + '</b> 公分</p>' };
    if (t === 1) return { text: '直徑 ' + r * 2 + ' 公分，半徑是幾公分？', say: '直徑' + r * 2 + '公分，半徑是幾公分？', answer: String(r),
      options: opts(r, [r * 2, r * 4, r + 1]), hint: '半徑是直徑的一半，直徑 ÷ 2。',
      explain: '<p class="ex-line">半徑 ＝ ' + r * 2 + ' ÷ 2 ＝ <b>' + r + '</b> 公分</p>' };
    var f = pick(CIRCLE_FACTS);
    return { text: f[0], say: f[0], answer: f[1], options: shuffle([f[1]].concat(f[2])), cls: 'zh',
      hint: '從圓心到圓上的線是半徑，每一條都一樣長；穿過圓心、兩頭都在圓上的線是直徑。',
      explain: '<p class="ex-line">同一個圓：半徑有很多條、都一樣長；直徑穿過圓心，是半徑的 2 倍。</p>' };
  }
  function genCircleFind() { // 9-2 🔍 找找看
    var want = pick(['半徑', '直徑', '半徑', '直徑']), cx = 170, cy = 160, R0 = 130, ids = shuffle(['a', 'b', 'c', 'd']);
    function pt(deg, rr) { var a = deg * Math.PI / 180; return [(cx + Math.cos(a) * (rr || R0)).toFixed(1), (cy - Math.sin(a) * (rr || R0)).toFixed(1)]; }
    var base = R(0, 359), segs = [
      { type: '半徑', p: [[cx, cy], pt(base)] },
      { type: '直徑', p: [pt(base + 110), pt(base + 290)] },
      { type: '弦', p: [pt(base + 200), pt(base + 260)] },
      { type: '線', p: [pt(base + 30, 40), pt(base + 60)] }
    ];
    var colors = ['#3C8DD9', '#E35D4F', '#2D8A57', '#9B59B6'];
    var h = svgOpen(340, 320, '圓和四條線') + '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="#FFF8E7" stroke="#2B2A28" stroke-width="4"/>';
    segs.forEach(function (s, i) {
      var a = s.p[0], b = s.p[1];
      h += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + colors[i] + '" stroke-width="7" stroke-linecap="round"/>';
      h += '<line class="hit" data-hit="' + s.type + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="transparent" stroke-width="34" stroke-linecap="round"/>';
    });
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#2B2A28"/><text x="' + (cx + 10) + '" y="' + (cy + 26) + '" font-size="20" font-weight="700" fill="#2B2A28">圓心</text></svg>';
    return { kind: 'tap', text: '點一下圖上的「' + want + '」！', say: '點一下圖上的' + want + '。', svg: h, answer: want, answerText: want, review: '找出' + want,
      hint: want === '半徑' ? '半徑：從圓心連到圓上的線。' : '直徑：穿過圓心，兩頭都在圓上的線。',
      explain: '<p class="ex-line">半徑：一頭在圓心、一頭在圓上。直徑：穿過圓心、兩頭都在圓上。</p><p class="ex-line">沒有經過圓心的線，不是直徑。</p>' };
  }

  /* ---------- 九九口訣：小的數字在前面，例如 七八五十六、三三得九、二五一十 ---------- */
  function chant(a, b) {
    var x = Math.min(a, b), y = Math.max(a, b), p = a * b, d = '零一二三四五六七八九', head = d[x] + d[y];
    if (p < 10) return head + '得' + d[p];
    if (p === 10) return head + '一十';
    return head + zh(p);
  }

  /* =====================================================
   * 題庫擴充：跑酷每關再多幾種題型（開始時會從很多題裡隨機挑 10 題）
   * ===================================================== */
  function pickUnit(ans, units) { return { answer: ans, options: shuffle(units.slice()) }; }
  function more1() { // 1-1：位值、比大小
    var n = zeroNumber();
    if (Math.random() < .5) {
      var places = ['個位', '十位', '百位', '千位'], i = R(0, 3), d = dig(n, i);
      return { text: n + ' 的' + places[i] + '數字是多少？', say: n + '的' + places[i] + '數字是多少？', big: String(n),
        answer: String(d), options: opts(d, [dig(n, (i + 1) % 4), dig(n, (i + 3) % 4), d + 1, d === 0 ? 2 : d - 1, (d + 5) % 10]),
        hint: '從右邊數過來：個位、十位、百位、千位。', explain: placeTable(n) };
    }
    var sh = shifts(n), m = sh.length ? sh[0] : n + pick([10, 100, -10]);
    var big = Math.max(n, m), ans = String(big);
    return { text: n + ' 和 ' + m + '，哪一個比較大？', say: zh(n) + '，和' + zh(m) + '，哪一個比較大？',
      answer: ans, options: opts(ans, [String(Math.min(n, m)), '一樣大']),
      hint: '從最大的位（千位）開始比，一樣就比下一位。', explain: placeTable(big) };
  }
  var MM_EST = [['一枝鉛筆大約長 15 ＿', '公分'], ['一隻螞蟻大約長 5 ＿', '毫米'], ['一元硬幣大約厚 2 ＿', '毫米'], ['數學課本大約長 26 ＿', '公分'],
    ['大拇指的指甲大約寬 1 ＿', '公分'], ['教室的門大約高 2 ＿', '公尺'], ['橡皮擦大約厚 1 ＿', '公分'], ['一粒米大約長 5 ＿', '毫米']];
  function more4() { // 4-1：估一估用哪個單位
    var e = pick(MM_EST), q = pickUnit(e[1], ['毫米', '公分', '公尺']);
    return { text: e[0] + '，＿ 要填哪一個單位？', say: e[0].replace('＿', '什麼') + '？', answer: q.answer, options: q.options, cls: 'zh', review: e[0],
      hint: '想一想實際有多長：1 毫米很短（像一粒沙），1 公分像指甲那麼寬，1 公尺像大人張開手臂。',
      explain: '<p class="ex-line">' + e[0].replace('＿', '<b>' + e[1] + '</b>') + '</p>' };
  }
  function more6() { // 6-1：餘數可能是幾、□ ÷ b ＝ q … r
    var b = R(3, 9), q = R(2, 9), r = R(1, b - 1);
    if (Math.random() < .5) {
      var ok = R(1, b - 1);
      return { text: '除數是 ' + b + '，餘數可能是幾？', say: '除數是' + b + '，餘數可能是幾？', answer: String(ok), options: opts(ok, [b, b + R(1, 3), b + 4]),
        hint: '餘數一定要比除數小！除數是 ' + b + '，餘數只能是 0 到 ' + (b - 1) + '。',
        explain: '<p class="ex-line">餘數比 ' + b + ' 小才對，答案是 <b>' + ok + '</b>。</p>' };
    }
    var a = b * q + r;
    return { text: '□ ÷ ' + b + ' ＝ ' + q + ' … ' + r + '，□ 是多少？', say: '方格除以' + b + '，等於' + q + '餘' + r + '，方格是多少？',
      answer: String(a), options: opts(a, [b * q, b * q - r, b + q + r, a + b]),
      hint: '用驗算的方法：除數 × 商 ＋ 餘數 ＝ 被除數。',
      explain: '<p class="ex-line">' + b + ' × ' + q + ' ＋ ' + r + ' ＝ <b>' + a + '</b></p>' };
  }
  var L_EST = [['一瓶養樂多大約 100 ＿', '毫升'], ['一桶水大約 10 ＿', '公升'], ['一湯匙藥水大約 5 ＿', '毫升'], ['一大瓶鮮奶大約 2 ＿', '公升'],
    ['一杯水大約 250 ＿', '毫升'], ['浴缸的水大約 200 ＿', '公升'], ['一罐飲料大約 330 ＿', '毫升']];
  function more7() { // 7-1：估一估、1 公升減一些
    if (Math.random() < .5) {
      var e = pick(L_EST), u = pickUnit(e[1], ['毫升', '公升']);
      return { text: e[0] + '，＿ 要填哪一個單位？', say: e[0].replace('＿', '什麼') + '？', answer: u.answer, options: u.options, cls: 'zh', review: e[0],
        hint: '1 毫升很少（像幾滴水），1 公升是一大瓶。', explain: '<p class="ex-line">' + e[0].replace('＿', '<b>' + e[1] + '</b>') + '</p>' };
    }
    var used = R(1, 9) * 100 + pick([0, 50]), left = 1000 - used;
    return { text: '1 公升的水，喝掉 ' + used + ' 毫升，還剩幾毫升？', say: '1公升的水，喝掉' + used + '毫升，還剩幾毫升？',
      answer: String(left), options: opts(left, [1000 + used, 100 - used > 0 ? 100 - used : left + 100, left - 100, used]),
      hint: '先把 1 公升換成 1000 毫升，再減。', explain: '<p class="ex-line">1 公升 ＝ 1000 毫升，1000 － ' + used + ' ＝ <b>' + left + '</b> 毫升</p>' };
  }
  function more8() { // 8-2：同分母比大小、1 個整個是幾分之幾
    var n = R(4, 12), a = R(1, n - 1), b = R(1, n - 1);
    if (Math.random() < .6) {
      if (a === b) b = a === 1 ? 2 : a - 1;
      var ans = frac(Math.max(a, b), n);
      return { text: frac(a, n) + ' 和 ' + frac(b, n) + '，哪一個比較大？', say: n + '分之' + a + '，和' + n + '分之' + b + '，哪一個比較大？',
        answer: ans, options: opts(ans, [frac(Math.min(a, b), n), '一樣大']), hint: '分母一樣（都平分成 ' + n + ' 份），分子越大，拿的份數越多，就越大。',
        explain: '<p class="ex-line">' + Math.max(a, b) + ' 個 ' + frac(1, n) + ' 比 ' + Math.min(a, b) + ' 個 ' + frac(1, n) + ' 多，<b>' + ans + '</b> 比較大。</p>' };
    }
    return { text: '1 個整個披薩，平分成 ' + n + ' 片，是幾分之幾？', say: '1個整個披薩，平分成' + n + '片，是幾分之幾？',
      answer: frac(n, n), options: opts(frac(n, n), [frac(1, n), frac(n, 1), frac(n - 1, n)]), hint: '平分成 ' + n + ' 份，全部 ' + n + ' 份都拿，就是 ' + frac(n, n) + '，也就是 1。',
      explain: '<p class="ex-line">' + n + ' 個 ' + frac(1, n) + ' ＝ <b>' + frac(n, n) + '</b> ＝ 1</p>' };
  }
  function more9() { // 9-1：圓規、圓排在一起（進階）
    var t9 = Math.random();
    if (t9 < .4) { // 進階：幾個一樣大的圓排成一排，剛好放進長方形
      var rr = R(2, 9), k = R(2, 4);
      return { text: '長方形裡剛好排了 ' + k + ' 個一樣大的圓（排成一排），圓的半徑是 ' + rr + ' 公分，長方形有多長？', say: '長方形裡剛好排了' + k + '個一樣大的圓，排成一排，圓的半徑是' + rr + '公分，長方形有多長？',
        answer: String(rr * 2 * k), options: opts(rr * 2 * k, [rr * k, rr * 2, rr * 2 * k + rr]), review: k + ' 個半徑 ' + rr + ' 公分的圓排成一排',
        hint: '每個圓的直徑是半徑 × 2，長方形的長是 ' + k + ' 個直徑。', explain: '<p class="ex-line">直徑 ' + rr + ' × 2 ＝ ' + rr * 2 + '，' + rr * 2 + ' × ' + k + ' ＝ <b>' + rr * 2 * k + '</b> 公分</p>' };
    }
    if (t9 < .7) {
      var r = R(2, 9);
      return { text: '圓規張開 ' + r + ' 公分畫圓，這個圓的半徑是幾公分？', say: '圓規張開' + r + '公分畫圓，這個圓的半徑是幾公分？',
        answer: String(r), options: opts(r, [r * 2, r + 1, Math.max(1, r - 1)]), hint: '圓規兩隻腳張開的長度，就是畫出來的圓的半徑。',
        explain: '<p class="ex-line">圓規張開 ' + r + ' 公分，半徑就是 <b>' + r + '</b> 公分（直徑是 ' + r * 2 + ' 公分）。</p>' };
    }
    return { text: '用圓規畫圓，有針的那一腳要放在哪裡？', say: '用圓規畫圓，有針的那一腳要放在哪裡？', answer: '圓心', options: shuffle(['圓心', '圓上', '圓的外面']), cls: 'zh',
      hint: '針固定在中間不動，另一腳轉一圈，針的位置就是圓心。', explain: '<p class="ex-line">針放在<b>圓心</b>，筆的那一腳轉一圈。</p>' };
  }
  function bank(base, extra, p) { return function () { return Math.random() < (p || .3) ? extra() : base(); }; }
  /* 跑酷的難度（老師要求：初階、中階、進階）：依題型標 q.lv＝1、2、3，開始時從選的難度挑題 */
  function lv(gen, fn) { return function () { var q = gen(); q.lv = fn(q); return q; }; }
  function has(q, re) { return re.test(q.text); }
  var genReadWriteB = lv(bank(genReadWrite, more1), function (q) {
    if (has(q, /合起來|的(個|十|百|千)位數字/)) return 1;  // 位值
    if (has(q, /寫成數字|比較大/)) return 2;              // 國字寫成數字、比大小
    return 3;                                            // 數字寫成國字
  });
  var genMmB = lv(bank(genMm, more4), function (q) {
    if (has(q, /^\d+ 公分 ＝ ？ 毫米|大約/)) return 1;
    if (has(q, /比較長/)) return 3;
    return 2;
  });
  var genDivRunB = lv(bank(genDivRun, more6, .35), function (q) {
    if (has(q, /^□/)) return 3;
    if (has(q, /餘數可能/)) return 2;
    var a = +(/^(\d+)/.exec(q.text) || [0, 50])[1];
    return a < 30 ? 1 : a < 60 ? 2 : 3;
  });
  var genLiterB = lv(bank(genLiter, more7), function (q) {
    if (has(q, /大約|^\d 公升 ＝/)) return 1;
    var m = /公升 (\d+) 毫升 ＝/.exec(q.text);
    if (m) return +m[1] < 100 ? 3 : 2;                    // 中間要補 0 的最難
    if (has(q, /毫升 ＝ ？$/)) return 3;
    return 2;
  });
  var genFracRunB = lv(bank(genFracRun, more8), function (q) {
    if (has(q, /塗色的部分是全部|整個披薩/)) return 1;
    if (has(q, /打/)) return 3;
    return 2;
  });
  var genCircleRunB = lv(bank(genCircleRun, more9, .45), function (q) {
    if (has(q, /排成一排/)) return 3;
    if (has(q, /^半徑 \d+ 公分，直徑|圓規/)) return 1;
    if (has(q, /^直徑/)) return 2;
    return has(q, /幾條半徑/) ? 3 : 2;
  });
  var genNumberLineB = lv(genNumberLine, function (q) { var st = +(/1 格是 (\d+)/.exec(q.review) || [0, 10])[1]; return st >= 100 ? 1 : st === 10 ? 2 : 3; });
  var genRulerPickB = lv(genRulerPick, function (q) { return /從 0 公分/.test(q.review) ? 1 : 3; });

  /* ---------- 加油小站：混合闖關 ---------- */
  function mix(list) { return function () { var q = pick(list)(); q.kind = undefined; return q; }; }

  /* ========== 關卡清單 ==========
   * mode：run 跑酷、timed 2 分鐘挑戰、spot 小偵探、
   *       round（一局 10 題）：quiz ⭕❌ 快答／🧩 選答案、tap 點圖、sort 🗑️ 分類、paint 🍕 塗色、fill 📏 自己填
   * tut：說明頁用哪一套（第一次玩這一套才會自動播）
   * timed：bonus＝答對加幾秒；goals＝拿 1、2、3 顆星要答對幾題
   */
  var UNITS = [
    { id: '99', name: '九九乘法大冒險', ic: '🦊', stages: [
      { id: '99', mode: 'nine', ic: '🗺️', label: '九九大冒險', name: '九九乘法大冒險', desc: '答對往前走，打倒乘法大魔王！' }
    ] },
    { id: 1, name: '數到 10000', ic: '🔢', stages: [
      { id: '1-1', mode: 'run', name: '數字讀寫', desc: '國字和數字互換，中間的 0 別漏掉', gen: genReadWriteB },
      { id: '1-2', mode: 'round', tut: 'frog', ic: '📏', label: '數線跳跳', name: '數線跳跳', desc: '1 小格是多少？點刻度讓青蛙跳過去', gen: genFrog }
    ] },
    { id: 2, name: '四位數的加減', ic: '➕', stages: [
      { id: '2-1', mode: 'timed', name: '加法進位', desc: '滿 10 要進 1', make: makeAdd, bonus: 15, goals: [3, 6, 10] },
      { id: '2-2', mode: 'timed', name: '減法退位', desc: '不夠減要借；遇到 0 再往前借', make: makeSub, bonus: 20, goals: [3, 5, 8] },
      { id: '2-3', mode: 'spot', name: '找出加減的錯', desc: '同學的直式算對了嗎？錯在哪一位？', make: spotFrom(makeAddSub) }
    ] },
    { id: 3, name: '乘法', ic: '✖️', stages: [
      { id: '3-1', mode: 'timed', name: '乘法進位', desc: '乘完要加上進位', make: makeMul, bonus: 10, goals: [4, 8, 14] },
      { id: '3-2', mode: 'spot', name: '找出乘法的錯', desc: '同學忘記進位了嗎？', make: spotFrom(makeMul) }
    ] },
    { id: 4, name: '幾毫米', ic: '📏', stages: [
      { id: '4-1', mode: 'run', name: '公分和毫米', desc: '1 公分 ＝ 10 毫米，互相換一換', gen: genMmB },
      { id: '4-2', mode: 'round', tut: 'fill', ic: '📏', label: '看尺量長度', name: '看尺量長度', desc: '鉛筆不一定從 0 開始量喔', gen: genRulerFill }
    ] },
    { id: 5, name: '角、正方形和長方形', ic: '📐', stages: [
      { id: '5-1', mode: 'round', tut: 'quiz', ic: '⭕', label: '比大小快答', name: '哪個角比較大', desc: '邊畫得長，角不一定比較大', gen: genAngleQuick },
      { id: '5-2', mode: 'round', tut: 'sort', ic: '🗑️', label: '分類丟丟樂', name: '直角分類', desc: '直角、比直角大、比直角小', gen: genAngleSort }
    ] },
    { id: 'p1', name: '加油小站一', ic: '⛽', stages: [
      { id: 'p1', mode: 'run', name: '闖關：1～5 單元', desc: '數字讀寫、數線、公分毫米、量長度、角', gen: mix([genReadWriteB, genNumberLineB, genMmB, genRulerPickB, genAngleRun]) }
    ] },
    { id: 6, name: '除法', ic: '➗', stages: [
      { id: '6-1', mode: 'run', name: '做除法', desc: '商是多少？餘數一定比除數小', gen: genDivRunB },
      { id: '6-2', mode: 'mole', tut: 'mole-switch', label: '打地鼠', name: '奇數偶數打地鼠', desc: '只要看個位！規則會換喔', waves: oddEvenWaves },
      { id: '6-3', mode: 'round', tut: 'quiz', ic: '🧩', label: '選對答案', name: '剩下的怎麼辦？', desc: '要幾輛車？剩下的人也要坐', gen: genLeftover }
    ] },
    { id: 7, name: '公升和毫升', ic: '🥛', stages: [
      { id: '7-1', mode: 'run', name: '公升和毫升', desc: '1 公升 ＝ 1000 毫升，中間的 0 別漏掉', gen: genLiterB }
    ] },
    { id: 8, name: '分數', ic: '🍕', stages: [
      { id: '8-1', mode: 'round', tut: 'paint', ic: '🍕', label: '塗塗看', name: '分數塗色', desc: '分母是平分幾份，分子是塗幾份', gen: genPaint },
      { id: '8-2', mode: 'run', name: '看圖說分數', desc: '幾分之幾？幾個幾分之一？', gen: genFracRunB }
    ] },
    { id: 9, name: '圓', ic: '⭕', stages: [
      { id: '9-1', mode: 'run', name: '半徑和直徑', desc: '直徑 ＝ 半徑 × 2', gen: genCircleRunB },
      { id: '9-2', mode: 'round', tut: 'find', ic: '🔍', label: '找找看', name: '找出半徑、直徑', desc: '在圓上點出來', gen: genCircleFind }
    ] },
    { id: 'p2', name: '加油小站二', ic: '⛽', stages: [
      { id: 'p2', mode: 'run', name: '闖關：5～9 單元', desc: '角、除法、公升毫升、分數、圓', gen: mix([genAngleRun, genDivRunB, genLiterB, genFracRunB, genCircleRunB]) }
    ] }
  ];

  /* =====================================================
   * 打地鼠的規則：每一波一條規則，gen() 出一隻地鼠 { n, ok, why }
   * kind：prime 質數／even 偶數／odd 奇數／mul k 的倍數／fac k 的因數
   * ===================================================== */
  function isPrimeN(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  var PRIMES60 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  function moleRule(kind, k) {
    var r = { kind: kind, k: k };
    if (kind === 'prime') {
      var TRICKY = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57];
      r.ask = '是<b>質數</b>就打！1 和合數不要打'; r.say = '是質數就打！1 和合數不要打。'; r.banner = '打質數';
      r.ref = '<h3>60 以內的質數</h3><p class="m-list">' + PRIMES60.join('、') + '</p>';
      r.gen = function () {
        var x = Math.random(), n = x < .6 ? pick(PRIMES60) : x < .88 ? pick(TRICKY) : x < .94 ? 1 : 2 * R(2, 30), why;
        if (n === 1) why = '1 不是質數，也不是合數';
        else if (isPrimeN(n)) why = n + ' 是質數';
        else for (var i = 2; i * i <= n; i++) if (n % i === 0) { why = n + ' ＝ ' + i + ' × ' + (n / i) + '，是合數'; break; }
        return { n: n, ok: isPrimeN(n), why: why };
      };
    } else if (kind === 'even' || kind === 'odd') {
      var nm = kind === 'even' ? '偶數' : '奇數', other = kind === 'even' ? '奇數' : '偶數';
      r.ask = '是<b>' + nm + '</b>就打！' + other + '不要打'; r.say = '是' + nm + '就打！' + other + '不要打。只要看個位喔。'; r.banner = '打' + nm;
      r.ref = '<h3>只要看個位</h3><p class="m-list">個位是 0、2、4、6、8 → 偶數<br>個位是 1、3、5、7、9 → 奇數</p>';
      r.gen = function () {
        var want = Math.random() < .55, d = pick((kind === 'even') === want ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9]);
        var len = pick([2, 3, 3, 4, 4]), head = R(Math.pow(10, len - 2), Math.pow(10, len - 1) - 1), n = head * 10 + d;
        var ev = d % 2 === 0;
        return { n: n, ok: (kind === 'even') === ev, why: n + ' 的個位是 ' + d + '，是' + (ev ? '偶數' : '奇數') };
      };
    } else if (kind === 'mul') {
      r.ask = '是 <b>' + k + ' 的倍數</b>就打！'; r.say = '是' + k + '的倍數就打！'; r.banner = '打 ' + k + ' 的倍數';
      var ms = []; for (var m = k; m <= 99; m += k) ms.push(m);
      r.ref = '<h3>' + k + ' 的倍數</h3><p class="m-list">' + ms.join('、') + '</p>';
      r.gen = function () {
        var n;
        if (Math.random() < .55) n = k * R(2, Math.floor(99 / k));
        else do { n = Math.random() < .6 ? k * R(2, Math.floor(99 / k)) + pick([-2, -1, 1, 2]) : R(10, 99); } while (n % k === 0 || n < 2 || n > 99);
        var q = Math.floor(n / k), rem = n % k;
        return { n: n, ok: rem === 0, why: rem === 0 ? n + ' ＝ ' + k + ' × ' + q + '，是 ' + k + ' 的倍數' : n + ' ÷ ' + k + ' ＝ ' + q + ' … ' + rem + '，不是 ' + k + ' 的倍數' };
      };
    } else if (kind === 'fac') {
      var fs = [], non = [];
      for (var i = 1; i <= k; i++) (k % i === 0 ? fs : non).push(i);
      r.ask = '是 <b>' + k + ' 的因數</b>就打！'; r.say = '是' + k + '的因數就打！'; r.banner = '打 ' + k + ' 的因數';
      r.ref = '<h3>' + k + ' 的因數</h3><p class="m-list">' + fs.join('、') + '</p>';
      r.gen = function () {
        var n = Math.random() < .55 ? pick(fs) : pick(non), q = Math.floor(k / n), rem = k % n;
        return { n: n, ok: rem === 0, why: rem === 0 ? n + ' × ' + q + ' ＝ ' + k + '，' + n + ' 是 ' + k + ' 的因數' : k + ' ÷ ' + n + ' ＝ ' + q + ' … ' + rem + '，' + n + ' 不是 ' + k + ' 的因數' };
      };
    }
    return r;
  }
  /* 6-2 奇數偶數打地鼠：三波，偶數、奇數輪流 */
  function oddEvenWaves() { var a = Math.random() < .5 ? 'even' : 'odd', b = a === 'even' ? 'odd' : 'even'; return [moleRule(a), moleRule(b), moleRule(a)]; }

  root.MathQ = { moleRule: moleRule, PRIMES60: PRIMES60, UNITS: UNITS, zh: zh, chant: chant, literal: literal, vertical: vertical, len: len, dig: dig,
    _gen: { genReadWrite: genReadWrite, genNumberLine: genNumberLine, genFrog: genFrog, genPaint: genPaint, genCircleFind: genCircleFind, makeAdd: makeAdd, makeSub: makeSub, makeMul: makeMul } };
})(typeof window !== 'undefined' ? window : globalThis);
