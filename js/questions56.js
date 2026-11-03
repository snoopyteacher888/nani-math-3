/*
 * 五上、六上數學（翰林版）出題程式
 * 依「評量類題」整理：每個單元只練最常錯的重點。
 * 題目格式和 questions.js 一樣：
 *   跑酷（run）／快答（quiz）：text, say, answer, options, hint, explain
 *   分類（sort）：card, bins, answer
 *   自己填（fill）：fields: [{ label, ans }]，layout: 'frac' 時是上分子、下分母
 * 五、六年級預設不加注音，題目用數字為主。
 */
(function (root) {
  'use strict';

  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function opts(answer, wrongs, n) {
    n = n || 3; var out = [String(answer)];
    wrongs.forEach(function (w) { w = String(w); if (out.length < n && out.indexOf(w) < 0 && w !== '' && !/NaN|undefined|Infinity|^-/.test(w)) out.push(w); });
    return shuffle(out);
  }
  function frac(a, b) { return a + '/' + b; }
  function simp(a, b) { var g = gcd(a, b); return [a / g, b / g]; }
  function sfrac(a, b) { var s = simp(a, b); return s[1] === 1 ? String(s[0]) : frac(s[0], s[1]); }
  function svgOpen(w, h, label, cls) { return '<svg class="' + (cls || 'shapes') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">'; }
  /* 小數：用整數算再轉回來，避免 0.1＋0.2 這種誤差 */
  function dec(n, places) { return +(n / Math.pow(10, places)).toFixed(places); }
  function dstr(x) { return String(+x.toFixed(4)); }
  function fracFill(n, d) { return [{ label: '', ans: n }, { label: '', ans: d }]; }

  /* =====================================================
   * 五上
   * ===================================================== */
  /* 1 折線圖：看圖回答 */
  function genLineChart() {
    var unit = pick([5, 10, 20, 50, 100]), n = R(5, 6), months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var start = R(0, 6), labels = months.slice(start, start + n), base = unit * R(2, 4), vals = [], v = base + unit * R(2, 5);
    for (var i = 0; i < n; i++) { vals.push(v); v = Math.max(base + unit, Math.min(base + unit * 9, v + unit * pick([-3, -2, -1, 1, 2, 3, 4]))); }
    // 每一段的變化要不一樣大，「上升最多／下降最多」才只有一個答案
    var diffs = vals.slice(1).map(function (x, k) { return x - vals[k]; });
    var maxUp = Math.max.apply(null, diffs), maxDown = Math.min.apply(null, diffs);
    if (diffs.filter(function (d) { return d === maxUp; }).length > 1 || diffs.filter(function (d) { return d === maxDown; }).length > 1 || maxUp <= 0 || maxDown >= 0) return genLineChart();
    var W = 560, H = 300, x0 = 80, y0 = 250, gw = (W - x0 - 30) / (n - 1), rows = 10, gh = 210 / rows;
    var svg = svgOpen(W, H, '折線圖', 'shapes chart');
    for (var r = 0; r <= rows; r++) {
      var yy = y0 - r * gh;
      svg += '<line x1="' + x0 + '" y1="' + yy + '" x2="' + (W - 20) + '" y2="' + yy + '" stroke="#D8D2C4" stroke-width="1.5"/>';
      if (r % 2 === 0) svg += '<text x="' + (x0 - 8) + '" y="' + (yy + 8) + '" text-anchor="end" font-size="22" font-weight="700" fill="#2B2A28">' + (base + r * unit) + '</text>';
    }
    svg += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="30" stroke="#2B2A28" stroke-width="2.5"/><line x1="' + x0 + '" y1="' + y0 + '" x2="' + (W - 20) + '" y2="' + y0 + '" stroke="#2B2A28" stroke-width="2.5"/>';
    var pts = vals.map(function (val, k) { return [x0 + k * gw, y0 - (val - base) / unit * gh]; });
    svg += '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#2A63A8" stroke-width="4"/>';
    pts.forEach(function (p, k) { svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="#2A63A8"/><text x="' + p[0] + '" y="' + (y0 + 30) + '" text-anchor="middle" font-size="22" font-weight="700" fill="#2B2A28">' + labels[k] + '</text>'; });
    svg += '<text x="' + (x0 - 8) + '" y="22" text-anchor="end" font-size="14" fill="#6B6760">（人）</text></svg>';
    var t = R(0, 3), pair = function (k) { return labels[k] + '到' + labels[k + 1]; };
    var base0 = { visual: svg, wide: true, review: '折線圖：' + labels.map(function (l, k) { return l + ' ' + vals[k]; }).join('、') };
    if (t === 0) {
      var ku = diffs.indexOf(maxUp), w0 = shuffle(diffs.map(function (d, k) { return k; }).filter(function (k) { return k !== ku; })).slice(0, 2).map(pair);
      return Object.assign(base0, { text: '哪兩個相鄰的月分之間，上升最多？', say: '哪兩個相鄰的月分之間，上升最多？', answer: pair(ku), options: opts(pair(ku), w0),
        hint: '線往上爬得越陡，上升越多；也可以用後面的數減前面的數來比。', explain: '<p class="ex-line">' + pair(ku) + '：' + vals[ku] + ' → ' + vals[ku + 1] + '，上升 ' + maxUp + '，最多。</p>' });
    }
    if (t === 1) {
      var kd = diffs.indexOf(maxDown), w1 = shuffle(diffs.map(function (d, k) { return k; }).filter(function (k) { return k !== kd; })).slice(0, 2).map(pair);
      return Object.assign(base0, { text: '哪兩個相鄰的月分之間，下降最多？', say: '哪兩個相鄰的月分之間，下降最多？', answer: pair(kd), options: opts(pair(kd), w1),
        hint: '線往下掉得越陡，下降越多。', explain: '<p class="ex-line">' + pair(kd) + '：' + vals[kd] + ' → ' + vals[kd + 1] + '，下降 ' + (-maxDown) + '，最多。</p>' });
    }
    if (t === 2) return Object.assign(base0, { text: '縱軸每一格代表多少人？', say: '縱軸每一格代表多少人？', answer: String(unit), options: opts(unit, [unit * 2, unit / 5 >= 1 ? unit / 5 : unit + 5, 1, 10, unit * 10]),
      hint: '看縱軸上兩個寫數字的格線差多少，再看中間分成幾格。', explain: '<p class="ex-line">' + base + ' 到 ' + (base + 2 * unit) + ' 中間有 2 格，每格 <b>' + unit + '</b>。</p>' });
    var km = R(0, n - 1);
    return Object.assign(base0, { text: labels[km] + '是多少人？', say: labels[km] + '是多少人？', answer: String(vals[km]), options: opts(vals[km], [vals[km] + unit, vals[km] - unit, vals[km] + unit * 2]),
      hint: '從那個點往左看，對到縱軸的哪一格；每一格是 ' + unit + '。', explain: '<p class="ex-line">' + labels[km] + ' 的點對到 <b>' + vals[km] + '</b>。</p>' });
  }

  /* 2 倍數與因數 */
  function genMultipleSort() {
    var n = R(3, 15), yes = Math.random() < .5, m;
    if (yes) m = n * R(2, 12); else { do { m = R(n + 1, n * 12); } while (m % n === 0); }
    var ans = yes ? '是 ' + n + ' 的倍數' : '不是 ' + n + ' 的倍數';
    return { kind: 'sort', text: m + ' 是不是 ' + n + ' 的倍數？', say: m + '是不是' + n + '的倍數？', card: '<span class="card-num">' + m + '</span>',
      bins: ['是 ' + n + ' 的倍數', '不是 ' + n + ' 的倍數'], answer: ans, review: m + ' 和 ' + n,
      hint: '用除的：' + m + ' ÷ ' + n + ' 剛好除盡（沒有餘數），' + m + ' 就是 ' + n + ' 的倍數。',
      explain: '<p class="ex-line">' + m + ' ÷ ' + n + ' ＝ ' + Math.floor(m / n) + (m % n ? ' … ' + m % n + '，有餘數，<b>不是</b>倍數。' : '，剛好除盡，<b>是</b>倍數。') + '</p>' };
  }
  function genFactorOrMultiple() {
    var a = R(2, 12), b = R(2, 12), c = a * b;
    if (Math.random() < .55) {
      var asBig = Math.random() < .5, ans = asBig ? '倍數' : '因數';
      var text = asBig ? c + ' 是 ' + a + ' 的（　）' : a + ' 是 ' + c + ' 的（　）';
      return { kind: 'quiz', text: text, say: text.replace('（　）', '什麼') + '？', big: a + ' × ' + b + ' ＝ ' + c, answer: ans, options: ['因數', '倍數'],
        hint: '大的數是小的數的「倍數」；小的數能整除大的數，是大的數的「因數」。', review: text,
        explain: '<p class="ex-line">' + a + ' × ' + b + ' ＝ ' + c + '：' + c + ' 是 ' + a + ' 的倍數，' + a + ' 是 ' + c + ' 的因數。答案是 <b>' + ans + '</b>。</p>' };
    }
    var n = pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]), fs = [], nf = [];
    for (var i = 2; i < n; i++) (n % i ? nf : fs).push(i);
    var f = pick(fs), w = shuffle(nf.filter(function (x) { return x < n; })).slice(0, 2);
    return { kind: 'quiz', text: '下面哪一個是 ' + n + ' 的因數？', say: '下面哪一個是' + n + '的因數？', answer: String(f), options: shuffle([String(f)].concat(w.map(String))),
      hint: '因數要能把 ' + n + ' 整除（除完沒有餘數）。', review: n + ' 的因數',
      explain: '<p class="ex-line">' + n + ' ÷ ' + f + ' ＝ ' + n / f + '，剛好除盡，<b>' + f + '</b> 是 ' + n + ' 的因數。</p>' };
  }

  /* 3 平面圖形 */
  function polySVG(nSides, labels) {
    var cx = 160, cy = 120, r = 95, h = svgOpen(320, 240, nSides + ' 邊形'), pts = [];
    for (var i = 0; i < nSides; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / nSides + (nSides === 4 ? Math.PI / 4 : 0); pts.push([cx + Math.cos(a) * r * (nSides === 3 ? 1.15 : 1), cy + Math.sin(a) * r * (nSides === 3 ? .95 : .85) + (nSides === 3 ? 18 : 0)]); }
    h += '<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="#DCEBFA" stroke="#2A63A8" stroke-width="4" stroke-linejoin="round"/>';
    pts.forEach(function (p, i) {
      var dx = (cx - p[0]) * .32, dy = (cy + (nSides === 3 ? 18 : 0) - p[1]) * .32;
      h += '<text x="' + (p[0] + dx).toFixed(1) + '" y="' + (p[1] + dy + 7).toFixed(1) + '" text-anchor="middle" font-size="22" font-weight="700" fill="' + (labels[i] === '?' ? '#E0503A' : '#2B2A28') + '">' + labels[i] + (labels[i] === '?' ? '' : '°') + '</text>';
    });
    return h + '</svg>';
  }
  function genAngleSum() {
    var t = R(0, 2);
    if (t === 0) {
      var a = R(25, 100), b = R(20, 150 - a), c = 180 - a - b, lab = shuffle([String(a), String(b), '?']);
      return { kind: 'fill', text: '三角形的三個角，？是幾度？', say: '三角形的三個角，問號是幾度？', visual: polySVG(3, lab), fields: [{ label: '度', ans: c }], answer: c + ' 度',
        hint: '三角形的三個角加起來是 180 度。', explain: '<p class="ex-line">' + a + ' ＋ ' + b + ' ＝ ' + (a + b) + '，180 － ' + (a + b) + ' ＝ <b>' + c + '</b> 度</p>' };
    }
    if (t === 1) {
      var x = R(60, 110), y = R(60, 120), z = R(60, 130), w = 360 - x - y - z;
      if (w < 40 || w > 170) return genAngleSum();
      var lab4 = shuffle([String(x), String(y), String(z), '?']);
      return { kind: 'fill', text: '四邊形的四個角，？是幾度？', say: '四邊形的四個角，問號是幾度？', visual: polySVG(4, lab4), fields: [{ label: '度', ans: w }], answer: w + ' 度',
        hint: '四邊形的四個角加起來是 360 度。', explain: '<p class="ex-line">' + x + ' ＋ ' + y + ' ＋ ' + z + ' ＝ ' + (x + y + z) + '，360 － ' + (x + y + z) + ' ＝ <b>' + w + '</b> 度</p>' };
    }
    var top = pick([30, 40, 50, 60, 70, 80, 90, 100, 110, 120]), base = (180 - top) / 2;
    return { kind: 'fill', text: '等腰三角形的頂角是 ' + top + ' 度，一個底角是幾度？', say: '等腰三角形的頂角是' + top + '度，一個底角是幾度？', fields: [{ label: '度', ans: base }], answer: base + ' 度',
      hint: '等腰三角形的兩個底角一樣大；三個角合起來是 180 度。', explain: '<p class="ex-line">180 － ' + top + ' ＝ ' + (180 - top) + '，' + (180 - top) + ' ÷ 2 ＝ <b>' + base + '</b> 度</p>' };
  }
  function genTriangleSides() {
    if (Math.random() < .65) {
      var a = R(3, 15), b = R(3, 15), ok = Math.random() < .5, c;
      c = ok ? R(Math.abs(a - b) + 1, a + b - 1) : (Math.random() < .5 ? a + b + R(0, 4) : Math.max(1, Math.abs(a - b) - R(0, 2)));
      if (c < 1) return genTriangleSides();
      var can = a + b > c && a + c > b && b + c > a, ans = can ? '可以' : '不可以', s = shuffle([a, b, c]);
      return { kind: 'quiz', text: s.join(' 公分、') + ' 公分的三根吸管，可以圍成三角形嗎？', say: s.join('公分、') + '公分的三根吸管，可以圍成三角形嗎？', answer: ans, options: ['可以', '不可以'],
        hint: '兩條比較短的邊加起來，要比最長的邊還長，才能圍成三角形。', review: s.join('、') + ' 公分',
        explain: '<p class="ex-line">最長 ' + Math.max(a, b, c) + '，另外兩條加起來 ' + (a + b + c - Math.max(a, b, c)) + '，' + (can ? '比較長，<b>可以</b>。' : '沒有比較長，<b>不可以</b>。') + '</p>' };
    }
    var n = R(5, 8), nm = ['', '', '', '三', '四', '五', '六', '七', '八'][n], ask = pick(['個頂點', '條邊', '個角']);
    return { kind: 'quiz', text: nm + '邊形有幾' + ask + '？', say: nm + '邊形有幾' + ask + '？', answer: String(n), options: opts(n, [n + 1, n - 1, n * 2]),
      hint: '幾邊形就有幾條邊、幾個角、幾個頂點。', explain: '<p class="ex-line">' + nm + '邊形：' + n + ' 條邊、' + n + ' 個角、' + n + ' 個頂點。</p>' };
  }

  /* 4 公倍數與公因數 */
  function gcdPair(maxN) {
    var g = R(2, 15), a, b;
    do { a = g * R(2, 9); b = g * R(2, 9); } while (a === b || gcd(a, b) !== g || a > maxN || b > maxN);
    return [a, b];
  }
  function genGcdLcmFill(maxN, maxL) {
    return function () {
      var p = gcdPair(maxN || 100), a = p[0], b = p[1], askG = Math.random() < .5, ans = askG ? gcd(a, b) : lcm(a, b);
      if (!askG && ans > (maxL || 300)) return genGcdLcmFill(maxN, maxL)();
      var name = askG ? '最大公因數' : '最小公倍數';
      return { kind: 'fill', text: a + ' 和 ' + b + ' 的' + name + '是多少？', say: a + '和' + b + '的' + name + '是多少？', fields: [{ label: '', ans: ans }], answer: String(ans),
        hint: askG ? '兩個數都能被它整除的數裡面，最大的那一個。可以用短除法：一直用兩個數都能除的數去除。' : '兩個數的倍數裡，第一個一樣的數。短除法：除數全部乘起來，再乘最後剩下的兩個數。',
        explain: '<p class="ex-line">' + a + ' 和 ' + b + '：最大公因數是 ' + gcd(a, b) + '，最小公倍數是 ' + lcm(a, b) + '。</p><p class="ex-line">答案是 <b>' + ans + '</b>。</p>' };
    };
  }
  var GL_STORY = [
    ['G', '長 {a} 公分、寬 {b} 公分的長方形紙，要剪成一樣大的正方形，剛好剪完，正方形邊長最長是幾公分？'],
    ['G', '{a} 顆糖果和 {b} 塊餅乾，平分給一些小朋友都剛好分完，最多可以分給幾個人？'],
    ['G', '{a} 枝紅筆和 {b} 枝藍筆，每袋放一樣多枝、只放一種顏色，每袋最多放幾枝？'],
    ['L', '用長 {a} 公分、寬 {b} 公分的長方形卡片，拼成一個正方形，正方形邊長最短是幾公分？'],
    ['L', '甲公車每 {a} 分鐘一班，乙公車每 {b} 分鐘一班，兩車同時開出後，最少再過幾分鐘會再同時開出？'],
    ['L', '一盒蘋果，每 {a} 顆一數或每 {b} 顆一數都剛好數完，這盒蘋果最少有幾顆？']
  ];
  function genGcdLcmWhich() {
    var s = pick(GL_STORY), p = gcdPair(60), text = s[1].replace('{a}', p[0]).replace('{b}', p[1]);
    var ans = s[0] === 'G' ? '最大公因數' : '最小公倍數', val = s[0] === 'G' ? gcd(p[0], p[1]) : lcm(p[0], p[1]);
    return { kind: 'quiz', text: text + '（要用哪一個算？）', say: text + '要用哪一個算？', answer: ans, options: ['最大公因數', '最小公倍數'], review: text,
      hint: s[0] === 'G' ? '把東西「切開、平分」，答案會比原本的數小，用最大公因數。' : '把東西「拼起來、等到一起」，答案會比原本的數大，用最小公倍數。',
      explain: '<p class="ex-line">' + (s[0] === 'G' ? '切開、平分 → 最大公因數' : '拼起來、等到同時 → 最小公倍數') + '</p><p class="ex-line">' + p[0] + ' 和 ' + p[1] + ' 的' + ans + '是 <b>' + val + '</b>。</p>' };
  }

  /* 5 立體形體 */
  var NUMS = ['', '', '', '三', '四', '五', '六', '七', '八'];
  function genSolidCount() {
    var n = R(3, 8), prism = Math.random() < .55, name = NUMS[n] + (prism ? '角柱' : '角錐'), ask = pick(['個面', '條邊', '個頂點']);
    var v = prism ? { '個面': n + 2, '條邊': 3 * n, '個頂點': 2 * n } : { '個面': n + 1, '條邊': 2 * n, '個頂點': n + 1 };
    var ans = v[ask], w = prism ? [n + 1, 2 * n, 3 * n, n + 2, 2 * n + 2] : [n + 2, 2 * n, n, 3 * n, n + 1];
    return { kind: 'quiz', text: name + '有幾' + ask + '？', say: name + '有幾' + ask + '？', answer: String(ans), options: opts(ans, w),
      hint: prism ? n + ' 角柱：上下 2 個底面＋' + n + ' 個側面；每個底面 ' + n + ' 條邊，加上 ' + n + ' 條側邊。' : n + ' 角錐：1 個底面＋' + n + ' 個側面；底面 ' + n + ' 條邊，加上連到頂點的 ' + n + ' 條邊。',
      explain: '<p class="ex-line">' + name + '：' + (prism ? (n + 2) + ' 個面、' + 3 * n + ' 條邊、' + 2 * n + ' 個頂點' : (n + 1) + ' 個面、' + 2 * n + ' 條邊、' + (n + 1) + ' 個頂點') + '。</p>' };
  }
  function solidSVG(kind) {
    var s = '<svg viewBox="0 0 200 200" width="170" height="170" aria-hidden="true"><g fill="#DCEBFA" stroke="#2A63A8" stroke-width="4" stroke-linejoin="round">', d = '<g fill="none" stroke="#2A63A8" stroke-width="3" stroke-dasharray="6 5">';
    if (kind === 'cube') { s += '<path d="M40 70 L120 70 L120 160 L40 160 Z"/><path d="M40 70 L80 35 L160 35 L120 70 Z" fill="#EEF3FA"/><path d="M120 70 L160 35 L160 125 L120 160 Z" fill="#C9DDF3"/>'; d += '<path d="M40 160 L80 125 L160 125 M80 125 L80 35"/>'; }
    else if (kind === 'tri') { s += '<path d="M30 150 L110 150 L70 85 Z"/><path d="M110 150 L170 115 L130 50 L70 85 Z" fill="#C9DDF3"/><path d="M70 85 L130 50" fill="none"/>'; d += '<path d="M30 150 L90 115 L170 115 M90 115 L130 50"/>'; }
    else if (kind === 'cyl') { s += '<path d="M50 50 L50 150 A50 18 0 0 0 150 150 L150 50" fill="#C9DDF3"/><ellipse cx="100" cy="50" rx="50" ry="18" fill="#EEF3FA"/>'; d += '<path d="M50 150 A50 18 0 0 1 150 150"/>'; }
    else if (kind === 'cone') { s += '<path d="M100 25 L45 150 A55 18 0 0 0 155 150 Z" fill="#C9DDF3"/>'; d += '<path d="M45 150 A55 18 0 0 1 155 150"/>'; }
    else if (kind === 'pyr') { s += '<path d="M100 25 L35 150 L125 165 Z"/><path d="M100 25 L125 165 L170 135 Z" fill="#C9DDF3"/>'; d += '<path d="M35 150 L80 120 L170 135 M80 120 L100 25"/>'; }
    else if (kind === 'tpyr') { s += '<path d="M100 25 L40 155 L150 160 Z"/><path d="M100 25 L150 160 L170 120 Z" fill="#C9DDF3"/>'; d += '<path d="M40 155 L170 120"/>'; }
    else { s += '<circle cx="100" cy="100" r="70" fill="#C9DDF3"/>'; d += '<ellipse cx="100" cy="100" rx="70" ry="22"/>'; }
    return s + '</g>' + d + '</g></svg>';
  }
  var SOLIDS = [['cube', '柱體', '長方體（四角柱）'], ['tri', '柱體', '三角柱'], ['cyl', '柱體', '圓柱'], ['cone', '錐體', '圓錐'], ['pyr', '錐體', '四角錐'], ['tpyr', '錐體', '三角錐'], ['ball', '球體', '球']];
  function genSolidSort() {
    var s = pick(SOLIDS);
    return { kind: 'sort', text: '這個形體是哪一種？', say: '這個形體是柱體、錐體，還是球體？', card: solidSVG(s[0]), bins: ['柱體', '錐體', '球體'], answer: s[1], review: s[2],
      hint: '柱體：上下兩個一樣大、互相平行的底面。錐體：一個底面，上面尖尖的一個頂點。', explain: '<p class="ex-line">這是<b>' + s[2] + '</b>，屬於' + s[1] + '。</p>' };
  }

  /* 6 整數四則運算 */
  function genOrderOps() {
    var t = R(0, 3), a, b, c, d, expr, ans, steps, wrong;
    if (t === 0) { b = R(2, 20); c = R(2, 9); a = R(b * c + 1, b * c + 80); d = R(1, 30); ans = a - b * c + d; expr = a + ' － ' + b + ' × ' + c + ' ＋ ' + d; steps = b + ' × ' + c + ' ＝ ' + b * c + '，' + a + ' － ' + b * c + ' ＋ ' + d + ' ＝ ' + ans; }
    else if (t === 1) { c = R(2, 9); b = c * R(1, 3); a = R(2, 20); var q = a * b; d = R(1, 50); ans = q / c + d; expr = a + ' × ' + b + ' ÷ ' + c + ' ＋ ' + d; steps = a + ' × ' + b + ' ＝ ' + q + '，' + q + ' ÷ ' + c + ' ＝ ' + q / c + '，再 ＋ ' + d + ' ＝ ' + ans; }
    else if (t === 2) { b = R(2, 9); a = b * R(2, 40); c = R(2, 30); d = R(2, 9); ans = a / b + c * d; expr = a + ' ÷ ' + b + ' ＋ ' + c + ' × ' + d; steps = a + ' ÷ ' + b + ' ＝ ' + a / b + '，' + c + ' × ' + d + ' ＝ ' + c * d + '，' + a / b + ' ＋ ' + c * d + ' ＝ ' + ans; }
    else { d = R(2, 9); var inner = d * R(2, 12); c = R(5, 60); b = c + inner; a = R(inner / d + 1, inner / d + 90); ans = a - inner / d; expr = a + ' － （' + b + ' － ' + c + '）÷ ' + d; steps = b + ' － ' + c + ' ＝ ' + inner + '，' + inner + ' ÷ ' + d + ' ＝ ' + inner / d + '，' + a + ' － ' + inner / d + ' ＝ ' + ans; }
    return { kind: 'fill', text: expr + ' ＝ ？', say: expr.replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/－/g, '減').replace(/＋/g, '加'), fields: [{ label: '', ans: ans }], answer: String(ans),
      hint: '先算括號，再算乘、除，最後才算加、減。', review: expr, explain: '<p class="ex-line">' + steps + '</p>' };
  }
  /* 7 擴分、約分與加減 */
  function genFracCompare() {
    var b = R(3, 12), d = R(3, 12), a = R(1, b - 1), c = R(1, d - 1);
    if (b === d || Math.random() < .15) { var k = R(2, 3); c = a * k; d = b * k; if (d > 15) return genFracCompare(); }
    var l = a * d - c * b, ans = l > 0 ? frac(a, b) : l < 0 ? frac(c, d) : '一樣大', L = lcm(b, d);
    return { kind: 'quiz', text: frac(a, b) + ' 和 ' + frac(c, d) + '，哪一個比較大？', say: b + '分之' + a + '，和' + d + '分之' + c + '，哪一個比較大？', answer: ans, options: [frac(a, b), '一樣大', frac(c, d)],
      hint: '分母不一樣，先通分（變成一樣的分母）再比分子。', review: frac(a, b) + ' 和 ' + frac(c, d),
      explain: '<p class="ex-line">通分成分母 ' + L + '：' + frac(a, b) + ' ＝ ' + frac(a * L / b, L) + '，' + frac(c, d) + ' ＝ ' + frac(c * L / d, L) + '，答案是 <b>' + ans + '</b>。</p>' };
  }
  function genFracAddFill() {
    var b = R(2, 10), d = R(2, 10); if (b === d) return genFracAddFill();
    var a = R(1, b - 1), c = R(1, d - 1), add = Math.random() < .55, L = lcm(b, d), n = add ? a * L / b + c * L / d : a * L / b - c * L / d;
    if (n <= 0 || n >= L) return genFracAddFill(); // 答案在 0 和 1 之間
    var s = simp(n, L), op = add ? '＋' : '－';
    return { kind: 'fill', layout: 'frac', text: frac(a, b) + ' ' + op + ' ' + frac(c, d) + ' ＝ ？（約成最簡分數）', say: b + '分之' + a + (add ? '加' : '減') + d + '分之' + c + '，等於多少？',
      fields: fracFill(s[0], s[1]), answer: frac(s[0], s[1]), review: frac(a, b) + ' ' + op + ' ' + frac(c, d),
      hint: '先通分成一樣的分母，再把分子' + (add ? '相加' : '相減') + '；最後記得約分。',
      explain: '<p class="ex-line">' + frac(a * L / b, L) + ' ' + op + ' ' + frac(c * L / d, L) + ' ＝ ' + frac(n, L) + (gcd(n, L) > 1 ? ' ＝ ' + frac(s[0], s[1]) : '') + '</p>' };
  }

  /* 8 面積（圖上多標一條斜邊，故意當陷阱） */
  function genArea() {
    var t = pick(['para', 'tri', 'trap']), h = R(3, 12), base = R(4, 16), side = h + R(1, 4), top = R(2, base - 1), area, svg, text;
    if (t === 'tri' && (base * h) % 2) base++;
    if (t === 'trap' && ((top + base) * h) % 2) top = top > 2 ? top - 1 : top + 1;
    var W = 360, H = 220, x0 = 50, y0 = 180, sc = Math.min(22, 260 / (base + 4)), hh = Math.min(140, h * 13), off = 50;
    svg = svgOpen(W, H, '圖形');
    if (t === 'para') {
      svg += '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + base * sc) + ' ' + y0 + ' L' + (x0 + base * sc + off) + ' ' + (y0 - hh) + ' L' + (x0 + off) + ' ' + (y0 - hh) + ' Z" fill="#DCEBFA" stroke="#2A63A8" stroke-width="4"/>';
      area = base * h; text = '平行四邊形';
    } else if (t === 'tri') {
      svg += '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + base * sc) + ' ' + y0 + ' L' + (x0 + off) + ' ' + (y0 - hh) + ' Z" fill="#DCEBFA" stroke="#2A63A8" stroke-width="4"/>';
      area = base * h / 2; text = '三角形';
    } else {
      svg += '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + base * sc) + ' ' + y0 + ' L' + (x0 + off + top * sc) + ' ' + (y0 - hh) + ' L' + (x0 + off) + ' ' + (y0 - hh) + ' Z" fill="#DCEBFA" stroke="#2A63A8" stroke-width="4"/>';
      svg += '<text x="' + (x0 + off + top * sc / 2) + '" y="' + (y0 - hh - 10) + '" text-anchor="middle" font-size="18" font-weight="700">' + top + ' 公分</text>';
      area = (top + base) * h / 2; text = '梯形';
    }
    svg += '<line x1="' + (x0 + off) + '" y1="' + (y0 - hh) + '" x2="' + (x0 + off) + '" y2="' + y0 + '" stroke="#E0503A" stroke-width="3" stroke-dasharray="7 5"/><path d="M' + (x0 + off) + ' ' + (y0 - 12) + ' h12 v12" fill="none" stroke="#E0503A" stroke-width="2"/>';
    svg += '<text x="' + (x0 + off + 8) + '" y="' + (y0 - hh / 2) + '" font-size="18" font-weight="700" fill="#E0503A">' + h + ' 公分</text>';
    svg += '<text x="' + (x0 + base * sc / 2) + '" y="' + (y0 + 26) + '" text-anchor="middle" font-size="18" font-weight="700">' + base + ' 公分</text>';
    svg += '<text x="' + (x0 + off / 2 - 8) + '" y="' + (y0 - hh / 2) + '" text-anchor="end" font-size="16" fill="#6B6760">' + side + ' 公分</text></svg>';
    var how = t === 'para' ? '底 × 高 ＝ ' + base + ' × ' + h : t === 'tri' ? '底 × 高 ÷ 2 ＝ ' + base + ' × ' + h + ' ÷ 2' : '（上底 ＋ 下底）× 高 ÷ 2 ＝（' + top + ' ＋ ' + base + '）× ' + h + ' ÷ 2';
    return { kind: 'fill', text: '這個' + text + '的面積是幾平方公分？', say: '這個' + text + '的面積是幾平方公分？', visual: svg, fields: [{ label: '平方公分', ans: area }], answer: area + ' 平方公分',
      hint: '高是和底垂直的那條紅色虛線，不是斜斜的邊（' + side + ' 公分）！', review: text + '：底 ' + base + '、高 ' + h + (t === 'trap' ? '、上底 ' + top : ''),
      explain: '<p class="ex-line">' + how + ' ＝ <b>' + area + '</b> 平方公分</p><p class="ex-line">斜邊 ' + side + ' 公分不是高，用不到。</p>' };
  }

  /* 9 乘以幾分之一、整數相除 */
  function genFracOf() {
    var t = R(0, 3);
    if (t === 3) { // 進階：整數 × 幾分之一，答案要約分
      var whole = pick([6, 8, 9, 10, 12, 15]), nn = pick([4, 6, 8, 9, 12, 15, 16]), unit = pick([['公升', '桶紅茶'], ['公尺', '根竹子'], ['公斤', '袋米']]);
      if (whole % nn === 0) return genFracOf();
      var ans = sfrac(whole, nn);
      return { text: '1 ' + unit[1] + '有 ' + whole + ' ' + unit[0] + '，用了 ' + frac(1, nn) + ' ' + unit[1].slice(0, 1) + '，是幾' + unit[0] + '？（約成最簡分數）', say: '1' + unit[1] + '有' + whole + unit[0] + '，用了' + nn + '分之1' + unit[1].slice(0, 1) + '，是幾' + unit[0] + '？',
        answer: ans, options: opts(ans, [frac(nn, whole), sfrac(whole + 1, nn), frac(1, whole * nn), String(whole - nn > 0 ? whole - nn : nn - whole)]), review: whole + ' × ' + frac(1, nn),
        hint: whole + ' × ' + frac(1, nn) + ' ＝ ' + frac(whole, nn) + '，再約分。', explain: '<p class="ex-line">' + whole + ' × ' + frac(1, nn) + ' ＝ ' + frac(whole, nn) + (ans !== frac(whole, nn) ? ' ＝ <b>' + ans + '</b>' : '') + ' ' + unit[0] + '</p>' };
    }
    if (t === 0) { var a = R(1, 15), b = R(2, 15); if (a === b) b++; return { text: a + ' ÷ ' + b + ' 用分數表示是多少？', say: a + '除以' + b + '，用分數表示是多少？', answer: frac(a, b), options: opts(frac(a, b), [frac(b, a), frac(1, b), frac(a, a + b)]),
      hint: '被除數當分子，除數當分母：a ÷ b ＝ a/b。', explain: '<p class="ex-line">' + a + ' ÷ ' + b + ' ＝ <b>' + frac(a, b) + '</b></p>' }; }
    if (t === 1) { var n = pick([2, 3, 4, 5, 6, 8]), per = n * R(2, 6), item = pick(['個鳳梨酥', '顆水餃', '個餅乾']);
      return { text: '1 盒有 ' + per + ' ' + item + '，' + frac(1, n) + ' 盒是幾' + item.slice(0, 1) + '？', say: '1盒有' + per + item + '，' + n + '分之1盒，是幾' + item.slice(0, 1) + '？', answer: String(per / n), options: opts(per / n, [per * n, per - n, per / n + 1]),
        hint: frac(1, n) + ' 盒就是把 1 盒平分成 ' + n + ' 份，拿 1 份：' + per + ' × ' + frac(1, n) + ' ＝ ' + per + ' ÷ ' + n + '。', explain: '<p class="ex-line">' + per + ' × ' + frac(1, n) + ' ＝ ' + per + ' ÷ ' + n + ' ＝ <b>' + per / n + '</b></p>' }; }
    var m = R(2, 9), total = m * R(2, 6);
    return { text: total + ' 個平分給 ' + m + ' 個人，可以用 ' + total + ' × ' + frac(1, m) + ' 來算嗎？', say: total + '個平分給' + m + '個人，可以用' + total + '乘以' + m + '分之1來算嗎？', answer: '可以', options: ['可以', '不可以'],
      hint: '平分給 ' + m + ' 人＝除以 ' + m + '＝乘以 ' + frac(1, m) + '。', explain: '<p class="ex-line">' + total + ' ÷ ' + m + ' ＝ ' + total + ' × ' + frac(1, m) + ' ＝ ' + total / m + '，<b>可以</b>。</p>' };
  }

  /* 10 扇形 */
  function genSector() {
    var t = R(0, 2), n = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    if (t === 0) return { text: frac(1, n) + ' 圓的圓心角是幾度？', say: n + '分之1圓的圓心角是幾度？', answer: String(360 / n), options: opts(360 / n, [180 / n, 360 - 360 / n, 100 / n === Math.floor(100 / n) ? 100 / n : 360 / n + 10]),
      hint: '一整個圓的圓心角是 360 度。', explain: '<p class="ex-line">360 × ' + frac(1, n) + ' ＝ <b>' + 360 / n + '</b> 度</p>' };
    if (t === 1) { var k = R(1, n - 1), deg = 360 / n * k, s = sfrac(k, n);
      return { text: '圓心角 ' + deg + ' 度的扇形是幾分之幾圓？', say: '圓心角' + deg + '度的扇形，是幾分之幾圓？', answer: s, options: opts(s, [sfrac(deg, 180), sfrac(n - k, n), sfrac(k + 1, n), frac(k, n * 2)]),
        hint: '用圓心角 ÷ 360，再約分。', explain: '<p class="ex-line">' + frac(deg, 360) + ' ＝ <b>' + s + '</b> 圓</p>' }; }
    var g = R(2, 17) * 10;
    return { text: '一個圓被畫成兩個扇形，小扇形的圓心角是 ' + g + ' 度，大扇形的圓心角是幾度？', say: '一個圓被畫成兩個扇形，小扇形的圓心角是' + g + '度，大扇形的圓心角是幾度？', answer: String(360 - g), options: opts(360 - g, [180 - g, g + 180, 360 + g]),
      hint: '兩個扇形合起來是一整個圓，360 度。', explain: '<p class="ex-line">360 － ' + g + ' ＝ <b>' + (360 - g) + '</b> 度</p>' };
  }

  /* =====================================================
   * 六上
   * ===================================================== */
  function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  function genPrimeSort() {
    var n = pick([1, 2, 2, 9, 15, 21, 27, 33, 39, 49, 51, 57, 91, R(3, 60), R(3, 60), R(3, 60)]);
    var ans = n === 1 ? '都不是' : isPrime(n) ? '質數' : '合數', fs = [];
    for (var i = 1; i <= n; i++) if (n % i === 0) fs.push(i);
    return { kind: 'sort', text: n + ' 是質數還是合數？', say: n + '是質數還是合數？', card: '<span class="card-num">' + n + '</span>', bins: ['質數', '合數', '都不是'], answer: ans, review: String(n),
      hint: '質數：因數只有 1 和自己（2 是質數！）。合數：還有別的因數。1 不是質數也不是合數。',
      explain: '<p class="ex-line">' + n + ' 的因數：' + fs.join('、') + '，是<b>' + ans + '</b>。</p>' };
  }
  /* 質數打地鼠：大多是質數；合數挑容易看錯的奇數 */
  var PRIMES60 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  var TRICKY = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57];
  function factorWhy(n) {
    if (n === 1) return '1 不是質數，也不是合數';
    for (var i = 2; i * i <= n; i++) if (n % i === 0) return n + ' ＝ ' + i + ' × ' + (n / i) + '，是合數';
    return n + ' 是質數';
  }
  function genMole() {
    var r = Math.random(), n;
    if (r < .6) n = pick(PRIMES60);
    else if (r < .88) n = pick(TRICKY);
    else if (r < .94) n = 1;
    else n = 2 * R(2, 30);
    return { n: n, prime: isPrime(n), why: factorWhy(n) };
  }
  function genCoprimeWhich() {
    if (Math.random() < .5) return genGcdLcmWhich();
    var a = R(2, 30), b = R(2, 30); if (a === b) b++;
    var ans = gcd(a, b) === 1 ? '互質' : '不互質';
    return { kind: 'quiz', text: a + ' 和 ' + b + ' 互質嗎？', say: a + '和' + b + '互質嗎？', answer: ans, options: ['互質', '不互質'], review: a + ' 和 ' + b,
      hint: '兩個數的公因數只有 1，就是互質。', explain: '<p class="ex-line">' + a + ' 和 ' + b + ' 的最大公因數是 ' + gcd(a, b) + '，<b>' + ans + '</b>。</p>' };
  }
  /* 2 分數除法 */
  function genFracDivCompare() {
    var b = R(2, 9), a = R(1, 3 * b), d = R(2, 9), kind = pick(['lt', 'gt', 'eq', 'lt', 'gt']), c = kind === 'lt' ? R(1, d - 1) : kind === 'gt' ? R(d + 1, 3 * d) : d;
    var sign = kind === 'lt' ? '＞' : kind === 'gt' ? '＜' : '＝';
    return { kind: 'quiz', text: frac(a, b) + ' ÷ ' + frac(c, d) + ' ○ ' + frac(a, b) + '，○ 要填什麼？', say: b + '分之' + a + '除以' + d + '分之' + c + '，和' + b + '分之' + a + '比，圈圈要填什麼？',
      answer: sign, options: ['＞', '＝', '＜'], review: frac(a, b) + ' ÷ ' + frac(c, d) + ' 和 ' + frac(a, b),
      hint: '除以比 1 小的數，商會變大；除以比 1 大的數，商會變小；除以 1，商不變。',
      explain: '<p class="ex-line">除數 ' + frac(c, d) + (kind === 'lt' ? ' 比 1 小，商變大 → ＞' : kind === 'gt' ? ' 比 1 大，商變小 → ＜' : ' ＝ 1，商不變 → ＝') + '，答案是 <b>' + sign + '</b>。</p>' };
  }
  function genFracDivFill() {
    var b = R(2, 9), a = R(1, 2 * b), d = R(2, 9), c = R(1, d);
    if (c === d) c = d - 1 || 1;
    var n = a * d, m = b * c, s = simp(n, m);
    if (s[1] === 1 || s[0] > 60) return genFracDivFill();
    return { kind: 'fill', layout: 'frac', text: frac(a, b) + ' ÷ ' + frac(c, d) + ' ＝ ？（最簡分數，可以是假分數）', say: b + '分之' + a + '除以' + d + '分之' + c + '，等於多少？',
      fields: fracFill(s[0], s[1]), answer: frac(s[0], s[1]), review: frac(a, b) + ' ÷ ' + frac(c, d),
      hint: '除以一個分數，等於乘以它的倒數（分子分母顛倒）。最後記得約分。',
      explain: '<p class="ex-line">' + frac(a, b) + ' × ' + frac(d, c) + ' ＝ ' + frac(n, m) + (gcd(n, m) > 1 ? ' ＝ ' + frac(s[0], s[1]) : '') + '</p>' };
  }
  /* 3 小數除法 */
  function genDecCompare() {
    var a = dec(R(12, 199), 1), t = R(0, 1);
    if (t === 0) { var dv = dec(pick([R(2, 9), R(11, 25), 10]), 1), sign = dv < 1 ? '＞' : dv > 1 ? '＜' : '＝';
      return { kind: 'quiz', text: a + ' ÷ ' + dv + ' ○ ' + a + '，○ 要填什麼？', say: a + '除以' + dv + '，和' + a + '比，圈圈要填什麼？', answer: sign, options: ['＞', '＝', '＜'], review: a + ' ÷ ' + dv + ' 和 ' + a,
        hint: '除以比 1 小的數，商變大；除以比 1 大的數，商變小。', explain: '<p class="ex-line">除數 ' + dv + (dv < 1 ? ' 比 1 小 → 商比較大' : dv > 1 ? ' 比 1 大 → 商比較小' : ' 是 1 → 一樣') + '，答案是 <b>' + sign + '</b>。</p>' }; }
    var d1 = dec(R(2, 19), 1), d2 = dec(R(2, 19), 1); if (d1 === d2) d2 = dec(d2 * 10 + 1, 1);
    var s2 = d1 < d2 ? '＞' : '＜';
    return { kind: 'quiz', text: a + ' ÷ ' + d1 + ' ○ ' + a + ' ÷ ' + d2 + '，○ 要填什麼？', say: a + '除以' + d1 + '，和' + a + '除以' + d2 + '比，圈圈要填什麼？', answer: s2, options: ['＞', '＝', '＜'], review: a + ' ÷ ' + d1 + ' 和 ' + a + ' ÷ ' + d2,
      hint: '被除數一樣，除數越小，商越大。', explain: '<p class="ex-line">' + d1 + (d1 < d2 ? ' 比 ' : ' 比 ') + d2 + (d1 < d2 ? ' 小，商比較大' : ' 大，商比較小') + '，答案是 <b>' + s2 + '</b>。</p>' };
  }
  function genDecDivRun() {
    if (Math.random() < .3) { // 概數
      var a = pick([4.7, 8, 7.4, 9.8, 6.5, 5.2]), b = pick([0.3, 1.3, 0.7, 1.7, 2.2]), q = a / b, ans = q.toFixed(1);
      if (Math.abs(q * 10 - Math.round(q * 10)) < 1e-9) return genDecDivRun();
      return { text: a + ' ÷ ' + b + '，用四捨五入取到小數點後第一位是多少？', say: a + '除以' + b + '，用四捨五入取到小數點後第一位，是多少？', answer: ans, options: opts(ans, [(Math.floor(q * 10) / 10).toFixed(1) === ans ? (Math.floor(q * 10) / 10 + .1).toFixed(1) : (Math.floor(q * 10) / 10).toFixed(1), (q / 10).toFixed(1), Math.round(q).toFixed(0)]),
        hint: '要取到第一位，商要先算到第二位，再看第二位四捨五入。', explain: '<p class="ex-line">' + a + ' ÷ ' + b + ' ＝ ' + q.toFixed(3) + '…，取到第一位是 <b>' + ans + '</b>。</p>' };
    }
    var qv = dec(R(11, 99), pick([0, 1])), dv = pick([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5, 0.25, 0.75, 1.25]), aa = +(qv * dv).toFixed(4);
    var ansS = dstr(qv);
    return { text: dstr(aa) + ' ÷ ' + dv + ' ＝ ？', say: dstr(aa) + '除以' + dv + '，等於多少？', answer: ansS, options: opts(ansS, [dstr(qv * 10), dstr(qv / 10), dstr(qv * 100)]),
      hint: '除數變成整數：被除數和除數的小數點一起往右移一樣多位。', explain: '<p class="ex-line">' + dstr(aa) + ' ÷ ' + dv + ' ＝ <b>' + ansS + '</b>（驗算：' + ansS + ' × ' + dv + ' ＝ ' + dstr(aa) + '）</p>' };
  }
  /* 4 比與比值 */
  function genRatio() { // 跑酷：最簡整數比、比值（只出有選項的題目）
    var t = R(0, 1);
    if (t === 0) { var g = R(2, 12), x = R(1, 12), y = R(1, 12); if (gcd(x, y) !== 1 || x === y) return genRatio(); var useDec = Math.random() < .3;
      var A = useDec ? dec(x * g, 1) : x * g, B = useDec ? dec(y * g, 1) : y * g, ans = x + '：' + y;
      return { text: A + '：' + B + ' 的最簡整數比是多少？', say: A + '比' + B + '的最簡整數比是多少？', answer: ans, options: opts(ans, [y + '：' + x, (x * 2) + '：' + (y * 2), A + '：' + B]),
        hint: (useDec ? '先乘以 10 變成整數，' : '') + '前項和後項同時除以最大公因數。', explain: '<p class="ex-line">' + A + '：' + B + ' ＝ <b>' + ans + '</b></p>' }; }
    if (t === 1) { var p = R(1, 9), q = R(2, 12), m = R(2, 9); if (p === q) q++; var s = sfrac(p, q);
      return { text: (p * m) + '：' + (q * m) + ' 的比值是多少？', say: (p * m) + '比' + (q * m) + '的比值是多少？', answer: s, options: opts(s, [sfrac(q, p), frac(p * m, q), String(p * m - q * m < 0 ? q * m - p * m : p * m - q * m)]),
        hint: '比值＝前項 ÷ 後項，再約分。', explain: '<p class="ex-line">' + (p * m) + ' ÷ ' + (q * m) + ' ＝ <b>' + s + '</b></p>' }; }
    return genRatioFill();
  }
  function genRatioFill() { // 自己填：相等的比
    var a2 = R(2, 15), b2 = R(2, 15), k = R(2, 9); if (a2 === b2) b2++;
    var wantFirst = Math.random() < .5, ansN = wantFirst ? a2 * k : b2 * k;
    var text = wantFirst ? a2 + '：' + b2 + ' ＝ ？：' + (b2 * k) : a2 + '：' + b2 + ' ＝ ' + (a2 * k) + '：？';
    return { kind: 'fill', text: text, say: text.replace(/：/g, '比').replace('？', '多少'), fields: [{ label: '', ans: ansN }], answer: String(ansN), review: text,
      hint: '相等的比：前項和後項乘以同一個數。先看另一項乘了幾倍。', explain: '<p class="ex-line">' + (wantFirst ? b2 + ' × ' + k + ' ＝ ' + b2 * k + '，所以 ' + a2 + ' × ' + k : a2 + ' × ' + k + ' ＝ ' + a2 * k + '，所以 ' + b2 + ' × ' + k) + ' ＝ <b>' + ansN + '</b></p>' };
  }
  /* 5 兩量關係 */
  function genTwoQty() {
    var t = R(0, 2);
    if (t === 0) { var zhe = pick([9, 8, 75, 7, 6, 5]), pct = zhe > 10 ? zhe : zhe * 10, r = pct / 100, orig = pick([200, 400, 600, 800, 1000, 1200, 1600]), sale = orig * pct / 100, name = (zhe > 10 ? '七五' : ['', '', '', '', '', '五', '六', '七', '八', '九'][zhe]) + '折';
      if (Math.random() < .5) return { text: '原價 ' + orig + ' 元的衣服打' + name + '，要付多少元？', say: '原價' + orig + '元的衣服打' + name + '，要付多少元？', answer: String(sale), options: opts(sale, [orig - sale, orig * pct / 10, orig - pct]),
        hint: '打' + name + '＝原價 × ' + r + '。', explain: '<p class="ex-line">' + orig + ' × ' + r + ' ＝ <b>' + sale + '</b> 元</p>' };
      return { text: '一件衣服打' + name + '後賣 ' + sale + ' 元，原價是多少元？', say: '一件衣服打' + name + '後賣' + sale + '元，原價是多少元？', answer: String(orig), options: opts(orig, [Math.round(sale * pct / 100), sale + orig - sale + 100, sale * 2]),
        hint: '原價 × ' + r + ' ＝ ' + sale + '，所以原價＝' + sale + ' ÷ ' + r + '。', explain: '<p class="ex-line">' + sale + ' ÷ ' + r + ' ＝ <b>' + orig + '</b> 元</p>' }; }
    var small = R(2, 12) * 10, m = R(2, 5);
    if (t === 1) return { text: '弟弟有 ' + small + ' 元，哥哥的錢是弟弟的 ' + m + ' 倍，兩人合起來有多少元？', say: '弟弟有' + small + '元，哥哥的錢是弟弟的' + m + '倍，兩人合起來有多少元？', answer: String(small * (1 + m)), options: opts(small * (1 + m), [small * m, small + m, small * (m - 1)]),
      hint: '合起來是弟弟的（1 ＋ ' + m + '）倍。', explain: '<p class="ex-line">' + small + ' ×（1 ＋ ' + m + '）＝ <b>' + small * (1 + m) + '</b> 元</p>' };
    return { text: '弟弟有 ' + small + ' 元，哥哥的錢是弟弟的 ' + m + ' 倍，哥哥比弟弟多幾元？', say: '弟弟有' + small + '元，哥哥的錢是弟弟的' + m + '倍，哥哥比弟弟多幾元？', answer: String(small * (m - 1)), options: opts(small * (m - 1), [small * m, small * (m + 1), small - m]),
      hint: '相差的是弟弟的（' + m + ' － 1）倍。', explain: '<p class="ex-line">' + small + ' ×（' + m + ' － 1）＝ <b>' + small * (m - 1) + '</b> 元</p>' };
  }
  /* 6 圓周長 */
  function genCircum() {
    var t = R(0, 3), d = R(2, 30);
    function f(x) { return dstr(+(x).toFixed(4)); }
    if (t === 0) return { text: '直徑 ' + d + ' 公分的圓，圓周長大約是幾公分？', say: '直徑' + d + '公分的圓，圓周長大約是幾公分？', answer: f(d * 3.14), options: opts(f(d * 3.14), [f(d / 2 * 3.14), f(d * 2 * 3.14), f(d * 3)]),
      hint: '圓周長＝直徑 × 3.14。', explain: '<p class="ex-line">' + d + ' × 3.14 ＝ <b>' + f(d * 3.14) + '</b> 公分</p>' };
    if (t === 1) return { text: '半徑 ' + d + ' 公分的圓，圓周長大約是幾公分？', say: '半徑' + d + '公分的圓，圓周長大約是幾公分？', answer: f(d * 2 * 3.14), options: opts(f(d * 2 * 3.14), [f(d * 3.14), f(d * 4 * 3.14), f(d * d * 3.14)]),
      hint: '先算直徑＝半徑 × 2，再 × 3.14。', explain: '<p class="ex-line">' + d + ' × 2 × 3.14 ＝ <b>' + f(d * 2 * 3.14) + '</b> 公分</p>' };
    if (t === 2) return { text: '圓周長 ' + f(d * 3.14) + ' 公分的圓，直徑是幾公分？', say: '圓周長' + f(d * 3.14) + '公分的圓，直徑是幾公分？', answer: String(d), options: opts(d, [d / 2 === Math.floor(d / 2) ? d / 2 : d + 1, d * 2, f(d * 3.14 * 3.14)]),
      hint: '直徑＝圓周長 ÷ 3.14。', explain: '<p class="ex-line">' + f(d * 3.14) + ' ÷ 3.14 ＝ <b>' + d + '</b> 公分</p>' };
    var c = pick([60, 72, 90, 120, 180]), cir = R(2, 9) * 36, arc = cir * c / 360;
    return { text: '圓周長 ' + cir + ' 公尺的圓上，圓心角 ' + c + ' 度的扇形，弧長是幾公尺？', say: '圓周長' + cir + '公尺的圓上，圓心角' + c + '度的扇形，弧長是幾公尺？', answer: dstr(arc), options: opts(dstr(arc), [dstr(cir * c / 180), dstr(cir - arc), dstr(arc * 2), dstr(arc + 10), String(c)]),
      hint: '弧長＝圓周長 × 圓心角/360。', explain: '<p class="ex-line">' + cir + ' × ' + frac(c, 360) + ' ＝ <b>' + dstr(arc) + '</b> 公尺</p>' };
  }
  /* 7 放大、縮小與比例尺 */
  function genScale() {
    var t = R(0, 2);
    if (t === 0) { var N = pick([100, 200, 400, 500, 1000, 2000]), cm = R(2, 12), real = cm * N / 100;
      return { text: '比例尺 1：' + N + ' 的地圖上量到 ' + cm + ' 公分，實際長是幾公尺？', say: '比例尺1比' + N + '的地圖上量到' + cm + '公分，實際長是幾公尺？', answer: dstr(real), options: opts(dstr(real), [dstr(real * 100), dstr(cm * N), dstr(real / 10)]),
        hint: '圖上 1 公分＝實際 ' + N + ' 公分＝' + N / 100 + ' 公尺；最後記得換成公尺（÷100）。', explain: '<p class="ex-line">' + cm + ' × ' + N + ' ＝ ' + cm * N + ' 公分 ＝ <b>' + dstr(real) + '</b> 公尺</p>' }; }
    if (t === 1) { var k = pick([2, 3, 4, 5]), l = R(2, 8), w = R(2, 8), per = (l + w) * 2;
      return { text: '長 ' + l + ' 公分、寬 ' + w + ' 公分的長方形，畫成 ' + k + ' 倍放大圖，放大圖的周長是幾公分？', say: '長' + l + '公分、寬' + w + '公分的長方形，畫成' + k + '倍放大圖，放大圖的周長是幾公分？', answer: String(per * k), options: opts(per * k, [per * k * k, per + k, l * w * k]),
        hint: '每條邊都變成 ' + k + ' 倍，周長也變成 ' + k + ' 倍。', explain: '<p class="ex-line">原本周長 ' + per + '，' + per + ' × ' + k + ' ＝ <b>' + per * k + '</b> 公分</p>' }; }
    var m = R(2, 20), mapCm = R(2, 10), n2 = m * 100 / mapCm;
    if (n2 !== Math.floor(n2)) return genScale();
    return { text: '實際 ' + m + ' 公尺，在平面圖上畫成 ' + mapCm + ' 公分，比例尺是多少？', say: '實際' + m + '公尺，在平面圖上畫成' + mapCm + '公分，比例尺是多少？', answer: '1：' + n2, options: opts('1：' + n2, ['1：' + m / mapCm, '1：' + n2 * 10, n2 + '：1']),
      hint: '先把公尺換成公分（× 100），再寫成 圖上：實際，化成 1：□。', explain: '<p class="ex-line">' + mapCm + ' 公分：' + m * 100 + ' 公分 ＝ <b>1：' + n2 + '</b></p>' };
  }
  /* 8 怎樣解題 */
  function genSolve() {
    var t = R(0, 3);
    if (t === 0) { var L = R(5, 50) * 10, g = pick([5, 10, 20, 25]), n = L / g; if (n !== Math.floor(n)) return genSolve(); var how = pick(['兩端都種', '兩端都不種', '只種一端']);
      var ans = how === '兩端都種' ? n + 1 : how === '兩端都不種' ? n - 1 : n;
      return { text: '一條 ' + L + ' 公尺的步道，每隔 ' + g + ' 公尺種一棵樹，' + how + '，共種幾棵？', say: '一條' + L + '公尺的步道，每隔' + g + '公尺種一棵樹，' + how + '，共種幾棵？', answer: String(ans), options: opts(ans, [n, n + 1, n - 1, n + 2]),
        hint: '先算有幾個間隔（' + L + ' ÷ ' + g + ' ＝ ' + n + '）。兩端都種：間隔 ＋ 1；只種一端：＝ 間隔；兩端都不種：間隔 － 1。', explain: '<p class="ex-line">' + n + ' 個間隔，' + how + ' → <b>' + ans + '</b> 棵</p>' }; }
    if (t === 1) { var C = R(10, 60) * 10, gp = pick([10, 20, 30, 40]); if (C % gp) return genSolve();
      return { text: '圓形花圃一圈長 ' + C + ' 公尺，沿著邊每隔 ' + gp + ' 公尺插一面旗子，共要幾面？', say: '圓形花圃一圈長' + C + '公尺，沿著邊每隔' + gp + '公尺插一面旗子，共要幾面？', answer: String(C / gp), options: opts(C / gp, [C / gp + 1, C / gp - 1, C / gp * 2]),
        hint: '繞一圈（頭尾相接）：旗子數＝間隔數，不用加減。', explain: '<p class="ex-line">' + C + ' ÷ ' + gp + ' ＝ <b>' + C / gp + '</b> 面</p>' }; }
    if (t === 2) { var cyc = pick([['紅', '黃', '藍'], ['灰', '灰', '白'], ['灰', '白', '白', '灰']]), pos = R(20, 80), col = cyc[(pos - 1) % cyc.length], uniq = cyc.filter(function (x, i, a) { return a.indexOf(x) === i; });
      return { text: '正方形依序塗成「' + cyc.join('、') + '」一直重複，第 ' + pos + ' 個是什麼顏色？', say: '正方形依序塗成' + cyc.join('、') + '，一直重複，第' + pos + '個是什麼顏色？', answer: col + '色', options: shuffle(uniq.map(function (x) { return x + '色'; })),
        hint: '一組有 ' + cyc.length + ' 個，用 ' + pos + ' ÷ ' + cyc.length + ' 看餘數：餘幾就是一組裡的第幾個（餘 0 是最後一個）。', explain: '<p class="ex-line">' + pos + ' ÷ ' + cyc.length + ' ＝ ' + Math.floor(pos / cyc.length) + ' … ' + pos % cyc.length + '，是 <b>' + col + '色</b>。</p>' }; }
    var a = R(2, 5), b = R(2, 4), c = R(2, 5);
    return { text: '早餐店有 ' + a + ' 種漢堡、' + b + ' 種飲料、' + c + ' 種點心，各選一種組成套餐，有幾種組合？', say: '早餐店有' + a + '種漢堡、' + b + '種飲料、' + c + '種點心，各選一種組成套餐，有幾種組合？', answer: String(a * b * c), options: opts(a * b * c, [a + b + c, a * b + c, a * b]),
      hint: '每一類都要選一種：用乘的。只選一樣東西才用加的。', explain: '<p class="ex-line">' + a + ' × ' + b + ' × ' + c + ' ＝ <b>' + a * b * c + '</b> 種</p>' };
  }

  /* 修正：分配律題目（之前的寫法有一段沒用到） */
  function genDist() {
    if (Math.random() < .5) {
      var a = pick([25, 30, 50, 125, 40]), b = R(11, 89), c = 100 - b, ans = a * 100;
      return { text: a + ' × ' + b + ' ＋ ' + a + ' × ' + c + ' ＝ ？', say: a + '乘以' + b + '，加' + a + '乘以' + c + '，等於多少？', answer: String(ans), options: opts(ans, [a * b + c, a * 10, ans + a]),
        hint: '分配律：' + a + ' × ' + b + ' ＋ ' + a + ' × ' + c + ' ＝ ' + a + ' ×（' + b + ' ＋ ' + c + '）。', explain: '<p class="ex-line">' + a + ' ×（' + b + ' ＋ ' + c + '）＝ ' + a + ' × 100 ＝ <b>' + ans + '</b></p>' };
    }
    var m = R(12, 89), plus = Math.random() < .5, ans2 = m * 100;
    var text = plus ? m + ' × 99 ＋ ' + m : m + ' × 101 － ' + m;
    return { text: text + ' ＝ ？', say: plus ? m + '乘以99，加' + m + '，等於多少？' : m + '乘以101，減' + m + '，等於多少？', answer: String(ans2), options: opts(ans2, [m * 99, m * 101, ans2 + m]),
      hint: '把後面的 ' + m + ' 看成 ' + m + ' × 1，再用分配律。', explain: '<p class="ex-line">' + m + ' ×（' + (plus ? '99 ＋ 1' : '101 － 1') + '）＝ ' + m + ' × 100 ＝ <b>' + ans2 + '</b></p>' };
  }
  function genAvg() {
    var n = R(3, 4), avg = R(20, 150), vals = [], s = 0;
    for (var i = 0; i < n - 1; i++) { var v = avg + R(-15, 15); vals.push(v); s += v; }
    vals.push(avg * n - s);
    var sum = avg * n;
    return { text: vals.join('、') + ' 這 ' + n + ' 個數的平均是多少？', say: vals.join('、') + '，這' + n + '個數的平均是多少？', answer: String(avg), options: opts(avg, [sum, avg + 5, Math.round(sum / (n + 1))]),
      hint: '平均＝全部加起來 ÷ 個數。', explain: '<p class="ex-line">（' + vals.join(' ＋ ') + '）÷ ' + n + ' ＝ ' + sum + ' ÷ ' + n + ' ＝ <b>' + avg + '</b></p>' };
  }
  function mix(list) { return function () { return pick(list)(); }; }

  /* 跑酷的難度（初階、中階、進階）：依題型標 q.lv */
  function lv(gen, fn) { return function () { var q = gen(); q.lv = fn(q); return q; }; }
  function has(q, re) { return re.test(q.text); }
  var genLineChartL = lv(genLineChart, function (q) { return has(q, /是多少人/) ? 1 : has(q, /每一格/) ? 2 : 3; });
  var genDistAvgL = lv(mix([genDist, genAvg]), function (q) {
    if (has(q, /平均/)) return q.text.split('、').length <= 3 ? 1 : 2;
    return has(q, /× (99|101)/) ? 3 : 2;
  });
  var genFracOfL = lv(genFracOf, function (q) { return has(q, /用分數表示/) ? 1 : has(q, /約成最簡分數/) ? 3 : 2; });
  var genSectorL = lv(genSector, function (q) { return has(q, /圓的圓心角是幾度/) ? 1 : has(q, /大扇形/) ? 2 : 3; });
  var genDecDivRunL = lv(genDecDivRun, function (q) { return has(q, /四捨五入/) ? 3 : /\./.test(q.answer) ? 2 : 1; });
  var genRatioL = lv(genRatio, function (q) { return has(q, /比值/) ? 2 : has(q, /\./) ? 3 : 1; });
  var genTwoQtyL = lv(genTwoQty, function (q) { return has(q, /要付多少元/) ? 1 : has(q, /原價是/) ? 3 : 2; });
  var genCircumL = lv(genCircum, function (q) { return has(q, /^直徑 \d+ 公分的圓，圓周長/) ? 1 : has(q, /弧長/) ? 3 : 2; });
  var genScaleL = lv(genScale, function (q) { return has(q, /放大圖/) ? 1 : has(q, /比例尺是多少/) ? 3 : 2; });
  var genSolveL = lv(genSolve, function (q) { return has(q, /組合/) ? 1 : has(q, /重複|兩端都不種/) ? 3 : 2; });

  var NINE = { id: '99', name: '九九乘法大冒險', ic: '🦊', stages: [{ id: '99', mode: 'nine', ic: '🗺️', label: '九九大冒險', name: '九九乘法大冒險', desc: '答對往前走，打倒乘法大魔王！' }] };
  function st(id, mode, name, desc, gen, extra) { var o = { id: id, mode: mode, name: name, desc: desc, gen: gen }; for (var k in extra || {}) o[k] = extra[k]; return o; }
  var Q = { tut: 'quiz', ic: '⭕', label: '比大小快答' }, Z = { tut: 'quiz', ic: '🧩', label: '選對答案' }, S = { tut: 'sort', ic: '🗑️', label: '分類丟丟樂' }, F = { tut: 'fillnum', ic: '📝', label: '自己填' };

  var G5 = [NINE,
    { id: 1, name: '折線圖', ic: '📈', stages: [st('1-1', 'run', '看折線圖', '上升最多？每一格代表多少？', genLineChartL)] },
    { id: 2, name: '倍數與因數', ic: '🔢', stages: [st('2-1', 'round', '是不是倍數', '能整除就是倍數', genMultipleSort, S), st('2-2', 'round', '因數還是倍數', '大的是倍數，小的是因數', genFactorOrMultiple, Q)] },
    { id: 3, name: '平面圖形', ic: '🔺', stages: [st('3-1', 'round', '求內角', '三角形 180 度、四邊形 360 度', genAngleSum, F), st('3-2', 'round', '能不能圍成三角形', '兩短邊加起來要比長邊長', genTriangleSides, Q)] },
    { id: 4, name: '公倍數與公因數', ic: '🧮', stages: [st('4-1', 'round', '最大公因數、最小公倍數', '找出來填進格子', genGcdLcmFill(100, 300), F), st('4-2', 'round', '要用哪一個？', '切開用公因數，拼起來用公倍數', genGcdLcmWhich, Z)] },
    { id: 5, name: '立體形體', ic: '🧊', stages: [st('5-1', 'round', '面、邊、頂點', '幾角柱、幾角錐', genSolidCount, Q), st('5-2', 'round', '柱體、錐體、球', '看圖分一分', genSolidSort, S)] },
    { id: 6, name: '整數四則運算', ic: '➗', stages: [st('6-1', 'round', '先乘除後加減', '括號先算', genOrderOps, F), st('6-2', 'run', '分配律和平均', '湊成 100 比較好算', genDistAvgL)] },
    { id: 7, name: '擴分、約分與加減', ic: '🍰', stages: [st('7-1', 'round', '分數比大小', '先通分再比', genFracCompare, Q), st('7-2', 'round', '異分母加減', '通分、相加減、約分', genFracAddFill, F)] },
    { id: 8, name: '面積', ic: '📐', stages: [st('8-1', 'round', '算面積', '高要和底垂直，斜邊不是高', genArea, F)] },
    { id: 9, name: '乘以幾分之一', ic: '🥧', stages: [st('9-1', 'run', '整數相除、幾分之一', 'a ÷ b ＝ a/b', genFracOfL)] },
    { id: 10, name: '扇形', ic: '🍕', stages: [st('10-1', 'run', '圓心角', '一整圈是 360 度', genSectorL)] }
  ];
  var G6 = [NINE,
    { id: 1, name: '最大公因數與最小公倍數', ic: '🧮', stages: [st('1-1', 'mole', '質數打地鼠', '是質數就打！1 和合數不要打', genMole, { label: '打地鼠' }), st('1-2', 'round', '短除法', '求最大公因數、最小公倍數', genGcdLcmFill(150, 1000), F), st('1-3', 'round', '互質、要用哪一個', '切開用公因數，拼起來用公倍數', genCoprimeWhich, Z)] },
    { id: 2, name: '分數除法', ic: '🍰', stages: [st('2-1', 'round', '商會變大還是變小', '除以比 1 小的數，商變大', genFracDivCompare, Q), st('2-2', 'round', '分數除法', '乘以倒數，再約分', genFracDivFill, F)] },
    { id: 3, name: '小數除法', ic: '🔟', stages: [st('3-1', 'round', '比大小', '4.8 ÷ 1.3 和 4.8 誰大？', genDecCompare, Q), st('3-2', 'run', '小數除法', '小數點要一起移', genDecDivRunL)] },
    { id: 4, name: '比與比值', ic: '⚖️', stages: [st('4-1', 'run', '最簡整數比、比值', '前項 ÷ 後項', genRatioL), st('4-2', 'round', '相等的比', '前項、後項乘同一個數', genRatioFill, F)] },
    { id: 5, name: '兩量關係', ic: '🏷️', stages: [st('5-1', 'run', '打折、和差', '打八折＝× 0.8', genTwoQtyL)] },
    { id: 6, name: '圓周長與扇形周長', ic: '⭕', stages: [st('6-1', 'run', '圓周長', '直徑 × 3.14', genCircumL)] },
    { id: 7, name: '放大、縮小與比例尺', ic: '🗺️', stages: [st('7-1', 'run', '比例尺', '公分換公尺別忘了', genScaleL)] },
    { id: 8, name: '怎樣解題', ic: '💡', stages: [st('8-1', 'run', '間隔、規律、組合', '兩端都種要 ＋1', genSolveL)] }
  ];

  root.MathQ = root.MathQ || {};
  root.MathQ.G5 = G5; root.MathQ.G6 = G6;
  root.MathQ._g56 = { gcd: gcd, lcm: lcm, isPrime: isPrime, PRIMES60: PRIMES60 };
})(typeof window !== 'undefined' ? window : globalThis);
