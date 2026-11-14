/*
 * 應用題題庫（三、四、五、六年級，每個單元都有）
 *
 * 每次點關卡之前先做 1 題「該單元」的應用題（js/word.js），練閱讀理解和推理：
 *   第 1 步 點出問的是哪一句 → 第 2 步 點出用得到的數字
 *   → 第 3 步 選算法（兩步驟的題目分兩次選，□ 是上一步算出來的數）→ 第 4 步 算出答案
 *
 * 一題的格式：
 *   sents：題目的句子（最後一句是問句，ask 是問句的位置）
 *   use：題目裡要用到的數字（字串，和題目裡寫的一樣）
 *   steps：[{ opts: [算法…], ans: 對的算法, expr?: 可以算的算式（測試用）, val?: 這一步的結果, why: 說明 }]
 *   ans：答案（數字，或 'a/b' 分數）；unit：單位；explain：完整說明
 */
(function (root) {
  'use strict';

  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function d2(x) { return String(+x.toFixed(2)); }
  function sfrac(n, d) { var g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + '/' + d; }
  var NAMES = ['小明', '小華', '小美', '阿傑', '安安', '小真', '平平', '小宇'];
  function who() { return pick(NAMES); }
  /* 一步的選項：對的放進去，再加兩個不對的，打亂 */
  function step(ans, wrongs, why, extra) {
    var o = [ans]; wrongs.forEach(function (w) { if (o.indexOf(w) < 0 && o.length < 3) o.push(w); });
    var s = { opts: shuffle(o), ans: ans, why: why }; for (var k in extra || {}) s[k] = extra[k]; return s;
  }
  function P(o) { o.ask = o.ask == null ? o.sents.length - 1 : o.ask; o.opt = o.opt || []; return o; }

  /* =====================================================
   * 共用：九九乘法（三～六年級的九九大冒險）
   * ===================================================== */
  function w99() {
    var a = R(3, 9), b = R(3, 9), p = R(20, 60), n = who(), it = pick([['盒', '雞蛋', '顆'], ['袋', '蘋果', '顆'], ['包', '餅乾', '片'], ['排', '椅子', '張']]);
    return P({ sents: [n + '買了 ' + b + ' ' + it[0] + it[1] + '，', '每' + it[0] + '有 ' + a + ' ' + it[2] + '，', n + '一共買了幾' + it[2] + it[1] + '？'],
      use: [String(a), String(b)], steps: [step(a + ' × ' + b, [a + ' ＋ ' + b, Math.max(a, b) + ' － ' + Math.min(a, b)], '每' + it[0] + ' ' + a + ' ' + it[2] + '，有 ' + b + ' ' + it[0] + '，就是 ' + b + ' 個 ' + a + '，用乘的。', { expr: a + ' × ' + b })],
      ans: a * b, unit: it[2], explain: a + ' × ' + b + ' ＝ ' + a * b });
  }

  /* =====================================================
   * 三上（南一）
   * ===================================================== */
  var G3 = {};
  G3['99'] = w99;
  G3[1] = function () { // 數到 10000
    var t = R(1, 9), h = R(1, 9), d = R(1, 9), x = R(3, 12);
    return P({ sents: ['撲滿裡有 ' + t + ' 張千元鈔、', h + ' 張百元鈔和 ' + d + ' 個十元硬幣，', '撲滿裡的錢一共是多少元？'],
      use: [String(t), String(h), String(d)], steps: [step(t + '000 ＋ ' + h + '00 ＋ ' + d + '0', [t + ' ＋ ' + h + ' ＋ ' + d, t + '00 ＋ ' + h + '0 ＋ ' + d], t + ' 張千元是 ' + t + '000 元，' + h + ' 張百元是 ' + h + '00 元，' + d + ' 個十元是 ' + d + '0 元。', { expr: t + '000 ＋ ' + h + '00 ＋ ' + d + '0' })],
      ans: t * 1000 + h * 100 + d * 10, unit: '元', explain: t * 1000 + ' ＋ ' + h * 100 + ' ＋ ' + d * 10 + ' ＝ ' + (t * 1000 + h * 100 + d * 10) });
  };
  G3[2] = function () { // 四位數的加減
    if (Math.random() < .5) {
      var a = R(1200, 4800), b = R(800, 3900), c = R(50, 300), pl = pick(['動物園', '博物館', '科學館']);
      return P({ sents: [pl + '上午有 ' + a + ' 人參觀，', '下午有 ' + b + ' 人參觀，', '這一天一共有多少人參觀？'],
        use: [String(a), String(b)], steps: [step(a + ' ＋ ' + b, [Math.max(a, b) + ' － ' + Math.min(a, b), a + ' × ' + b], '上午和下午的人合起來，用加的。', { expr: a + ' ＋ ' + b })],
        ans: a + b, unit: '人', explain: a + ' ＋ ' + b + ' ＝ ' + (a + b) });
    }
    var s = R(1500, 4000), g = R(600, 2500), bike = R(2000, s + g - 300), col = R(10, 25), n = who();
    return P({ sents: [n + '存了 ' + s + ' 元，', '生日又收到 ' + g + ' 元紅包，', '買了一台 ' + bike + ' 元的腳踏車，', n + '還剩下多少元？'],
      use: [String(s), String(g), String(bike)], steps: [step(s + ' ＋ ' + g, [s + ' － ' + g, s + ' ＋ ' + bike], '先算' + n + '一共有多少錢：存的錢加紅包。', { expr: s + ' ＋ ' + g }),
        step('□ － ' + bike, ['□ ＋ ' + bike, bike + ' － □'], '花掉腳踏車的錢，用減的。□ 是上一步算出來的錢。', { expr: '□ － ' + bike })],
      ans: s + g - bike, unit: '元', explain: s + ' ＋ ' + g + ' ＝ ' + (s + g) + '，' + (s + g) + ' － ' + bike + ' ＝ ' + (s + g - bike) });
  };
  G3[3] = function () { // 乘法
    var a = R(12, 125), n = R(3, 9), p = R(10, 25);
    if (a * n > 9999) return G3[3]();
    if (Math.random() < .5) {
      return P({ sents: ['一箱有 ' + a + ' 瓶水，', '學校買了 ' + n + ' 箱，', '學校一共買了幾瓶水？'],
        use: [String(a), String(n)], steps: [step(a + ' × ' + n, [a + ' ＋ ' + n, a + ' － ' + n], n + ' 箱，每箱 ' + a + ' 瓶，用乘的。', { expr: a + ' × ' + n })],
        ans: a * n, unit: '瓶', explain: a + ' × ' + n + ' ＝ ' + a * n });
    }
    var c = R(10, a * n - 5), k = R(3, 12);
    return P({ sents: ['一箱有 ' + a + ' 瓶水，', '學校買了 ' + n + ' 箱，', '運動會喝掉了 ' + c + ' 瓶。', '還剩下幾瓶水？'],
      use: [String(a), String(n), String(c)], steps: [step(a + ' × ' + n, [a + ' ＋ ' + n, a + ' － ' + n], '先算一共買了幾瓶：' + n + ' 箱，每箱 ' + a + ' 瓶。', { expr: a + ' × ' + n }),
        step('□ － ' + c, ['□ ＋ ' + c, '□ × ' + c], '喝掉了，用減的。', { expr: '□ － ' + c })],
      ans: a * n - c, unit: '瓶', explain: a + ' × ' + n + ' ＝ ' + a * n + '，' + a * n + ' － ' + c + ' ＝ ' + (a * n - c) });
  };
  G3[4] = function () { // 幾毫米
    var c = R(10, 30), m = R(1, 9), x = R(15, c * 10 + m - 10), s = R(25, 60);
    return P({ sents: ['一條緞帶長 ' + c + ' 公分 ' + m + ' 毫米，', '剪下 ' + x + ' 毫米做蝴蝶結，', '剩下的緞帶長幾毫米？'],
      use: [String(c), String(m), String(x)], steps: [step(c + ' × 10 ＋ ' + m, [c + ' ＋ ' + m, c + ' × 100 ＋ ' + m], '先換成毫米：1 公分 ＝ 10 毫米。', { expr: c + ' × 10 ＋ ' + m }),
        step('□ － ' + x, ['□ ＋ ' + x, x + ' － □'], '剪下來了，用減的。', { expr: '□ － ' + x })],
      ans: c * 10 + m - x, unit: '毫米', explain: c + ' 公分 ' + m + ' 毫米 ＝ ' + (c * 10 + m) + ' 毫米，' + (c * 10 + m) + ' － ' + x + ' ＝ ' + (c * 10 + m - x) });
  };
  G3[5] = function () { // 正方形和長方形
    if (Math.random() < .5) {
      var a = R(3, 25), k = R(2, 9);
      return P({ sents: ['一個正方形花圃，每邊長 ' + a + ' 公尺，', '沿著花圃圍一圈籬笆，籬笆長幾公尺？'],
        use: [String(a)], steps: [step(a + ' × 4', [a + ' × 2', a + ' ＋ 4'], '正方形有 4 條一樣長的邊，一圈就是 4 個 ' + a + '。', { expr: a + ' × 4' })],
        ans: a * 4, unit: '公尺', explain: a + ' × 4 ＝ ' + a * 4 });
    }
    var l = R(30, 90), w = R(15, l - 5), b = R(60, 80);
    return P({ sents: ['長方形桌面長 ' + l + ' 公分，', '寬 ' + w + ' 公分，', '沿著桌邊貼一圈彩帶，彩帶要幾公分？'],
      use: [String(l), String(w)], steps: [step(l + ' ＋ ' + w, [l + ' × ' + w, l + ' － ' + w], '先算一個長加一個寬。', { expr: l + ' ＋ ' + w }),
        step('□ × 2', ['□ × 4', '□ ＋ 2'], '長方形有 2 個長、2 個寬，所以要乘 2。', { expr: '□ × 2' })],
      ans: (l + w) * 2, unit: '公分', explain: '(' + l + ' ＋ ' + w + ') × 2 ＝ ' + (l + w) * 2 });
  };
  G3[6] = function () { // 除法
    if (Math.random() < .5) {
      var k = R(3, 6), q = R(4, 12), r = R(1, k - 1), n = k * q + r, p = R(300, 900);
      return P({ sents: [n + ' 個同學去露營，', '每 ' + k + ' 人睡一頂帳篷，', '至少要幾頂帳篷？'],
        use: [String(n), String(k)], steps: [step(n + ' ÷ ' + k, [n + ' × ' + k, n + ' － ' + k], '每 ' + k + ' 人一頂，用除的：' + n + ' ÷ ' + k + ' ＝ ' + q + ' … ' + r + '。', { val: q }),
        step('□ ＋ 1', ['□', '□ － 1'], '剩下的 ' + r + ' 人也要睡，要再多 1 頂。□ 是商 ' + q + '。', { expr: '□ ＋ 1' })],
      ans: q + 1, unit: '頂', explain: n + ' ÷ ' + k + ' ＝ ' + q + ' … ' + r + '，剩下 ' + r + ' 人還要 1 頂，' + q + ' ＋ 1 ＝ ' + (q + 1) });
    }
    var k2 = R(3, 9), q2 = R(3, 12), n2 = k2 * q2, age = R(7, 10);
    return P({ sents: [n2 + ' 顆糖平分給 ' + k2 + ' 個小朋友，', '每個小朋友分到幾顆糖？'],
      use: [String(n2), String(k2)], steps: [step(n2 + ' ÷ ' + k2, [n2 + ' × ' + k2, n2 + ' － ' + k2], '平分，用除的。', { expr: n2 + ' ÷ ' + k2 })],
      ans: q2, unit: '顆', explain: n2 + ' ÷ ' + k2 + ' ＝ ' + q2 });
  };
  G3[7] = function () { // 公升和毫升
    var L = R(1, 3), m = R(1, 9) * 100, x = R(2, 9) * 100 + R(0, 1) * 50, p = R(20, 35);
    if (x >= L * 1000 + m) return G3[7]();
    return P({ sents: ['一大瓶果汁有 ' + L + ' 公升 ' + m + ' 毫升，', '倒了 ' + x + ' 毫升給客人，', '瓶子裡還剩下幾毫升？'],
      use: [String(L), String(m), String(x)], steps: [step(L + ' × 1000 ＋ ' + m, [L + ' ＋ ' + m, L + ' × 100 ＋ ' + m], '先換成毫升：1 公升 ＝ 1000 毫升。', { expr: L + ' × 1000 ＋ ' + m }),
        step('□ － ' + x, ['□ ＋ ' + x, '□ × ' + x], '倒掉了，用減的。', { expr: '□ － ' + x })],
      ans: L * 1000 + m - x, unit: '毫升', explain: L + ' 公升 ' + m + ' 毫升 ＝ ' + (L * 1000 + m) + ' 毫升，' + (L * 1000 + m) + ' － ' + x + ' ＝ ' + (L * 1000 + m - x) });
  };
  G3[8] = function () { // 分數
    var d = R(5, 12), a = R(1, 3), b = R(1, d - a - 1), p = R(200, 500), n = who();
    if (Math.random() < .5) {
      return P({ sents: ['一盒蛋糕平分成 ' + d + ' 塊，', n + '吃了 ' + a + ' 塊，', '媽媽吃了 ' + b + ' 塊，', n + '和媽媽一共吃了這盒蛋糕的幾分之幾？'],
        use: [String(d), String(a), String(b)], steps: [step(a + ' ＋ ' + b, [a + ' × ' + b, d + ' － ' + a], '先算兩人一共吃了幾塊。', { expr: a + ' ＋ ' + b }),
          step('分母是 ' + d + '，分子是 □', ['分母是 □，分子是 ' + d, '分母是 ' + d + ' ＋ □'], '平分成 ' + d + ' 塊，分母就是 ' + d + '；吃了幾塊就是分子。', { val: (a + b) / d })],
        ans: (a + b) + '/' + d, unit: '', explain: a + ' ＋ ' + b + ' ＝ ' + (a + b) + ' 塊，是 ' + d + ' 塊中的 ' + (a + b) + ' 塊，就是 ' + (a + b) + '/' + d });
    }
    var k = R(2, 9);
    return P({ sents: ['一條繩子平分成 ' + d + ' 段，', '用掉了 ' + a + ' 段，', '用掉的是整條繩子的幾分之幾？'],
      use: [String(d), String(a)], steps: [step('分母是 ' + d + '，分子是 ' + a, ['分母是 ' + a + '，分子是 ' + d, '分母是 ' + d + '，分子是 ' + (d - a)], '平分成幾段是分母，用掉幾段是分子。', { val: a / d })],
      ans: a + '/' + d, unit: '', explain: '平分成 ' + d + ' 段，用掉 ' + a + ' 段，就是 ' + a + '/' + d });
  };
  G3[9] = function () { // 圓
    if (Math.random() < .5) {
      var d; do { d = 2 * R(5, 20); } while (d === 12);
      return P({ sents: ['一個圓形時鐘的直徑是 ' + d + ' 公分，', '這個時鐘的半徑是幾公分？'],
        use: [String(d)], steps: [step(d + ' ÷ 2', [d + ' × 2', d + ' － 2'], '直徑是半徑的 2 倍，半徑 ＝ 直徑 ÷ 2。', { expr: d + ' ÷ 2' })],
        ans: d / 2, unit: '公分', explain: d + ' ÷ 2 ＝ ' + d / 2 });
    }
    var r = R(2, 9), c = R(3, 5), pen = 2 * r * c + R(5, 20);
    return P({ sents: [c + ' 個一樣大的圓排成一排，', '一個接一個緊緊靠在一起，', '每個圓的半徑是 ' + r + ' 公分，', '排起來全長幾公分？'],
      use: [String(c), String(r)], steps: [step(r + ' × 2', [r + ' ÷ 2', r + ' ＋ 2'], '先算一個圓的直徑：半徑 × 2。', { expr: r + ' × 2' }),
        step('□ × ' + c, ['□ ＋ ' + c, '□ ÷ ' + c], c + ' 個圓排一排，全長是 ' + c + ' 個直徑。', { expr: '□ × ' + c })],
      ans: r * 2 * c, unit: '公分', explain: r + ' × 2 ＝ ' + r * 2 + '，' + r * 2 + ' × ' + c + ' ＝ ' + r * 2 * c });
  };
  G3.p1 = function () { return pick([G3[1], G3[2], G3[3], G3[4], G3[5]])(); };
  G3.p2 = function () { return pick([G3[5], G3[6], G3[7], G3[8], G3[9]])(); };

  /* =====================================================
   * 四上（翰林）
   * ===================================================== */
  var G4 = {};
  G4['99'] = w99;
  G4[1] = function () { // 一億以內的數
    var a = R(100, 999) * 1000 + R(0, 999), b = R(10, 99) * 1000, k = R(10, 30), ct = pick(['海港市', '山城市', '花園市']);
    return P({ sents: ['去年' + ct + '有 ' + a + ' 人，', '今年增加了 ' + b + ' 人，', '今年' + ct + '有多少人？'],
      use: [String(a), String(b)], steps: [step(a + ' ＋ ' + b, [a + ' － ' + b, a + ' ＋ ' + b + ' ＋ ' + b], '增加了，用加的。大數相加，位數要對齊。', { expr: a + ' ＋ ' + b })],
      ans: a + b, unit: '人', explain: a + ' ＋ ' + b + ' ＝ ' + (a + b) });
  };
  G4[2] = function () { // 乘法
    if (Math.random() < .5) {
      var a = R(12, 36), b = R(12, 48), n = R(2, 9), km = R(5, 30);
      return P({ sents: ['一箱有 ' + a + ' 盒，', '一盒有 ' + b + ' 顆，', '商店買了 ' + n + ' 箱，', '商店一共買了幾顆？'],
        use: [String(a), String(b), String(n)], steps: [step(a + ' × ' + b, [a + ' ＋ ' + b, a + ' × ' + n], '先算一箱有幾顆：' + a + ' 盒，每盒 ' + b + ' 顆。', { expr: a + ' × ' + b }),
          step('□ × ' + n, ['□ ＋ ' + n, '□ ÷ ' + n], '有 ' + n + ' 箱，再乘 ' + n + '。', { expr: '□ × ' + n })],
        ans: a * b * n, unit: '顆', explain: a + ' × ' + b + ' ＝ ' + a * b + '，' + a * b + ' × ' + n + ' ＝ ' + a * b * n });
    }
    var p = R(15, 85), m = R(21, 35), pay = (Math.floor(p * m / 1000) + 1) * 1000 + pick([0, 1000]), t = R(2, 5);
    return P({ sents: ['一張門票 ' + p + ' 元，', '全班 ' + m + ' 人都要買，', '老師付了 ' + pay + ' 元，', '可以找回多少元？'],
      use: [String(p), String(m), String(pay)], steps: [step(p + ' × ' + m, [p + ' ＋ ' + m, pay + ' ÷ ' + m], '先算門票一共多少錢。', { expr: p + ' × ' + m }),
        step(pay + ' － □', ['□ － ' + pay, pay + ' ＋ □'], '付的錢減掉門票錢，就是找回的錢。', { expr: pay + ' － □' })],
      ans: pay - p * m, unit: '元', explain: p + ' × ' + m + ' ＝ ' + p * m + '，' + pay + ' － ' + p * m + ' ＝ ' + (pay - p * m) });
  };
  G4[3] = function () { // 角度
    if (Math.random() < .5) {
      var a = 5 * R(14, 30), b = 5 * R(14, 30), r = R(5, 9);
      return P({ sents: ['一張圓形紙，', '從圓心剪成三塊扇形，', '其中兩塊的角是 ' + a + '° 和 ' + b + '°。', '第三塊的角是幾度？'],
        use: [String(a), String(b)], steps: [step(a + ' ＋ ' + b, [a + ' × ' + b, a + ' － ' + b], '先算兩個角合起來是幾度。', { expr: a + ' ＋ ' + b }),
          step('360 － □', ['180 － □', '□ － 360'], '圓心的一圈是周角 360°，減掉兩塊的角就是第三塊。', { expr: '360 － □' })],
        ans: 360 - a - b, unit: '度', explain: a + ' ＋ ' + b + ' ＝ ' + (a + b) + '，360 － ' + (a + b) + ' ＝ ' + (360 - a - b) });
    }
    var k = R(2, 11);
    return P({ sents: ['時鐘的分針從 12 開始，', '順時針走到 ' + k + '。', '分針轉了幾度？'],
      use: [String(k)], steps: [step(k + ' × 30', [k + ' × 12', '12 × 30'], '時鐘一圈 360°，有 12 格，每走一格是 30°。從 12 走到 ' + k + ' 是 ' + k + ' 格。', { expr: k + ' × 30' })],
      ans: k * 30, unit: '度', explain: k + ' × 30 ＝ ' + k * 30 });
  };
  G4[4] = function () { // 假分數與帶分數
    var d = R(3, 9), a = R(d + 1, 3 * d), b = R(1, 2 * d), e = R(2, 9);
    if (a % d === 0 || b % d === 0) return G4[4]();
    return P({ sents: ['姐姐有 ' + a + '/' + d + ' 公升牛奶，', '妹妹有 ' + b + '/' + d + ' 公升牛奶，', '兩人一共有幾公升牛奶？（用假分數回答）'],
      use: [a + '/' + d, b + '/' + d], steps: [step(a + '/' + d + ' ＋ ' + b + '/' + d, [a + '/' + d + ' － ' + b + '/' + d, a + ' ＋ ' + b + ' ＋ ' + d], '合起來用加的。同分母相加：分母不變，分子相加。', { expr: a + '/' + d + ' ＋ ' + b + '/' + d })],
      ans: (a + b) + '/' + d, unit: '公升', explain: a + '/' + d + ' ＋ ' + b + '/' + d + ' ＝ ' + (a + b) + '/' + d });
  };
  G4[5] = function () { // 公里
    var k = R(1, 4), m = R(1, 9) * 100 + R(0, 9) * 10, x = R(2, 9) * 100, h = R(6, 10);
    return P({ sents: ['家到學校是 ' + k + ' 公里 ' + m + ' 公尺，', '學校到圖書館是 ' + x + ' 公尺，', '從家經過學校到圖書館，一共是幾公尺？'],
      use: [String(k), String(m), String(x)], steps: [step(k + ' × 1000 ＋ ' + m, [k + ' ＋ ' + m, k + ' × 100 ＋ ' + m], '先換成公尺：1 公里 ＝ 1000 公尺。', { expr: k + ' × 1000 ＋ ' + m }),
        step('□ ＋ ' + x, ['□ － ' + x, '□ × ' + x], '兩段路合起來，用加的。', { expr: '□ ＋ ' + x })],
      ans: k * 1000 + m + x, unit: '公尺', explain: k + ' 公里 ' + m + ' 公尺 ＝ ' + (k * 1000 + m) + ' 公尺，' + (k * 1000 + m) + ' ＋ ' + x + ' ＝ ' + (k * 1000 + m + x) });
  };
  G4[6] = function () { // 除法
    var k = R(12, 36), q = pick([R(101, 309), R(20, 99)]), n = k * q, p = R(80, 250), t = R(20, 90);
    if (n > 9999) return G4[6]();
    if (Math.random() < .5) {
      return P({ sents: ['果園採了 ' + n + ' 顆橘子，', '每 ' + k + ' 顆裝一盒，', '可以裝成幾盒？'],
        use: [String(n), String(k)], steps: [step(n + ' ÷ ' + k, [n + ' × ' + k, n + ' － ' + k], '每 ' + k + ' 顆裝一盒，用除的。', { expr: n + ' ÷ ' + k })],
        ans: q, unit: '盒', explain: n + ' ÷ ' + k + ' ＝ ' + q });
    }
    return P({ sents: ['果園採了 ' + n + ' 顆橘子，', '每 ' + k + ' 顆裝一盒，', '每盒賣 ' + p + ' 元。', '全部賣完可以賣多少元？'],
      use: [String(n), String(k), String(p)], steps: [step(n + ' ÷ ' + k, [n + ' × ' + k, n + ' － ' + k], '先算可以裝成幾盒。', { expr: n + ' ÷ ' + k }),
        step('□ × ' + p, ['□ ÷ ' + p, '□ ＋ ' + p], '每盒 ' + p + ' 元，盒數 × ' + p + '。', { expr: '□ × ' + p })],
      ans: q * p, unit: '元', explain: n + ' ÷ ' + k + ' ＝ ' + q + ' 盒，' + q + ' × ' + p + ' ＝ ' + q * p });
  };
  G4[7] = function () { // 三角形
    if (Math.random() < .5) {
      var a = R(5, 15), b = R(3, 2 * a - 1);
      if (b === a) b++;
      var c = Math.round(Math.sqrt(a * a - b * b / 4));
      if (c < 1 || c === a || c === b) return G4[7]();
      return P({ sents: ['一個等腰三角形，', '兩個腰都是 ' + a + ' 公分，', '底邊是 ' + b + ' 公分，', '這個三角形的周長是幾公分？'],
        use: [String(a), String(b)], steps: [step(a + ' × 2', [a + ' × 3', a + ' ＋ 2'], '等腰三角形有 2 個腰一樣長。', { expr: a + ' × 2' }),
          step('□ ＋ ' + b, ['□ × ' + b, '□ ＋ ' + a], '再加上底邊，就是一圈的長度。', { expr: '□ ＋ ' + b })],
        ans: 2 * a + b, unit: '公分', explain: a + ' × 2 ＋ ' + b + ' ＝ ' + (2 * a + b) });
    }
    var s = R(6, 20), k = Math.round(s * 0.87);
    return P({ sents: ['一個正三角形的周長是 ' + 3 * s + ' 公分，', '這個正三角形每一邊是幾公分？'],
      use: [String(3 * s)], steps: [step(3 * s + ' ÷ 3', [3 * s + ' ÷ 2', 3 * s + ' × 3'], '正三角形 3 個邊一樣長，周長 ÷ 3。', { expr: 3 * s + ' ÷ 3' })],
      ans: s, unit: '公分', explain: 3 * s + ' ÷ 3 ＝ ' + s });
  };
  G4[8] = function () { // 兩步驟問題
    var a = R(2, 6), b = R(12, 35), c = pick([100, 200, 500]), k = R(3, 9);
    if (a * b >= c) return G4[8]();
    return P({ sents: ['哥哥買了 ' + a + ' 枝 ' + b + ' 元的筆，', '付了 ' + c + ' 元。', '可以找回多少元？'],
      use: [String(a), String(b), String(c)], steps: [step(a + ' × ' + b, [a + ' ＋ ' + b, c + ' － ' + a], '先算買筆一共花多少錢。', { expr: a + ' × ' + b }),
        step(c + ' － □', ['□ － ' + c, c + ' ＋ □'], '付的錢減掉花的錢，就是找回的錢。', { expr: c + ' － □' })],
      ans: c - a * b, unit: '元', explain: c + ' － ' + a + ' × ' + b + ' ＝ ' + c + ' － ' + a * b + ' ＝ ' + (c - a * b) });
  };
  G4[9] = function () { // 二位小數
    var a = R(120, 160), b = R(5, 30), age = R(6, 9);
    if (Math.random() < .5) {
      return P({ sents: ['小明的身高是 ' + d2(a / 100) + ' 公尺，', '弟弟比小明矮 ' + d2(b / 100) + ' 公尺，', '弟弟的身高是幾公尺？'],
        use: [d2(a / 100), d2(b / 100)], steps: [step(d2(a / 100) + ' － ' + d2(b / 100), [d2(a / 100) + ' ＋ ' + d2(b / 100), d2(a / 100) + ' × ' + d2(b / 100)], '比小明矮，用減的。小數點要對齊。', { expr: d2(a / 100) + ' － ' + d2(b / 100) })],
        ans: d2((a - b) / 100), unit: '公尺', explain: d2(a / 100) + ' － ' + d2(b / 100) + ' ＝ ' + d2((a - b) / 100) });
    }
    var v = R(150, 250), x = R(30, 90), y = R(20, 80), k = 3;
    return P({ sents: ['水壺裡有 ' + d2(v / 100) + ' 公升水，', '喝掉了 ' + d2(x / 100) + ' 公升，', '又倒進 ' + d2(y / 100) + ' 公升，', '水壺裡現在有幾公升水？'],
      use: [d2(v / 100), d2(x / 100), d2(y / 100)], steps: [step(d2(v / 100) + ' － ' + d2(x / 100), [d2(v / 100) + ' ＋ ' + d2(x / 100), d2(x / 100) + ' ＋ ' + d2(y / 100)], '先算喝掉以後剩多少。', { expr: d2(v / 100) + ' － ' + d2(x / 100) }),
        step('□ ＋ ' + d2(y / 100), ['□ － ' + d2(y / 100), '□ × ' + d2(y / 100)], '又倒進去，用加的。', { expr: '□ ＋ ' + d2(y / 100) })],
      ans: d2((v - x + y) / 100), unit: '公升', explain: d2(v / 100) + ' － ' + d2(x / 100) + ' ＋ ' + d2(y / 100) + ' ＝ ' + d2((v - x + y) / 100) });
  };
  G4[10] = function () { // 統計圖表
    var a = R(20, 28), b = R(20, 32), c = R(a + 2, 35), u = pick([2, 5]);
    if (b === a || b === c) return G4[10]();
    return P({ sents: ['四年級一班有 ' + a + ' 人，', '二班有 ' + c + ' 人。', '二班比一班多幾人？'],
      use: [String(c), String(a)], steps: [step(c + ' － ' + a, [c + ' ＋ ' + a, c + ' × ' + a], '比較二班和一班，大的減小的。', { expr: c + ' － ' + a })],
      ans: c - a, unit: '人', explain: c + ' － ' + a + ' ＝ ' + (c - a) });
  };
  G4.p1 = function () { return pick([G4[1], G4[2], G4[3], G4[4], G4[5]])(); };
  G4.p2 = function () { return pick([G4[6], G4[7], G4[8], G4[9], G4[10]])(); };

  /* =====================================================
   * 五上（翰林）
   * ===================================================== */
  var G5 = {};
  G5['99'] = w99;
  G5[1] = function () { // 折線圖
    var a = R(12, 18), b = R(16, 24), c = R(20, 30);
    if (c <= a) c = a + 3;
    if (b === a || b === c) return G5[1]();
    return P({ sents: ['看折線圖：一月的平均氣溫是 ' + a + ' 度，', '三月是 ' + c + ' 度。', '三月比一月高了幾度？'],
      use: [String(c), String(a)], steps: [step(c + ' － ' + a, [c + ' ＋ ' + a, c + ' × ' + a], '比較三月和一月，大的減小的。', { expr: c + ' － ' + a })],
      ans: c - a, unit: '度', explain: c + ' － ' + a + ' ＝ ' + (c - a) });
  };
  G5[2] = function () { // 倍數與因數
    var k = R(4, 12), n = k * R(3, 12), p = R(30, 90), name = who();
    return P({ sents: ['一包貼紙有 ' + k + ' 張，', name + '買了好幾包，', '剛好一共 ' + n + ' 張，', name + '買了幾包？'],
      use: [String(n), String(k)], steps: [step(n + ' ÷ ' + k, [n + ' × ' + k, n + ' － ' + k], n + ' 是 ' + k + ' 的倍數，' + n + ' ÷ ' + k + ' 就是包數。', { expr: n + ' ÷ ' + k })],
      ans: n / k, unit: '包', explain: n + ' ÷ ' + k + ' ＝ ' + n / k });
  };
  G5[3] = function () { // 三角形內角
    var a = R(30, 80), b = R(30, 150 - a), s = R(5, 15);
    return P({ sents: ['一個三角形有兩個角是 ' + a + '° 和 ' + b + '°，', '第三個角是幾度？'],
      use: [String(a), String(b)], steps: [step(a + ' ＋ ' + b, [a + ' × ' + b, a + ' － ' + b], '先算兩個角合起來。', { expr: a + ' ＋ ' + b }),
        step('180 － □', ['360 － □', '□ － 180'], '三角形三個角合起來是 180°。', { expr: '180 － □' })],
      ans: 180 - a - b, unit: '度', explain: '180 － ' + a + ' － ' + b + ' ＝ ' + (180 - a - b) });
  };
  G5[4] = function () { // 公倍數與公因數
    if (Math.random() < .5) {
      var a, b; do { a = pick([4, 6, 8, 9, 10, 12, 15]); b = pick([6, 8, 10, 12, 15, 18, 20]); } while (a === b || lcm(a, b) === a * b && Math.random() < .5 || lcm(a, b) > 90);
      var k = R(2, 5);
      return P({ sents: ['公車每 ' + a + ' 分鐘開一班，', '捷運每 ' + b + ' 分鐘開一班，', '早上兩種車同時出發，', '至少再過幾分鐘，兩種車會再同時出發？'],
        use: [String(a), String(b)], steps: [step('求 ' + a + ' 和 ' + b + ' 的最小公倍數', ['求 ' + a + ' 和 ' + b + ' 的最大公因數', a + ' ＋ ' + b], '同時出發的時間要同時是 ' + a + ' 和 ' + b + ' 的倍數，最早一次就是最小公倍數。', { val: lcm(a, b) })],
        ans: lcm(a, b), unit: '分鐘', explain: a + ' 和 ' + b + ' 的最小公倍數是 ' + lcm(a, b) });
    }
    var g = R(3, 12), x = g * R(2, 8), y = g * R(2, 8), c = R(2, 5);
    if (x === y || gcd(x, y) !== g) return G5[4]();
    return P({ sents: ['有兩條緞帶，一條長 ' + x + ' 公分，', '另一條長 ' + y + ' 公分，', '要剪成一樣長的小段，都沒有剩下，', '每段最長是幾公分？'],
      use: [String(x), String(y)], steps: [step('求 ' + x + ' 和 ' + y + ' 的最大公因數', ['求 ' + x + ' 和 ' + y + ' 的最小公倍數', x + ' － ' + y], '剪開、沒有剩下，每段長度要同時是兩條的因數，最長就是最大公因數。', { val: g })],
      ans: g, unit: '公分', explain: x + ' 和 ' + y + ' 的最大公因數是 ' + g });
  };
  G5[5] = function () { // 立體形體
    var n = R(3, 9), h = R(5, 20), edge = Math.random() < .5;
    return P({ sents: ['一個 ' + n + ' 角柱的積木。', '這個積木有幾' + (edge ? '條邊' : '個頂點') + '？'],
      use: [String(n)], steps: [step(edge ? n + ' × 3' : n + ' × 2', edge ? [n + ' × 2', n + ' ＋ 2'] : [n + ' × 3', n + ' ＋ 2'], edge ? n + ' 角柱上、下底各有 ' + n + ' 條邊，旁邊還有 ' + n + ' 條，一共 ' + n + ' × 3。' : n + ' 角柱上、下底各有 ' + n + ' 個頂點，一共 ' + n + ' × 2。', { expr: edge ? n + ' × 3' : n + ' × 2' })],
      ans: edge ? 3 * n : 2 * n, unit: edge ? '條' : '個', explain: (edge ? n + ' × 3 ＝ ' + 3 * n : n + ' × 2 ＝ ' + 2 * n) });
  };
  G5[6] = function () { // 整數四則（平均）
    var a = R(70, 98), b = R(70, 98), c, t = R(30, 50);
    do { c = R(70, 98); } while ((a + b + c) % 3 !== 0);
    return P({ sents: ['小華三次數學考試，', '分別考了 ' + a + ' 分、' + b + ' 分和 ' + c + ' 分，', '小華三次考試的平均是幾分？'],
      use: [String(a), String(b), String(c)], steps: [step(a + ' ＋ ' + b + ' ＋ ' + c, [a + ' × ' + b, a + ' ＋ ' + b], '先算三次一共幾分。', { expr: a + ' ＋ ' + b + ' ＋ ' + c }),
        step('□ ÷ 3', ['□ × 3', '□ ÷ 2'], '平均 ＝ 總分 ÷ 次數，三次就除以 3。', { expr: '□ ÷ 3' })],
      ans: (a + b + c) / 3, unit: '分', explain: '(' + a + ' ＋ ' + b + ' ＋ ' + c + ') ÷ 3 ＝ ' + (a + b + c) / 3 });
  };
  G5[7] = function () { // 異分母加減
    var b = pick([2, 3, 4, 5]), d = pick([3, 4, 6, 8]), a, c, k = R(6, 12);
    if (b === d) return G5[7]();
    a = R(1, b - 1); c = R(1, d - 1);
    if (a / b <= c / d) return G5[7]();
    var num = a * d - c * b, den = b * d;
    return P({ sents: ['媽媽買了 ' + a + '/' + b + ' 公斤的糖，', '做蛋糕用掉了 ' + c + '/' + d + ' 公斤，', '還剩下幾公斤糖？'],
      use: [a + '/' + b, c + '/' + d], steps: [step(a + '/' + b + ' － ' + c + '/' + d, [a + '/' + b + ' ＋ ' + c + '/' + d, c + '/' + d + ' － ' + a + '/' + b], '用掉了，用減的。分母不一樣要先通分。', { expr: a + '/' + b + ' － ' + c + '/' + d })],
      ans: sfrac(num, den), unit: '公斤', explain: a + '/' + b + ' － ' + c + '/' + d + ' ＝ ' + a * d + '/' + den + ' － ' + c * b + '/' + den + ' ＝ ' + sfrac(num, den) });
  };
  G5[8] = function () { // 面積
    var b = R(6, 20), h = R(4, 16), s = R(b + 1, b + 8);
    if ((b * h) % 2) return G5[8]();
    return P({ sents: ['一塊三角形的布，底是 ' + b + ' 公分，', '高是 ' + h + ' 公分，', '這塊布的面積是幾平方公分？'],
      use: [String(b), String(h)], steps: [step(b + ' × ' + h, [b + ' ＋ ' + h, '(' + b + ' ＋ ' + h + ') × 2'], '三角形面積 ＝ 底 × 高 ÷ 2，先算底 × 高。', { expr: b + ' × ' + h }),
        step('□ ÷ 2', ['□ × 2', '□ ÷ 4'], '三角形是平行四邊形的一半，要 ÷ 2。', { expr: '□ ÷ 2' })],
      ans: b * h / 2, unit: '平方公分', explain: b + ' × ' + h + ' ÷ 2 ＝ ' + b * h / 2 });
  };
  G5[9] = function () { // 乘以幾分之一
    var den = pick([3, 4, 5, 6]), num = R(1, den - 1), n = den * R(4, 8), t = R(2, 4);
    return P({ sents: ['班上有 ' + n + ' 個學生，', '其中 ' + num + '/' + den + ' 是男生，', '男生有幾人？'],
      use: [String(n), num + '/' + den], steps: [step(n + ' × ' + num + '/' + den, [n + ' ÷ ' + num + '/' + den, n + ' － ' + num + '/' + den], n + ' 人的 ' + num + '/' + den + '，用乘的。', { expr: n + ' × ' + num + '/' + den })],
      ans: n * num / den, unit: '人', explain: n + ' × ' + num + '/' + den + ' ＝ ' + n * num / den });
  };
  G5.f9 = G5[9];
  G5[9] = function () { return Math.random() < .5 ? wBase(true) : G5.f9(); };
  G5[10] = function () { // 扇形
    var n = pick([3, 4, 5, 6, 8, 9, 10, 12]), d = R(20, 40);
    return P({ sents: ['一個圓形披薩，', '平分成 ' + n + ' 塊一樣大的扇形。', '每一塊的圓心角是幾度？'],
      use: [String(n)], steps: [step('360 ÷ ' + n, ['180 ÷ ' + n, n + ' × 360'], '一整個圓的圓心角是 360°，平分成 ' + n + ' 塊。', { expr: '360 ÷ ' + n })],
      ans: 360 / n, unit: '度', explain: '360 ÷ ' + n + ' ＝ ' + 360 / n });
  };
  G5.p1 = function () { return pick([G5[1], G5[2], G5[3], G5[4], G5[5]])(); };
  G5.p2 = function () { return pick([G5[6], G5[7], G5[8], G5[9], G5[10]])(); };

  /* =====================================================
   * 六上（翰林）
   * ===================================================== */
  var G6 = {};
  G6['99'] = w99;
  G6[1] = G5[4]; // 最大公因數與最小公倍數
  G6[2] = function () { // 分數除法
    var d = pick([4, 6, 8, 10, 12]), c = R(1, 2), cups = R(2, 9), k = R(3, 9);
    var tot = sfrac(c * cups, d), each = sfrac(c, d);
    if (tot.indexOf('/') < 0 || each === tot) return G6[2]();
    return P({ sents: ['一瓶果汁有 ' + tot + ' 公升，', '每杯倒 ' + each + ' 公升，', '這瓶果汁可以倒成幾杯？'],
      use: [tot, each], steps: [step(tot + ' ÷ ' + each, [tot + ' × ' + each, each + ' ÷ ' + tot], '一瓶裡面有幾個 ' + each + '，用除的。', { expr: tot + ' ÷ ' + each })],
      ans: cups, unit: '杯', explain: tot + ' ÷ ' + each + ' ＝ ' + cups });
  };
  G6[3] = function () { // 小數除法
    var b = R(2, 9) / 10 + (Math.random() < .4 ? R(1, 2) : 0), k = R(3, 12), a = +(b * k).toFixed(2), w = R(2, 9);
    return P({ sents: ['一條緞帶長 ' + d2(a) + ' 公尺，', '每 ' + d2(b) + ' 公尺剪成一段，', '可以剪成幾段？'],
      use: [d2(a), d2(b)], steps: [step(d2(a) + ' ÷ ' + d2(b), [d2(a) + ' × ' + d2(b), d2(a) + ' － ' + d2(b)], '每 ' + d2(b) + ' 公尺一段，用除的。除數是小數，兩邊的小數點一起移。', { expr: d2(a) + ' ÷ ' + d2(b) })],
      ans: k, unit: '段', explain: d2(a) + ' ÷ ' + d2(b) + ' ＝ ' + k });
  };
  G6[4] = function () { // 比與比值
    var a = R(2, 7), b = R(2, 7), k = R(3, 8), x = R(20, 40);
    if (a === b || gcd(a, b) !== 1) return G6[4]();
    return P({ sents: ['班上男生和女生人數的比是 ' + a + ':' + b + '，', '女生有 ' + b * k + ' 人，', '男生有幾人？'],
      use: [String(a), String(b), String(b * k)], steps: [step(b * k + ' ÷ ' + b, [b * k + ' × ' + b, b * k + ' ÷ ' + a], '女生 ' + b * k + ' 人是 ' + b + ' 份，先算 1 份是幾人。', { expr: b * k + ' ÷ ' + b }),
        step('□ × ' + a, ['□ ÷ ' + a, '□ ＋ ' + a], '男生是 ' + a + ' 份，1 份 × ' + a + '。', { expr: '□ × ' + a })],
      ans: a * k, unit: '人', explain: b * k + ' ÷ ' + b + ' ＝ ' + k + '，' + k + ' × ' + a + ' ＝ ' + a * k });
  };
  /* 六上 5 兩量關係：基準量和比較量（孩子最不會的）。先選誰是基準量，再選算法 */
  function wBase(multOnly) {
    var c = pick(root.MathQ._g56.BC), fr, B;
    do {
      fr = pick([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8]]);
      B = fr[1] * R(Math.ceil(c[8][0] / fr[1]), Math.floor(c[8][1] / fr[1]));
    } while (B < c[8][0]);
    var r = fr[0] + '/' + fr[1], C = B / fr[1] * fr[0], u = c[7], stmt = c[2].replace('R', r);
    var who = { q: '「' + stmt + '」，誰是基準量？', opts: shuffle([c[1], c[0], r]), ans: c[1], noWork: true, why: '「是」後面、「的」前面的是基準量（拿來比的標準）：' + c[1] + '。' };
    if (multOnly !== true && Math.random() < .55) { // 知道比較量，求基準量：用除的（六年級才學）
      who.val = C;
      return P({ sents: [c[4].replace('X', C) + '，', stmt + '。', c[6]], use: [String(C), r],
        steps: [who, step(C + ' ÷ ' + r, [C + ' × ' + r, r + ' ÷ ' + C], '要求的是基準量（' + c[1] + '），知道的是比較量，用除的：比較量 ÷ ' + r + '。', { expr: C + ' ÷ ' + r, q: '要怎麼算？' })],
        ans: B, unit: u, explain: '基準量是' + c[1] + '。' + C + ' ÷ ' + r + ' ＝ ' + C + ' × ' + fr[1] + '/' + fr[0] + ' ＝ ' + B });
    }
    who.val = B;
    return P({ sents: [c[3].replace('X', B) + '，', stmt + '。', c[5]], use: [String(B), r],
      steps: [who, step(B + ' × ' + r, [B + ' ÷ ' + r, B + ' － ' + r], '知道的是基準量（' + c[1] + '），求比較量，用乘的：基準量 × ' + r + '。', { expr: B + ' × ' + r, q: '要怎麼算？' })],
      ans: C, unit: u, explain: '基準量是' + c[1] + '。' + B + ' × ' + r + ' ＝ ' + C });
  }
  G6.d5 = function () { // 打折

    var p = R(4, 12) * 100, off = pick([['八', 0.8], ['九', 0.9], ['七', 0.7], ['六', 0.6]]), pay = Math.ceil(p * off[1] / 500) * 500 + 500, pk = R(2, 5);
    var cost = Math.round(p * off[1]);
    return P({ sents: ['一個書包原價 ' + p + ' 元，', '打' + off[0] + '折賣，', '媽媽付了 ' + pay + ' 元，', '可以找回多少元？'],
      use: [String(p), String(pay)], steps: [step(p + ' × ' + off[1], [p + ' × ' + off[1] * 10, p + ' － ' + off[1] * 10], '打' + off[0] + '折就是原價 × ' + off[1] + '。', { expr: p + ' × ' + off[1] }),
        step(pay + ' － □', ['□ － ' + pay, pay + ' ＋ □'], '付的錢減掉書包的錢。', { expr: pay + ' － □' })],
      ans: pay - cost, unit: '元', explain: p + ' × ' + off[1] + ' ＝ ' + cost + '，' + pay + ' － ' + cost + ' ＝ ' + (pay - cost) });
  };
  G6[5] = function () { return Math.random() < .7 ? wBase() : G6.d5(); };
  G6[6] = function () { // 圓周長
    var d = R(2, 20), t = R(3, 9);
    if (Math.random() < .5) {
      return P({ sents: ['一個圓形花圃的直徑是 ' + d + ' 公尺，', '沿著花圃圍一圈籬笆，籬笆長幾公尺？（圓周率用 3.14）'],
        use: [String(d)], opt: ['3.14'], steps: [step(d + ' × 3.14', [d + ' × 2 × 3.14', d + ' ÷ 3.14'], '圓周長 ＝ 直徑 × 圓周率。', { expr: d + ' × 3.14' })],
        ans: d2(d * 3.14), unit: '公尺', explain: d + ' × 3.14 ＝ ' + d2(d * 3.14) });
    }
    d = 2 * R(2, 10);
    return P({ sents: ['一個半圓形的桌子，直徑是 ' + d + ' 公寸，', '這張桌子一圈（含直的那一邊）長幾公寸？（圓周率用 3.14）'],
      use: [String(d)], opt: ['3.14'], steps: [step(d + ' × 3.14 ÷ 2', [d + ' × 3.14', d + ' × 3.14 × 2'], '半圓的彎曲部分是圓周長的一半。', { expr: d + ' × 3.14 ÷ 2' }),
        step('□ ＋ ' + d, ['□', '□ × ' + d], '還要加上直的那一邊（直徑）。', { expr: '□ ＋ ' + d })],
      ans: d2(d * 3.14 / 2 + d), unit: '公寸', explain: d + ' × 3.14 ÷ 2 ＋ ' + d + ' ＝ ' + d2(d * 3.14 / 2 + d) });
  };
  G6[7] = function () { // 比例尺
    var s = pick([100, 200, 500, 1000, 2000]), x = R(2, 15), k = R(3, 8);
    return P({ sents: ['一張地圖的比例尺是 1:' + s + '，', '圖上公園到學校的距離是 ' + x + ' 公分，', '公園到學校實際是幾公尺？'],
      use: [String(s), String(x)], opt: ['1'], steps: [step(x + ' × ' + s, [x + ' ÷ ' + s, x + ' ＋ ' + s], '圖上 1 公分代表實際 ' + s + ' 公分，先算實際是幾公分。', { expr: x + ' × ' + s }),
        step('□ ÷ 100', ['□ × 100', '□ ÷ 1000'], '再把公分換成公尺：100 公分 ＝ 1 公尺。', { expr: '□ ÷ 100' })],
      ans: x * s / 100, unit: '公尺', explain: x + ' × ' + s + ' ＝ ' + x * s + ' 公分 ＝ ' + x * s / 100 + ' 公尺' });
  };
  G6[8] = function () { // 植樹問題
    var g = pick([5, 10, 20, 25]), L = g * R(4, 20), p = R(50, 200);
    return P({ sents: ['一條步道長 ' + L + ' 公尺，', '每隔 ' + g + ' 公尺種一棵樹，', '兩端都要種，', '一共要種幾棵樹？'],
      use: [String(L), String(g)], steps: [step(L + ' ÷ ' + g, [L + ' × ' + g, L + ' － ' + g], '先算有幾個間隔。', { expr: L + ' ÷ ' + g }),
        step('□ ＋ 1', ['□', '□ － 1'], '兩端都種，樹會比間隔多 1 棵。', { expr: '□ ＋ 1' })],
      ans: L / g + 1, unit: '棵', explain: L + ' ÷ ' + g + ' ＝ ' + L / g + ' 個間隔，' + L / g + ' ＋ 1 ＝ ' + (L / g + 1) });
  };
  G6.p1 = function () { return pick([G6[1], G6[2], G6[3], G6[4]])(); };
  G6.p2 = function () { return pick([G6[5], G6[6], G6[7], G6[8]])(); };

  /* 三個選項要都不一樣、用得到的數字都要在題目裡：不合就重出 */
  function ok(p) {
    var toks = p.sents.join('').match(/\d+(?:\.\d+)?(?:\/\d+)?/g) || [];
    var threeOpts = p.steps.every(function (st) { return st.opts.length === 3 && st.opts.filter(function (o, i) { return st.opts.indexOf(o) === i; }).length === 3; });
    return threeOpts && p.use.every(function (v) { return toks.indexOf(v) >= 0; });
  }
  [G3, G4, G5, G6].forEach(function (G) {
    Object.keys(G).forEach(function (k) {
      var raw = G[k];
      G[k] = function () { for (var i = 0; i < 50; i++) { var p = raw(); if (ok(p)) return p; } return raw(); };
    });
  });

  root.MathQ = root.MathQ || {};
  root.MathQ.WORD = { 3: G3, 4: G4, 5: G5, 6: G6 };
})(typeof window !== 'undefined' ? window : globalThis);
