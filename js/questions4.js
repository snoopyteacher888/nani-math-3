/*
 * 四上數學（翰林版第七冊）出題程式
 * 依課課教案的學習目標，每個單元只練最常錯的重點：
 *   大數中間的 0、乘法十位要往左移、末尾有 0 的乘除、量角器內外圈、假分數 5/5、
 *   3 公里 40 公尺、商中間的 0、正三角形也是等腰、併式要不要括號、0.58 和 0.6、長條圖每一格代表多少。
 * 題目格式和 questions56.js 一樣（跑酷題要標 lv：1 初階、2 中階、3 進階）。
 * 四年級預設不加注音。
 */
(function (root) {
  'use strict';

  var MQ = root.MathQ;
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function opts(answer, wrongs, n) {
    n = n || 3; var out = [String(answer)];
    wrongs.forEach(function (w) { w = String(w); if (out.length < n && out.indexOf(w) < 0 && w !== '' && !/NaN|undefined|Infinity|^-/.test(w)) out.push(w); });
    return shuffle(out);
  }
  function svgOpen(w, h, label, cls) { return '<svg class="' + (cls || 'shapes') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">'; }
  function lv(gen, fn) { return function () { var q = gen(); q.lv = typeof fn === 'function' ? fn(q) : fn; return q; }; }
  function mix(list) { return function () { return pick(list)(); }; }
  function sayFrac(s) { return String(s).replace(/(\d+)又(\d+)\/(\d+)/g, '$1又$3分之$2').replace(/(\d+)\/(\d+)/g, '$2分之$1'); }

  /* =====================================================
   * 1 一億以內的數
   * ===================================================== */
  function zhBig(n) { // 國字，例如 30050060 → 三千零五萬零六十
    var h = Math.floor(n / 10000), l = n % 10000, s = '';
    if (h) s = MQ.zh(h) + '萬';
    if (l) {
      if (h && l < 1000) { s += '零'; if (l >= 10 && l < 20) s += '一'; }
      s += MQ.zh(l);
    }
    return s || '零';
  }
  function bigWithZeros() { // 5～8 位數，中間故意有 0
    var len = pick([6, 7, 8, 8]), d = [R(1, 9)];
    for (var i = 1; i < len; i++) d.push(Math.random() < .45 ? 0 : R(1, 9));
    if (d.indexOf(0) < 0) d[R(1, len - 2)] = 0;
    if (d.slice(1).every(function (x) { return x === 0; })) d[len - 1] = R(1, 9);
    return +d.join('');
  }
  function dropZero(n) { var s = String(n), i = s.indexOf('0', 1); return i < 0 ? n * 10 : +(s.slice(0, i) + s.slice(i + 1)); }
  function addZero(n) { var s = String(n), i = s.indexOf('0', 1); return i < 0 ? n * 10 : +(s.slice(0, i) + '0' + s.slice(i)); }
  function moveZero(n) { var s = String(n).split(''), i = s.indexOf('0', 1); if (i < 1 || i >= s.length - 1 || s[i + 1] === '0') return n + 10000; s[i] = s[i + 1]; s[i + 1] = '0'; return +s.join(''); }
  function zeros(n) { return (String(n).match(/0/g) || []).length; }
  var PLACES = ['個位', '十位', '百位', '千位', '萬位', '十萬位', '百萬位', '千萬位'];
  function genBigRW() {
    var t = R(0, 3), n = bigWithZeros();
    if (t === 0) {
      var ws = [dropZero(n), addZero(n), moveZero(n)];
      return { text: '「' + zhBig(n) + '」寫成數字是多少？', say: zhBig(n) + '，寫成數字是多少？', answer: String(n), options: opts(n, ws), review: zhBig(n),
        hint: '先寫「萬」前面的部分，「萬」後面一定要寫滿 4 位，不夠的補 0。',
        explain: '<p class="ex-line">' + zhBig(n) + ' ＝ <b>' + n + '</b></p>', lv: zeros(n) >= 3 ? 3 : 2 };
    }
    if (t === 1) {
      var w2 = [zhBig(dropZero(n)), zhBig(addZero(n)), zhBig(moveZero(n))];
      return { text: n + ' 的國字怎麼寫？', say: n + '的國字怎麼寫？', answer: zhBig(n), options: opts(zhBig(n), w2), cls: 'zh', review: String(n),
        hint: '從萬位以上先讀，再讀萬位以下；中間有 0 要讀「零」，連續好幾個 0 只讀一個「零」。',
        explain: '<p class="ex-line">' + n + ' 讀作 <b>' + zhBig(n) + '</b></p>', lv: zeros(n) >= 3 ? 3 : 2 };
    }
    if (t === 2) {
      var h = R(2, 99) * (Math.random() < .5 ? 1 : 10), l = Math.random() < .7 ? R(1, 9) * pick([1, 10, 100]) + (Math.random() < .5 ? 0 : R(1, 9)) : R(1000, 9999), v = h * 10000 + l;
      var cat = +(String(h) + String(l));
      return { text: '「' + h + '萬' + l + '」寫成數字是多少？', say: h + '萬' + l + '，寫成數字是多少？', answer: String(v), options: opts(v, [cat, h * 1000 + l, v * 10, h * 100000 + l]), review: h + '萬' + l,
        hint: '「萬」後面要有 4 位數：' + l + ' 不夠 4 位就在前面補 0。',
        explain: '<p class="ex-line">' + h + '萬 ＝ ' + h * 10000 + '，再加 ' + l + ' ＝ <b>' + v + '</b></p>', lv: 1 };
    }
    var m = +shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 8).join(''), s = String(m), p = R(4, 7), dg = s[s.length - 1 - p];
    var wp = [p - 1, p + 1, p - 2].filter(function (x) { return x >= 0 && x < s.length; }).map(function (x) { return s[s.length - 1 - x]; });
    return { text: m + ' 的' + PLACES[p] + '是哪一個數字？', say: m + '的' + PLACES[p] + '是哪一個數字？', answer: dg, options: opts(dg, wp), review: m + ' 的' + PLACES[p],
      hint: '從右邊數：個、十、百、千、萬、十萬、百萬、千萬。',
      explain: '<p class="ex-line">' + m + ' 從右邊數第 ' + (p + 1) + ' 個是' + PLACES[p] + '，是 <b>' + dg + '</b></p>', lv: 1 };
  }
  var genBigRWL = genBigRW;
  function genBigCompare() {
    var t = R(0, 3), a, b, as, bs;
    if (t === 0) { // 同樣位數，兩個數字對調
      a = bigWithZeros(); var s = String(a).split(''), i = R(1, s.length - 2); var tmp = s[i]; s[i] = s[i + 1]; s[i + 1] = tmp; b = +s.join(''); if (a === b) b = a + 1000;
      as = String(a); bs = String(b);
    } else if (t === 1) { // 位數不一樣：短的開頭比較大
      a = R(8, 9) * 1000000 + R(0, 999999); b = R(1, 2) * 10000000 + R(0, 999999);
      if (Math.random() < .5) { var x = a; a = b; b = x; }
      as = String(a); bs = String(b);
    } else if (t === 2) { // 萬的寫法
      var h1 = R(1000, 9999), h2 = +(String(h1).replace(/(\d)(\d)(\d)(\d)/, '$1$3$2$4')); if (h1 === h2) h2 = h1 + 1;
      a = h1 * 10000; b = h2 * 10000; as = h1 + '萬'; bs = h2 + '萬';
    } else { // 一邊用萬，一邊用數字（可能一樣大）
      var h = R(100, 9999), eq = Math.random() < .4; a = h * 10000; b = eq ? a : a + pick([-1, 1]) * pick([1000, 10000, 100000]);
      as = h + '萬'; bs = String(b);
    }
    var ans = a > b ? '＞' : a < b ? '＜' : '＝';
    return { kind: 'quiz', text: as + ' ○ ' + bs + '，○ 要填什麼？', say: as + '和' + bs + '比，哪一個大？', answer: ans, options: ['＞', '＜', '＝'], review: as + ' ○ ' + bs,
      hint: '先比位數，位數多的比較大；位數一樣，從最高位開始一位一位比。',
      explain: '<p class="ex-line">' + a + ' ' + ans + ' ' + b + '</p>' };
  }

  /* =====================================================
   * 2 乘法
   * ===================================================== */
  function noCarryAdd(x, y) { var s = 0, p = 1; while (x || y) { s += ((x % 10 + y % 10) % 10) * p; x = Math.floor(x / 10); y = Math.floor(y / 10); p *= 10; } return s; }
  function makeMul2() { // 二、三位數 × 二位數（積不超過 9999）
    var a, b;
    do { a = Math.random() < .6 ? R(13, 98) : R(102, 399); b = R(12, 89); } while (a * b > 9999 || b % 10 === 0 || a % 10 === 0 || b % 10 === 1);
    var o = b % 10, t = Math.floor(b / 10), p1 = a * o, p2 = a * t, ans = a * b, mistakes = [];
    mistakes.push({ v: p1 + p2, why: '十位的 ' + t + ' 乘出來是 ' + p2 + ' 個十，要往左移一位寫（等於 ' + p2 * 10 + '），同學對齊個位寫了。' });
    var nc = noCarryAdd(p1, p2 * 10); if (nc !== ans) mistakes.push({ v: nc, why: '兩個部分積 ' + p1 + ' 和 ' + p2 * 10 + ' 相加時，滿 10 忘記進位。' });
    mistakes.push({ v: a * o + a * t * 100 > 9999 ? ans + 10 * a : a * o + a * t * 100, why: '十位的 ' + t + ' 乘出來移了兩位，應該只往左移一位。' });
    return { a: a, op: '×', b: b, ans: ans, marks: [], mistakes: mistakes, check: a + ' × ' + o + ' ＝ ' + p1 + '，' + a + ' × ' + t + '0 ＝ ' + p2 * 10 + '，' + p1 + ' ＋ ' + p2 * 10 + ' ＝ ' + ans,
      hint: '先乘個位，再乘十位；十位乘出來的部分積要往左移一位，最後兩個加起來。', say: a + ' 乘以 ' + b };
  }
  function spotFrom(make) {
    return function () {
      var p = make(), ok = p.mistakes.filter(function (m) { return m.v > 0 && m.v !== p.ans && m.v <= 99999; });
      if (Math.random() < .3 || !ok.length) { p.shown = p.ans; p.why = null; }
      else { var m = pick(ok); p.shown = m.v; p.why = m.why; }
      return p;
    };
  }
  function genMulZero() {
    var t = R(0, 2), d1, d2, z1, z2;
    if (t === 2) { var pr = pick([[5, 2], [5, 4], [5, 6], [5, 8], [25, 4], [25, 8], [15, 4], [15, 6], [35, 2], [45, 2], [12, 5], [4, 5]]); d1 = pr[0]; d2 = pr[1]; }
    else { do { d1 = R(2, 9); d2 = R(2, 9); } while ((d1 * d2) % 10 === 0); if (Math.random() < .4) d1 = pick([12, 13, 21, 23, 31, 32]); }
    z1 = t === 0 ? R(0, 1) : R(1, 2); z2 = t === 0 ? 1 : R(1, 2);
    var a = d1 * Math.pow(10, z1), b = d2 * Math.pow(10, z2), ans = a * b, zs = z1 + z2;
    var text = Math.random() < .5 ? a + ' × ' + b + ' ＝ ？' : a + ' 的 ' + b + ' 倍是多少？';
    return { text: text, say: a + '乘以' + b + '是多少？', answer: String(ans), options: opts(ans, [ans / 10, ans * 10, ans * 100]), review: a + ' × ' + b,
      hint: '先算 0 前面的數：' + d1 + ' × ' + d2 + ' ＝ ' + d1 * d2 + '，再把兩個數後面的 0 一共 ' + zs + ' 個補上。',
      explain: '<p class="ex-line">' + d1 + ' × ' + d2 + ' ＝ ' + d1 * d2 + '，後面補 ' + zs + ' 個 0 → <b>' + ans + '</b></p>' + (t === 2 ? '<p class="ex-line">注意：' + d1 + ' × ' + d2 + ' 自己就有 0，不要少算！</p>' : ''),
      lv: t === 0 ? 1 : t === 1 ? 2 : 3 };
  }

  /* =====================================================
   * 3 角度
   * ===================================================== */
  function protractor(base, theta) { // base：'R' 或 'L'（角的一邊在右邊 0 或左邊 0）；theta：另一邊的方向（從右邊逆時針）
    var W = 520, H = 300, cx = 260, cy = 268, Rr = 228, svg = svgOpen(W, H, '量角器', 'shapes protractor');
    function pt(deg, r) { var a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }
    svg += '<path d="M' + (cx - Rr) + ' ' + cy + ' A ' + Rr + ' ' + Rr + ' 0 0 1 ' + (cx + Rr) + ' ' + cy + ' Z" fill="#EAF2FB" stroke="#2A63A8" stroke-width="3"/>';
    svg += '<path d="M' + (cx - 120) + ' ' + cy + ' A 120 120 0 0 1 ' + (cx + 120) + ' ' + cy + '" fill="none" stroke="#9DB8D9" stroke-width="2"/>';
    for (var d = 0; d <= 180; d += 5) {
      var big = d % 10 === 0, p1 = pt(d, Rr), p2 = pt(d, Rr - (big ? 18 : 10));
      svg += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="#2A63A8" stroke-width="' + (big ? 2.2 : 1.4) + '"/>';
      if (big) {
        var o = pt(d, Rr - 34), i = pt(d, Rr - 62), lift = (d === 0 || d === 180) ? -14 : 0; o[1] += lift; i[1] += lift;
        svg += '<text x="' + o[0].toFixed(1) + '" y="' + (o[1] + 6).toFixed(1) + '" text-anchor="middle" font-size="16" font-weight="700" fill="#2B2A28">' + (180 - d) + '</text>';
        svg += '<text x="' + i[0].toFixed(1) + '" y="' + (i[1] + 6).toFixed(1) + '" text-anchor="middle" font-size="15" fill="#C2402E">' + d + '</text>';
      }
    }
    var b0 = base === 'R' ? 0 : 180, e1 = pt(b0, 250), e2 = pt(theta, 250);
    var a1 = Math.min(b0, theta), a2 = Math.max(b0, theta), m1 = pt(a1, 38), m2 = pt(a2, 38);
    svg += '<path d="M' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1) + ' A 38 38 0 0 0 ' + m2[0].toFixed(1) + ' ' + m2[1].toFixed(1) + '" fill="none" stroke="#E07A2E" stroke-width="4"/>';
    svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e1[0].toFixed(1) + '" y2="' + e1[1].toFixed(1) + '" stroke="#E07A2E" stroke-width="5" stroke-linecap="round"/>';
    svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e2[0].toFixed(1) + '" y2="' + e2[1].toFixed(1) + '" stroke="#E07A2E" stroke-width="5" stroke-linecap="round"/>';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#2B2A28"/></svg>';
    return svg;
  }
  function genProtractor() {
    var ang; do { ang = 5 * R(3, 33); } while (ang === 90);
    var base = Math.random() < .5 ? 'R' : 'L', theta = base === 'R' ? ang : 180 - ang;
    var ring = base === 'R' ? '紅色（裡面那一圈）' : '黑色（外面那一圈）';
    return { kind: 'quiz', text: '橘色的角是幾度？', say: '橘色的角是幾度？看角的一邊對著哪一圈的 0。', visual: protractor(base, theta), answer: ang + '°',
      options: opts(ang + '°', [(180 - ang) + '°', (ang + 10) + '°', (ang - 10) + '°']), review: '量角器上的角（一邊對著' + (base === 'R' ? '右邊' : '左邊') + '的 0）',
      hint: '角的一邊對著' + (base === 'R' ? '右邊' : '左邊') + '的 0，那個 0 在' + ring + '，就看這一圈的數字。',
      explain: '<p class="ex-line">從' + ring + '的 0 開始數到另一邊，是 <b>' + ang + '°</b>；另一圈的 ' + (180 - ang) + '° 是看錯圈了。</p>' };
  }
  function genAngleCalc() {
    var t = R(0, 4);
    if (t === 0) {
      var a = 5 * R(3, 20), b = 5 * R(3, 16);
      return { text: a + '° 和 ' + b + '° 的角合起來是幾度？', say: a + '度和' + b + '度的角合起來是幾度？', answer: (a + b) + '°', options: opts((a + b) + '°', [(a + b + 10) + '°', Math.abs(a - b) + '°', (a + b - 10) + '°']), review: a + '° ＋ ' + b + '°',
        hint: '角合起來，度數相加。', explain: '<p class="ex-line">' + a + '° ＋ ' + b + '° ＝ <b>' + (a + b) + '°</b></p>', lv: 1 };
    }
    if (t === 1) {
      var k = pick([['1 個平角', 180], ['1 個周角', 360], ['2 個直角', 180], ['3 個直角', 270], ['4 個直角', 360], ['2 個平角', 360]]);
      return { text: k[0] + '是幾度？', say: k[0] + '是幾度？', answer: k[1] + '°', options: opts(k[1] + '°', [k[1] === 180 ? '360°' : '180°', '90°', '270°']), review: k[0],
        hint: '直角 90°，平角 180°（2 個直角），周角 360°（4 個直角）。', explain: '<p class="ex-line">' + k[0] + ' ＝ <b>' + k[1] + '°</b></p>', lv: 1 };
    }
    if (t === 2) {
      var big = pick([['平角', 180], ['周角', 360]]), x = 5 * R(5, big[1] === 180 ? 33 : 69);
      return { text: '一個' + big[0] + '分成兩個角，其中一個是 ' + x + '°，另一個是幾度？', say: '一個' + big[0] + '分成兩個角，其中一個是' + x + '度，另一個是幾度？', answer: (big[1] - x) + '°',
        options: opts((big[1] - x) + '°', [((big[1] === 180 ? 360 : 180) - x) + '°', (big[1] - x + 10) + '°', (big[1] - x - 10) + '°']), review: big[0] + ' − ' + x + '°',
        hint: big[0] + '是 ' + big[1] + '°，用減的。', explain: '<p class="ex-line">' + big[1] + '° － ' + x + '° ＝ <b>' + (big[1] - x) + '°</b></p>', lv: 2 };
    }
    var from = R(1, 12), steps = R(1, 9), cw = Math.random() < .6, to = ((from - 1 + (cw ? steps : -steps)) % 12 + 12) % 12 + 1, ans = steps * 30;
    return { text: '時鐘的指針從 ' + from + ' ' + (cw ? '順時針' : '逆時針') + '轉到 ' + to + '，轉了幾度？', say: '時鐘的指針從' + from + (cw ? '順時針' : '逆時針') + '轉到' + to + '，轉了幾度？', answer: ans + '°',
      options: opts(ans + '°', [(360 - ans) + '°', (ans + 30) + '°', (ans - 30) + '°']), review: from + ' ' + (cw ? '順' : '逆') + '時針轉到 ' + to,
      hint: '時鐘一圈 360°，每走一個數字是 30°。' + (cw ? '順時針是時針前進的方向。' : '逆時針是往回轉。'), explain: '<p class="ex-line">走了 ' + steps + ' 個數字，' + steps + ' × 30° ＝ <b>' + ans + '°</b></p>', lv: 3 };
  }

  /* =====================================================
   * 4 假分數與帶分數
   * ===================================================== */
  function genMixedFill() {
    var d = R(2, 9), w = R(1, 5), n = R(1, d - 1), imp = w * d + n;
    if (Math.random() < .5) {
      return { kind: 'fill', text: imp + '/' + d + ' 換成帶分數是多少？', say: sayFrac(imp + '/' + d) + '，換成帶分數是多少？', answer: w + '又' + n + '/' + d,
        fields: [{ label: '整數', ans: w }, { label: '分子', ans: n }, { label: '分母', ans: d }], review: imp + '/' + d + ' 換成帶分數',
        hint: '分子 ÷ 分母：商是整數，餘數是新的分子，分母不變。',
        explain: '<p class="ex-line">' + imp + ' ÷ ' + d + ' ＝ ' + w + ' … ' + n + '，所以是 <b>' + w + '又' + n + '/' + d + '</b></p>' };
    }
    return { kind: 'fill', layout: 'frac', text: w + '又' + n + '/' + d + ' 換成假分數是多少？', say: sayFrac(w + '又' + n + '/' + d) + '，換成假分數是多少？', answer: imp + '/' + d,
      fields: [{ label: '', ans: imp }, { label: '', ans: d }], review: w + '又' + n + '/' + d + ' 換成假分數',
      hint: '整數 × 分母，再加上分子，就是新的分子；分母不變。',
      explain: '<p class="ex-line">' + w + ' × ' + d + ' ＋ ' + n + ' ＝ ' + imp + '，所以是 <b>' + imp + '/' + d + '</b></p>' };
  }
  function fracWaves() { var M = MQ.moleRule; return [M('improper'), M('proper'), M('improper')]; }

  /* =====================================================
   * 5 公里
   * ===================================================== */
  function genKm() {
    var t = R(0, 3), k = R(1, 9), m;
    if (t === 0) {
      m = R(1, 9) * 100;
      return { text: k + ' 公里 ' + m + ' 公尺是幾公尺？', say: k + '公里' + m + '公尺是幾公尺？', answer: (k * 1000 + m) + ' 公尺', options: opts((k * 1000 + m) + ' 公尺', [(k * 100 + m) + ' 公尺', (k * 10000 + m) + ' 公尺', (k + m) + ' 公尺']), review: k + ' 公里 ' + m + ' 公尺',
        hint: '1 公里 ＝ 1000 公尺。', explain: '<p class="ex-line">' + k + ' 公里 ＝ ' + k * 1000 + ' 公尺，再加 ' + m + ' 公尺 ＝ <b>' + (k * 1000 + m) + ' 公尺</b></p>', lv: 1 };
    }
    if (t === 1) {
      m = Math.random() < .5 ? R(1, 9) * 10 : R(1, 9);
      return { text: k + ' 公里 ' + m + ' 公尺是幾公尺？', say: k + '公里' + m + '公尺是幾公尺？', answer: (k * 1000 + m) + ' 公尺', options: opts((k * 1000 + m) + ' 公尺', [+(k + '' + m) + ' 公尺', (k * 10000 + m) + ' 公尺', (k * 1000 + m * 10) + ' 公尺']), review: k + ' 公里 ' + m + ' 公尺',
        hint: '公里後面的公尺要寫成 3 位數：' + m + ' 公尺 → ' + ('00' + m).slice(-3) + '。', explain: '<p class="ex-line">' + k + ' 公里 ' + m + ' 公尺 ＝ ' + k + ',' + ('00' + m).slice(-3) + ' ＝ <b>' + (k * 1000 + m) + ' 公尺</b></p>', lv: 2 };
    }
    if (t === 2) {
      m = pick([R(1, 9), R(1, 9) * 10, R(11, 99)]); var tot = k * 1000 + m, ans = k + ' 公里 ' + m + ' 公尺';
      return { text: tot + ' 公尺是幾公里幾公尺？', say: tot + '公尺是幾公里幾公尺？', answer: ans, options: opts(ans, [k + ' 公里 ' + m * 10 + ' 公尺', k * 10 + ' 公里 ' + m + ' 公尺', k + ' 公里 ' + (m < 10 ? m * 100 : m + 1) + ' 公尺']), review: tot + ' 公尺',
        hint: '從右邊數 3 位是公尺，前面的是公里。', explain: '<p class="ex-line">' + tot + ' 公尺 ＝ <b>' + ans + '</b></p>', lv: 2 };
    }
    var k1 = R(1, 6), m1 = R(3, 9) * 100 + R(0, 9) * 10, m2 = R(2, 9) * 100 + R(0, 9) * 10, sum = (k1 * 1000 + m1) + m2, ak = Math.floor(sum / 1000), am = sum % 1000;
    var ans3 = ak + ' 公里 ' + am + ' 公尺';
    return { text: k1 + ' 公里 ' + m1 + ' 公尺 ＋ ' + m2 + ' 公尺 ＝ ？', say: k1 + '公里' + m1 + '公尺加' + m2 + '公尺是多少？', answer: ans3,
      options: opts(ans3, [(ak - 1) + ' 公里 ' + (am + 1000) + ' 公尺', k1 + ' 公里 ' + am + ' 公尺', (ak + 1) + ' 公里 ' + am + ' 公尺']), review: k1 + ' 公里 ' + m1 + ' 公尺 ＋ ' + m2 + ' 公尺',
      hint: '公尺加起來滿 1000，要進位成 1 公里。', explain: '<p class="ex-line">' + m1 + ' ＋ ' + m2 + ' ＝ ' + (m1 + m2) + ' 公尺 ＝ 1 公里 ' + (m1 + m2 - 1000) + ' 公尺，答案是 <b>' + ans3 + '</b></p>', lv: 3 };
  }

  /* =====================================================
   * 6 除法
   * ===================================================== */
  function dropZeroQ(q) { var s = String(q), i = s.indexOf('0', 1); return i < 0 ? q * 10 : +(s.slice(0, i) + s.slice(i + 1)); }
  function divStr(q, r) { return r ? q + ' … ' + r : String(q); }
  function genDivZero() {
    var t = R(0, 2), d, q, r;
    if (t === 0) { d = R(2, 9); do { q = R(1111, 9999); } while (/0/.test(String(q)) || q * d > 9999); r = 0; }
    else if (t === 1) { d = R(2, 9); do { q = pick([R(1, 9) * 1000 + R(1, 9) * 10 + R(0, 9), R(1, 9) * 1000 + R(1, 9) * 100 + R(1, 9), R(1, 9) * 100 + R(1, 9)]); } while (q * d > 9999 || !/0/.test(String(q).slice(1))); r = Math.random() < .5 ? 0 : R(1, d - 1); }
    else { d = R(12, 48); do { q = pick([R(1, 9) * 100 + R(1, 9), R(1, 9) * 10, R(1, 9) * 100 + R(1, 9) * 10]); } while (q * d > 9999 || q < 10); r = Math.random() < .5 ? 0 : R(1, d - 1); }
    var n = q * d + r, ans = divStr(q, r), ws = [divStr(dropZeroQ(q), r), divStr(q * 10, r), divStr(q + 1, r)];
    return { text: n + ' ÷ ' + d + ' ＝ ？', say: n + '除以' + d + '是多少？', answer: ans, options: opts(ans, ws), review: n + ' ÷ ' + d,
      hint: '每一位都要商：不夠除的那一位商 0，0 不能省略。', explain: '<p class="ex-line">' + n + ' ÷ ' + d + ' ＝ <b>' + ans + '</b>（驗算：' + q + ' × ' + d + (r ? ' ＋ ' + r : '') + ' ＝ ' + n + '）</p>', lv: t + 1 };
  }
  function genDivTailZero() {
    var z = pick([1, 2]), u = Math.pow(10, z), d, q, r, n, t = R(0, 1);
    d = R(2, 9) * u; q = R(2, 40); r = t === 0 ? 0 : R(1, d / u - 1) * u; n = q * d + r;
    if (n >= 100000) return genDivTailZero();
    if (t === 0) {
      return { kind: 'quiz', text: n + ' ÷ ' + d + ' ＝ ？', say: n + '除以' + d + '是多少？', answer: String(q), options: opts(q, [q * 10, q * 100, q * 1000]), review: n + ' ÷ ' + d,
        hint: '被除數和除數末尾同時去掉一樣多個 0，商不變。', explain: '<p class="ex-line">' + n + ' ÷ ' + d + ' → ' + n / u + ' ÷ ' + d / u + ' ＝ <b>' + q + '</b></p>' };
    }
    return { kind: 'quiz', text: n + ' ÷ ' + d + ' ＝ ' + q + ' … ？', say: n + '除以' + d + '等於' + q + '餘多少？', answer: String(r), options: opts(r, [r / u, r * 10, r / 10]), review: n + ' ÷ ' + d + ' 的餘數',
      hint: '去掉 0 算出來的餘數，要把去掉的 0 補回來！', explain: '<p class="ex-line">' + n / u + ' ÷ ' + d / u + ' ＝ ' + q + ' … ' + r / u + '，餘數要補回 ' + z + ' 個 0 → <b>' + r + '</b>（驗算：' + q + ' × ' + d + ' ＋ ' + r + ' ＝ ' + n + '）</p>' };
  }

  /* 6-3 除法的關係（推理）：被除數 ＝ 除數 × 商 ＋ 餘數；餘數比除數小；乘法的未知數用除的找 */
  function genDivRelation() {
    var t = R(0, 3), d, q, r, n;
    if (t === 0) {
      d = R(6, 25); q = R(12, 60); r = R(1, d - 1); n = d * q + r;
      var form = Math.random() < .5;
      return { kind: 'quiz', text: form ? '□ ÷ ' + d + ' ＝ ' + q + ' … ' + r + '，□ 是多少？' : '一個數除以 ' + d + '，商是 ' + q + '，餘數是 ' + r + '。這個數是多少？',
        say: form ? '方框除以' + d + '等於' + q + '餘' + r + '，方框是多少？' : '一個數除以' + d + '，商是' + q + '，餘數是' + r + '。這個數是多少？',
        answer: String(n), options: opts(n, [d * q, d * q - r, q * r + d]), review: '□ ÷ ' + d + ' ＝ ' + q + ' … ' + r,
        hints: ['用驗算的方法倒回去想：被除數 ＝ 除數 × 商 ＋ 餘數。'], hint: '先算 ' + d + ' × ' + q + ' ＝ ' + d * q + '，再加上餘數 ' + r + '。',
        explain: '<p class="ex-line">' + d + ' × ' + q + ' ＋ ' + r + ' ＝ ' + d * q + ' ＋ ' + r + ' ＝ <b>' + n + '</b></p>' };
    }
    if (t === 1) {
      d = R(4, 15);
      return { kind: 'quiz', text: '一個數除以 ' + d + '，餘數最大可能是多少？', say: '一個數除以' + d + '，餘數最大可能是多少？', answer: String(d - 1), options: opts(d - 1, [d, d + 1, d - 2]), review: '除以 ' + d + ' 的最大餘數',
        hints: ['想一想：如果餘數是 ' + d + '，是不是還可以再分 1 次？'], hint: '餘數一定要比除數小，所以最大是 ' + d + ' － 1。',
        explain: '<p class="ex-line">餘數比除數 ' + d + ' 小，最大是 <b>' + (d - 1) + '</b>。</p>' };
    }
    if (t === 2) {
      d = R(12, 48); q = R(13, 89); n = d * q;
      return { kind: 'quiz', text: '□ × ' + d + ' ＝ ' + n + '，□ 是多少？', say: '方框乘以' + d + '等於' + n + '，方框是多少？', answer: String(q), options: opts(q, [n - d, q + 10, q * 10]), review: '□ × ' + d + ' ＝ ' + n,
        hints: ['乘法裡不知道的數，用除的找回來。'], hint: '□ ＝ ' + n + ' ÷ ' + d + '，可以用計算紙列直式。',
        explain: '<p class="ex-line">' + n + ' ÷ ' + d + ' ＝ <b>' + q + '</b>（' + q + ' × ' + d + ' ＝ ' + n + '）</p>' };
    }
    var k = R(3, 9), small = R(110, 990), big = small * k, w = pick([['姐姐', '妹妹'], ['爸爸', '小明'], ['老師', '小華']]);
    if (big > 9999) return genDivRelation();
    return { kind: 'quiz', text: w[0] + '存了 ' + big + ' 元，是' + w[1] + '的 ' + k + ' 倍。' + w[1] + '存了多少元？', say: w[0] + '存了' + big + '元，是' + w[1] + '的' + k + '倍。' + w[1] + '存了多少元？',
      answer: String(small), options: opts(small, [big * k, big - k, small + k * 10]), review: w[0] + ' ' + big + ' 元，是' + w[1] + '的 ' + k + ' 倍',
      hints: [w[0] + '是' + w[1] + '的 ' + k + ' 倍，' + w[0] + '比較多；要找比較少的' + w[1] + '。'], hint: w[1] + ' × ' + k + ' ＝ ' + big + '，所以' + w[1] + ' ＝ ' + big + ' ÷ ' + k + '。',
      explain: '<p class="ex-line">' + big + ' ÷ ' + k + ' ＝ <b>' + small + '</b> 元</p>' };
  }
  /* =====================================================
   * 7 三角形與全等
   * ===================================================== */
  function triSVG(A, B, rot) { // 底邊兩個角 A、B（度），畫出三角形，直角畫小方塊
    var C = 180 - A - B, rad = Math.PI / 180, b = Math.sin(B * rad) / Math.sin(C * rad);
    var P = [[0, 0], [1, 0], [b * Math.cos(A * rad), b * Math.sin(A * rad)]], ang = [A, B, C];
    var cr = Math.cos(rot * rad), sr = Math.sin(rot * rad);
    P = P.map(function (p) { return [p[0] * cr - p[1] * sr, p[0] * sr + p[1] * cr]; });
    var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var sc = Math.min(180 / (maxX - minX), 130 / (maxY - minY)), ox = 110 - (minX + maxX) / 2 * sc, oy = 85 + (minY + maxY) / 2 * sc;
    var Q = P.map(function (p) { return [ox + p[0] * sc, oy - p[1] * sc]; });
    var svg = svgOpen(220, 170, '三角形', 'shapes tri') + '<polygon points="' + Q.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '" fill="#FFF3E2" stroke="#2B2A28" stroke-width="3" stroke-linejoin="round"/>';
    ang.forEach(function (a, i) {
      if (a !== 90) return;
      var v = Q[i], u1 = Q[(i + 1) % 3], u2 = Q[(i + 2) % 3];
      function unit(p) { var dx = p[0] - v[0], dy = p[1] - v[1], l = Math.hypot(dx, dy); return [dx / l * 14, dy / l * 14]; }
      var e1 = unit(u1), e2 = unit(u2);
      svg += '<path d="M' + (v[0] + e1[0]).toFixed(1) + ' ' + (v[1] + e1[1]).toFixed(1) + ' L' + (v[0] + e1[0] + e2[0]).toFixed(1) + ' ' + (v[1] + e1[1] + e2[1]).toFixed(1) + ' L' + (v[0] + e2[0]).toFixed(1) + ' ' + (v[1] + e2[1]).toFixed(1) + '" fill="none" stroke="#C2402E" stroke-width="2.5"/>';
    });
    return svg + '</svg>';
  }
  function genTriSort() {
    var t = R(0, 2), A, B;
    if (t === 0) { do { A = R(45, 85); B = R(45, 85); } while (180 - A - B >= 90 || 180 - A - B < 30); }
    else if (t === 1) { var big = 90, other = R(25, 65), slot = R(0, 2); var arr = [other, 180 - big - other]; arr.splice(slot, 0, big); A = arr[0]; B = arr[1]; if (A + B >= 180 || A <= 0 || B <= 0) return genTriSort(); }
    else { var ob = R(100, 135), o2 = R(15, 180 - ob - 15), slot2 = R(0, 2), arr2 = [o2, 180 - ob - o2]; arr2.splice(slot2, 0, ob); A = arr2[0]; B = arr2[1]; if (A + B >= 180) return genTriSort(); }
    var ans = ['銳角三角形', '直角三角形', '鈍角三角形'][t];
    return { kind: 'sort', text: '這是哪一種三角形？', say: '這是哪一種三角形？看最大的那個角。', card: triSVG(A, B, R(-25, 25)), bins: ['銳角三角形', '直角三角形', '鈍角三角形'], answer: ans, review: '三個角是 ' + A + '°、' + B + '°、' + (180 - A - B) + '° 的三角形',
      hint: '三個角都比直角小 → 銳角三角形；有一個直角 → 直角三角形；有一個角比直角大 → 鈍角三角形。',
      explain: '<p class="ex-line">三個角大約是 ' + A + '°、' + B + '°、' + (180 - A - B) + '°，是<b>' + ans + '</b>。</p>' };
  }
  function genTriSides() {
    var t = R(0, 4);
    if (t === 0) {
      var s = R(3, 12);
      return { kind: 'quiz', text: '三邊都是 ' + s + ' 公分的三角形，是不是等腰三角形？', say: '三邊都是' + s + '公分的三角形，是不是等腰三角形？', answer: '是', options: ['是', '不是', '不一定'], review: '三邊一樣長的三角形是不是等腰三角形',
        hint: '等腰三角形：至少兩邊一樣長。正三角形三邊都一樣長，當然也是等腰三角形。', explain: '<p class="ex-line">正三角形也是<b>等腰三角形</b>。</p>' };
    }
    if (t === 1) {
      var a = R(3, 12), b; do { b = R(3, 12); } while (b === a || 2 * a <= b);
      var iso = Math.random() < .6, sides = iso ? [a, a, b] : [a, b, (function () { var c; do { c = R(Math.abs(a - b) + 1, a + b - 1); } while (c === a || c === b); return c; })()];
      var ans = iso ? '等腰三角形' : '都不是';
      return { kind: 'quiz', text: '三邊長 ' + shuffle(sides).join('、') + ' 公分的三角形，是什麼三角形？', say: '三邊長' + sides.join('、') + '公分的三角形，是什麼三角形？', answer: ans, options: ['等腰三角形', '正三角形', '都不是'], review: '三邊長 ' + sides.join('、') + ' 公分',
        hint: '兩邊一樣長是等腰三角形；三邊都一樣長才是正三角形。', explain: '<p class="ex-line">' + (iso ? '有兩邊都是 ' + a + ' 公分，是<b>等腰三角形</b>。' : '三邊都不一樣長，<b>都不是</b>。') + '</p>' };
    }
    if (t === 2) {
      return { kind: 'quiz', text: '一個三角形有一個直角，而且有兩邊一樣長，叫做什麼三角形？', say: '一個三角形有一個直角，而且有兩邊一樣長，叫做什麼三角形？', answer: '等腰直角三角形', options: ['等腰直角三角形', '正三角形', '鈍角三角形'], review: '有直角又有兩邊一樣長',
        hint: '有直角 → 直角三角形；兩邊一樣長 → 等腰三角形；兩個都有 → 等腰直角三角形。', explain: '<p class="ex-line"><b>等腰直角三角形</b>，兩個底角都是 45°。</p>' };
    }
    if (t === 3) {
      var x = R(3, 6), y = x + R(1, 3), z = y + R(1, 2), which = pick([['最長', z], ['最短', x]]);
      return { kind: 'quiz', text: '甲和乙兩個三角形全等。甲的三邊是 ' + x + '、' + y + '、' + z + ' 公分，乙' + which[0] + '的邊是幾公分？', say: '甲和乙兩個三角形全等。甲的三邊是' + x + '、' + y + '、' + z + '公分，乙' + which[0] + '的邊是幾公分？',
        answer: which[1] + ' 公分', options: opts(which[1] + ' 公分', [x + ' 公分', y + ' 公分', z + ' 公分']), review: '全等三角形的對應邊',
        hint: '全等的兩個圖形可以完全疊在一起：對應邊一樣長、對應角一樣大。', explain: '<p class="ex-line">對應邊一樣長，乙' + which[0] + '的邊也是 <b>' + which[1] + ' 公分</b>。</p>' };
    }
    return { kind: 'quiz', text: '兩個三角形形狀一樣，可是一個大、一個小，它們全等嗎？', say: '兩個三角形形狀一樣，可是一個大、一個小，它們全等嗎？', answer: '不全等', options: ['全等', '不全等', '不一定'], review: '形狀一樣、大小不同',
      hint: '全等要「形狀和大小都一樣」，能完全疊在一起。', explain: '<p class="ex-line">大小不一樣就疊不起來，<b>不全等</b>。</p>' };
  }

  /* =====================================================
   * 8 兩步驟問題與併式
   * ===================================================== */
  function genEquation() {
    var t = R(0, 5), a, b, c, text, ans, ws, val, lvl, say;
    var item = pick([['枝', '鉛筆'], ['本', '筆記本'], ['個', '麵包'], ['盒', '牛奶']]), it = item[0] + item[1];
    if (t === 0) { a = R(2, 6); b = R(12, 35); c = pick([100, 200, 500]); if (a * b >= c) return genEquation();
      text = '買 ' + a + ' ' + item[0] + ' ' + b + ' 元的' + item[1] + '，付 ' + c + ' 元，找回多少元？'; ans = c + ' － ' + a + ' × ' + b; ws = ['(' + c + ' － ' + a + ') × ' + b, c + ' － ' + a + ' ＋ ' + b, a + ' × ' + b + ' － ' + c]; val = c - a * b; lvl = 1; }
    else if (t === 1) { a = R(6, 12); b = R(3, 8); c = R(2, 9);
      text = '每盒裝 ' + a + ' 顆蛋，有 ' + b + ' 盒，又多 ' + c + ' 顆，一共幾顆？'; ans = a + ' × ' + b + ' ＋ ' + c; ws = [a + ' × (' + b + ' ＋ ' + c + ')', '(' + a + ' ＋ ' + c + ') × ' + b, a + ' ＋ ' + b + ' × ' + c]; val = a * b + c; lvl = 1; }
    else if (t === 2) { a = R(3, 8); var each = R(4, 12); c = R(3, 15); b = a * each + c;
      text = '有 ' + b + ' 顆糖，先吃掉 ' + c + ' 顆，剩下的平分給 ' + a + ' 人，每人幾顆？'; ans = '(' + b + ' － ' + c + ') ÷ ' + a; ws = [b + ' － ' + c + ' ÷ ' + a, b + ' ÷ ' + a + ' － ' + c, '(' + b + ' ＋ ' + c + ') ÷ ' + a]; val = each; lvl = 2; }
    else if (t === 3) { b = R(3, 6); var pen = R(8, 25); c = R(10, 40); a = b * pen + c;
      text = '用 ' + a + ' 元買 1 個 ' + c + ' 元的鉛筆盒和 ' + b + ' 枝一樣的筆，剛好用完。每枝筆幾元？'; ans = '(' + a + ' － ' + c + ') ÷ ' + b; ws = [a + ' － ' + c + ' ÷ ' + b, a + ' ÷ ' + b + ' － ' + c, '(' + a + ' ÷ ' + b + ') － ' + c]; val = pen; lvl = 2; }
    else if (t === 4) { a = R(2, 6); c = R(2, 5); var per = R(3, 9); b = a * c * per;
      text = b + ' 張貼紙平分成 ' + a + ' 包，每包再平分給 ' + c + ' 人，每人幾張？'; ans = b + ' ÷ ' + a + ' ÷ ' + c; ws = [b + ' ÷ ' + a + ' × ' + c, b + ' × ' + a + ' ÷ ' + c, b + ' ÷ ' + a + ' － ' + c]; val = per; lvl = 2; }
    else { // 進階：算出答案（先乘除後加減、括號先算）
      a = R(2, 9); b = R(3, 12); c = R(20, 90);
      var form = pick(['A', 'B']);
      if (form === 'A') { text = c + ' － ' + a + ' × ' + b + ' ＝ ？'; val = c - a * b; if (val < 0) return genEquation(); ws = [(c - a) * b, c - a + b, val + 10]; ans = String(val);
        return { text: text, say: c + '減' + a + '乘以' + b + '是多少？', answer: ans, options: opts(ans, ws), review: text, hint: '先乘除，後加減。', explain: '<p class="ex-line">先算 ' + a + ' × ' + b + ' ＝ ' + a * b + '，再算 ' + c + ' － ' + a * b + ' ＝ <b>' + val + '</b></p>', lv: 3 }; }
      var s2 = a * b + c; text = '(' + s2 + ' － ' + c + ') ÷ ' + a + ' ＝ ？'; val = b; ws = [s2 - c / a, b + c, b * 10, b + 1]; ans = String(val);
      return { text: text, say: s2 + '減' + c + '的差，再除以' + a + '是多少？', answer: ans, options: opts(ans, ws.filter(function (w) { return w === Math.floor(w); })), review: text, hint: '括號裡面先算。', explain: '<p class="ex-line">先算括號 ' + s2 + ' － ' + c + ' ＝ ' + (s2 - c) + '，再算 ' + (s2 - c) + ' ÷ ' + a + ' ＝ <b>' + val + '</b></p>', lv: 3 };
    }
    say = text.replace(/＋/g, '加').replace(/－/g, '減');
    return { text: text + ' 哪一個算式對？', say: say + '哪一個算式對？', answer: ans, options: opts(ans, ws), review: text,
      hint: '先想要先算什麼：要先算的部分如果是加減，就要加括號；乘除本來就會先算。', explain: '<p class="ex-line">' + ans + ' ＝ <b>' + val + '</b></p>', lv: lvl };
  }

  /* =====================================================
   * 9 二位小數
   * ===================================================== */
  function d2(v) { return String(+(v / 100).toFixed(2)); } // 百分之幾 → 小數字串（去掉多餘的 0）
  function decWaves() {
    var M = MQ.moleRule, ks = shuffle([0.4, 0.5, 0.6, 0.7, 0.8, 1.2, 1.5, 2.3]);
    return [M('gt', ks[0]), M('lt', ks[1]), M('gt', ks[2])];
  }
  function genDec() {
    var t = R(0, 4);
    if (t === 0) {
      var o = R(1, 9), h = R(1, 9), v = o * 100 + h;
      return { text: o + ' 個 1 和 ' + h + ' 個 0.01 合起來是多少？', say: o + '個1和' + h + '個0.01合起來是多少？', answer: d2(v), options: opts(d2(v), [o + '.' + h, '0.' + o + h, o + '.00' + h]), review: o + ' 個 1 和 ' + h + ' 個 0.01',
        hint: '0.01 是百分位，要寫在小數點後第 2 位；十分位沒有就補 0。', explain: '<p class="ex-line">' + o + ' ＋ 0.0' + h + ' ＝ <b>' + d2(v) + '</b></p>', lv: 1 };
    }
    if (t === 1) {
      var n = R(11, 99); if (n % 10 === 0) n++;
      return { text: '0.' + n + ' 是幾個 0.01？', say: '0.' + n + '是幾個0.01？', answer: String(n), options: opts(n, [n / 10, n * 10, n % 10]), review: '0.' + n + ' 是幾個 0.01',
        hint: '0.01 是 1 個百分之一；0.' + n + ' 就是 ' + n + ' 個 0.01。', explain: '<p class="ex-line">0.' + n + ' ＝ <b>' + n + '</b> 個 0.01</p>', lv: 1 };
    }
    if (t === 2) {
      var digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), x = digits[0] + '.' + digits[1] + digits[2], p = R(0, 2), names = ['個位', '十分位', '百分位'];
      return { text: x + ' 的' + names[p] + '是哪一個數字？', say: x + '的' + names[p] + '是哪一個數字？', answer: String(digits[p]), options: opts(digits[p], digits.filter(function (d, i) { return i !== p; })), review: x + ' 的' + names[p],
        hint: '小數點左邊是個位；右邊第 1 位是十分位，第 2 位是百分位。', explain: '<p class="ex-line">' + x + ' 的' + names[p] + '是 <b>' + digits[p] + '</b></p>', lv: 1 };
    }
    // 加減：一位小數和二位小數，小數點要對齊（常見錯：靠右對齊）
    var A = R(2, 19) * 10, B = R(11, 99); if (B % 10 === 0) B++;
    var add = t === 3, val = add ? A + B : A - B;
    if (!add && val <= 0) return genDec();
    var wrong = add ? A / 10 + B : Math.abs(A / 10 - B);
    var ans = d2(val), text = d2(A) + (add ? ' ＋ ' : ' － ') + d2(B) + ' ＝ ？';
    return { text: text, say: d2(A) + (add ? '加' : '減') + d2(B) + '是多少？', answer: ans, options: opts(ans, [d2(wrong), d2(val + 10), d2(val - 10), d2(val + 1), d2(val * 10)]), review: text,
      hint: '直式要把小數點對齊，' + d2(A) + ' 可以想成 ' + (A / 100).toFixed(2) + '。', explain: '<p class="ex-line">' + (A / 100).toFixed(2) + (add ? ' ＋ ' : ' － ') + (B / 100).toFixed(2) + ' ＝ <b>' + ans + '</b>（小數點對齊才不會錯）</p>', lv: t === 3 ? 2 : 3 };
  }

  /* =====================================================
   * 10 統計圖表：長條圖
   * ===================================================== */
  var BAR_SETS = [['喜歡的水果', ['蘋果', '香蕉', '葡萄', '西瓜', '芒果']], ['喜歡的運動', ['跑步', '游泳', '籃球', '跳繩', '躲避球']], ['借書的本數', ['一月', '二月', '三月', '四月', '五月']], ['各班的人數', ['甲班', '乙班', '丙班', '丁班']]];
  function genBarChart() {
    var set = pick(BAR_SETS), cats = set[1], unit = pick([1, 2, 5, 10]), rows = 10, n = cats.length;
    var vals; do { vals = cats.map(function () { return unit * R(2, rows); }); } while (new Set(vals).size < n || vals.filter(function (v) { return v === Math.max.apply(null, vals); }).length > 1);
    var W = 560, H = 320, x0 = 70, y0 = 270, gh = 220 / rows, gw = (W - x0 - 20) / n, svg = svgOpen(W, H, '長條圖', 'shapes chart');
    for (var r = 0; r <= rows; r++) {
      var yy = y0 - r * gh;
      svg += '<line x1="' + x0 + '" y1="' + yy + '" x2="' + (W - 10) + '" y2="' + yy + '" stroke="#D8D2C4" stroke-width="1.5"/>';
      if (r % 2 === 0) svg += '<text x="' + (x0 - 8) + '" y="' + (yy + 8) + '" text-anchor="end" font-size="20" font-weight="700" fill="#2B2A28">' + r * unit + '</text>';
    }
    vals.forEach(function (v, i) {
      var h = v / unit * gh, x = x0 + i * gw + gw * .22;
      svg += '<rect x="' + x.toFixed(1) + '" y="' + (y0 - h).toFixed(1) + '" width="' + (gw * .56).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="#7FB0E0" stroke="#2A63A8" stroke-width="2.5"/>';
      svg += '<text x="' + (x0 + i * gw + gw / 2).toFixed(1) + '" y="' + (y0 + 30) + '" text-anchor="middle" font-size="20" font-weight="700" fill="#2B2A28">' + cats[i] + '</text>';
    });
    svg += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="30" stroke="#2B2A28" stroke-width="2.5"/><line x1="' + x0 + '" y1="' + y0 + '" x2="' + (W - 10) + '" y2="' + y0 + '" stroke="#2B2A28" stroke-width="2.5"/></svg>';
    var t = R(0, 3), base = { visual: svg, wide: true, review: set[0] + '：' + cats.map(function (c, i) { return c + ' ' + vals[i]; }).join('、') };
    var mx = vals.indexOf(Math.max.apply(null, vals)), mn = vals.indexOf(Math.min.apply(null, vals)), k = R(0, n - 1);
    if (t === 0) return Object.assign(base, { text: '長條圖裡，哪一個最多？', say: '長條圖裡，哪一個最多？', answer: cats[mx], options: opts(cats[mx], shuffle(cats.filter(function (c, i) { return i !== mx; }))),
      hint: '最高的長條最多。', explain: '<p class="ex-line">' + cats[mx] + '的長條最高，有 ' + vals[mx] + '。</p>', lv: 1 });
    if (t === 1) return Object.assign(base, { text: '長條圖裡，每一小格代表多少？', say: '長條圖裡，每一小格代表多少？', answer: String(unit), options: opts(unit, [1, 2, 5, 10, unit * 2].filter(function (x) { return x !== unit; })),
      hint: '看左邊的數字：兩條線之間差多少，再看中間有幾格。', explain: '<p class="ex-line">0 到 ' + 2 * unit + ' 有 2 格，每一格是 <b>' + unit + '</b>。</p>', lv: 2 });
    if (t === 2) return Object.assign(base, { text: cats[k] + '是多少？', say: cats[k] + '是多少？', answer: String(vals[k]), options: opts(vals[k], [vals[k] / unit, vals[k] + unit, vals[k] - unit]),
      hint: '先看每一格代表 ' + unit + '，再數長條有幾格。', explain: '<p class="ex-line">' + cats[k] + '有 ' + vals[k] / unit + ' 格，' + vals[k] / unit + ' × ' + unit + ' ＝ <b>' + vals[k] + '</b></p>', lv: unit <= 2 ? 1 : 2 });
    var df = vals[mx] - vals[mn];
    return Object.assign(base, { text: '最多的比最少的多多少？', say: '最多的比最少的多多少？', answer: String(df), options: opts(df, [df / unit, vals[mx], df + unit]),
      hint: '找出最高和最低的長條，相減。', explain: '<p class="ex-line">' + cats[mx] + ' ' + vals[mx] + ' － ' + cats[mn] + ' ' + vals[mn] + ' ＝ <b>' + df + '</b></p>', lv: 3 });
  }

  /* =====================================================
   * 關卡
   * ===================================================== */
  var NINE = { id: '99', name: '九九乘法大冒險', stages: [{ id: '99', mode: 'nine', label: '九九大冒險', name: '九九乘法大冒險', desc: '答對往前走，打倒乘法大魔王！' }] };
  function st(id, mode, name, desc, gen, extra) { var o = { id: id, mode: mode, name: name, desc: desc, gen: gen }; for (var k in extra || {}) o[k] = extra[k]; return o; }
  var Q = { tut: 'quiz', label: '比大小快答' }, Z = { tut: 'quiz', label: '選對答案' }, S = { tut: 'sort', label: '分類丟丟樂' }, F = { tut: 'fillnum', label: '自己填' };
  var MOLE = function (waves) { return { label: '打地鼠', tut: 'mole-switch', waves: waves }; };

  var G4 = [NINE,
    { id: 1, name: '一億以內的數', stages: [st('1-1', 'run', '大數讀寫', '中間的 0 別漏掉', genBigRWL), st('1-2', 'round', '大數比大小', '先比位數，再從最高位比', genBigCompare, Q)] },
    { id: 2, name: '乘法', stages: [{ id: '2-1', mode: 'spot', name: '找出乘法的錯', desc: '十位乘出來要往左移一位', make: spotFrom(makeMul2) }, st('2-2', 'run', '末尾有 0 的乘法', '先乘，再補 0', genMulZero)] },
    { id: 3, name: '角度', stages: [st('3-1', 'round', '看量角器', '對著 0 的那一圈讀', genProtractor, { tut: 'quiz', label: '選對答案' }), st('3-2', 'run', '平角、周角、旋轉', '平角 180°，周角 360°', genAngleCalc)] },
    { id: 4, name: '假分數與帶分數', stages: [st('4-1', 'round', '假分數和帶分數互換', '分子 ÷ 分母', genMixedFill, F), st('4-2', 'mole', '真分數假分數打地鼠', '分子和分母一樣，也是假分數', null, MOLE(fracWaves))] },
    { id: 5, name: '公里', stages: [st('5-1', 'run', '公里和公尺', '1 公里 ＝ 1000 公尺', genKm)] },
    { id: 'p1', name: '學習加油讚一', stages: [st('p1', 'run', '闖關：1～5 單元', '大數、乘法、角度、公里', mix([genBigRWL, genMulZero, genAngleCalc, genKm]))] },
    { id: 6, name: '除法', stages: [st('6-1', 'run', '商中間有 0', '不夠商的那一位要寫 0', genDivZero), st('6-2', 'round', '末尾有 0 的除法', '餘數要把 0 補回來', genDivTailZero, Z), st('6-3', 'round', '除法的關係', '被除數 ＝ 除數 × 商 ＋ 餘數', genDivRelation, Z)] },
    { id: 7, name: '三角形與全等', stages: [st('7-1', 'round', '三角形分類', '看最大的角', genTriSort, S), st('7-2', 'round', '等腰、正三角形、全等', '正三角形也是等腰三角形', genTriSides, Z)] },
    { id: 8, name: '兩步驟問題與併式', stages: [st('8-1', 'run', '列併式', '先算的加減要加括號', genEquation)] },
    { id: 9, name: '二位小數', stages: [st('9-1', 'mole', '小數比大小打地鼠', '0.58 比 0.6 小喔', null, MOLE(decWaves)), st('9-2', 'run', '化聚與加減', '小數點要對齊', genDec)] },
    { id: 10, name: '統計圖表', stages: [st('10-1', 'run', '看長條圖', '先看每一格代表多少', genBarChart)] },
    { id: 'p2', name: '學習加油讚二', stages: [st('p2', 'run', '闖關：6～10 單元', '除法、併式、小數、長條圖', mix([genDivZero, genEquation, genDec, genBarChart]))] }
  ];

  root.MathQ.G4 = G4;
  root.MathQ._g4 = { zhBig: zhBig, protractor: protractor };
})(typeof window !== 'undefined' ? window : globalThis);
