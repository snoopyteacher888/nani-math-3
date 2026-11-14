// 執行：node tests/questions.test.js
const assert = require('assert');
require('../js/questions.js');
require('../js/questions56.js');
require('../js/questions4.js');
require('../js/wordq.js');
const Q = globalThis.MathQ;

// 國字
const cases = { 3005: '三千零五', 3050: '三千零五十', 3500: '三千五百', 3205: '三千二百零五', 1010: '一千零一十', 10000: '一萬', 9999: '九千九百九十九', 15: '十五', 7040: '七千零四十', 100: '一百' };
for (const [n, s] of Object.entries(cases)) assert.strictEqual(Q.zh(+n), s, n);
assert.strictEqual(Q.literal(3005), 305);

const calc = (a, op, b) => op === '＋' ? a + b : op === '－' ? a - b : a * b;
const N = 3000;
// 九九口訣
const chants = { '7,8': '七八五十六', '8,7': '七八五十六', '3,3': '三三得九', '2,5': '二五一十', '9,9': '九九八十一', '2,6': '二六十二', '4,5': '四五二十', '1,7': '一七得七' };
for (const [k, v] of Object.entries(chants)) { const [a, b] = k.split(',').map(Number); assert.strictEqual(Q.chant(a, b), v, k); }

for (const u of Q.UNITS.concat(Q.G4, Q.G5, Q.G6)) for (const s of u.stages) {
  if (s.mode === 'nine') continue; // 九九大冒險不用出題程式
  if (s.mode === 'mole') { // 打地鼠：每條規則的地鼠都要對，該打的要多一點
    for (let t = 0; t < 50; t++) {
      const ws = s.waves(); assert.ok(ws.length >= 1 && ws.length <= 3, s.id + ' waves');
      for (const w of ws) {
        assert.ok(w.ask && w.say && w.banner && w.ref, s.id + ' rule text');
        let ok = 0;
        for (let i = 0; i < 300; i++) {
          const m = w.gen(); assert.ok(m.why, s.id + ' why');
          if (['prime', 'even', 'odd', 'mul', 'fac'].includes(w.kind)) assert.ok(Number.isInteger(m.n) && m.n >= 1 && m.n <= 9999, s.id + ' mole n ' + m.n);
          let want;
          if (w.kind === 'improper' || w.kind === 'proper') { const [nu, de] = m.n.split('/').map(Number); assert.ok(nu >= 1 && de >= 2); want = w.kind === 'improper' ? nu >= de : nu < de; }
          else if (w.kind === 'gt' || w.kind === 'lt') { assert.ok(/^\d+\.\d{1,2}$/.test(m.n), m.n); const v = Math.round(parseFloat(m.n) * 100), K = Math.round(w.k * 100); assert.ok(v > 0); want = w.kind === 'gt' ? v > K : v < K; }
          if (w.kind === 'prime') { want = m.n > 1; for (let d = 2; d * d <= m.n; d++) if (m.n % d === 0) want = false; }
          else if (w.kind === 'even') want = m.n % 2 === 0;
          else if (w.kind === 'odd') want = m.n % 2 === 1;
          else if (w.kind === 'mul') { want = m.n % w.k === 0; assert.ok(m.n <= 99); }
          else if (w.kind === 'fac') { want = w.k % m.n === 0; assert.ok(m.n <= w.k); }
          assert.strictEqual(m.ok, want, s.id + ' ' + w.kind + w.k + ' ' + m.n);
          const mt = m.why.match(/(\d+) ＝ (\d+) × (\d+)/); if (mt) assert.strictEqual(mt[2] * mt[3], +mt[1], m.why);
          const dv = m.why.match(/(\d+) ÷ (\d+) ＝ (\d+) … (\d+)/); if (dv) assert.strictEqual(dv[2] * dv[3] + +dv[4], +dv[1], m.why);
          if (m.ok) ok++;
        }
        assert.ok(ok / 300 > .4 && ok / 300 < .75, s.id + ' ' + w.kind + ' 該打的比例 ' + ok / 300);
      }
    }
    continue;
  }
  for (let i = 0; i < N; i++) {
    if (s.gen) {
      const q = s.gen(), k = q.kind || 'run';
      assert.ok(q.text && q.say !== undefined && q.answer && q.hint, s.id + ' missing fields');
      if (s.mode === 'run') assert.ok(k === 'run', s.id + ' 跑酷關卡只能出有選項的題目，不能是 ' + k);
      if (s.mode === 'round') assert.ok(k !== 'run', s.id + ' 小遊戲關卡的題目要有 kind');
      if (k === 'run' || k === 'quiz') {
        assert.ok(q.options.length >= 2, s.id + ' options');
        assert.strictEqual(new Set(q.options).size, q.options.length, s.id + ' dup ' + q.options);
        assert.ok(q.options.includes(q.answer), s.id + ' no answer');
        if (!/^(可以|不可以|奇數|偶數|毫升|公升|因數|倍數|最大公因數|最小公倍數|互質|不互質|.色)$/.test(q.answer)) assert.ok(q.options.length >= 3, s.id + ' needs 3+ options ' + q.text);
      }
      if (k === 'sort') assert.ok(q.bins.includes(q.answer), s.id + ' bin');
      if (k === 'tap') assert.ok(q.svg.includes('data-hit="' + q.answer + '"'), s.id + ' hit');
      if (k === 'fill') assert.ok(q.fields.every(f => Number.isInteger(f.ans) && f.ans >= 0 && f.ans < 10000), s.id + ' fill');
      if (k === 'paint') assert.ok(q.paint.k > 0 && q.paint.k < q.paint.n, s.id + ' paint');
    } else {
      const p = s.make();
      assert.strictEqual(calc(p.a, p.op, p.b), p.ans, s.id + ' wrong answer');
      assert.ok(p.ans > 0 && p.ans <= 9999, s.id + ' range ' + p.ans);
      assert.ok(p.mistakes.length >= 1);
      p.mistakes.forEach(m => assert.ok(m.why && Number.isInteger(m.v), s.id + ' mistake'));
      assert.ok(p.mistakes.some(m => m.v !== p.ans && m.v > 0), s.id + ' needs a real mistake');
      if (s.mode === 'spot') {
        assert.ok(p.shown > 0, s.id + ' shown');
        assert.strictEqual(p.shown === p.ans, p.why === null, s.id + ' why matches');
      }
    }
  }
  if (s.mode === 'nine' || s.mode === 'mole') continue;
  const ex = s.gen ? s.gen() : s.make();
  console.log(s.id, s.mode, '|', ex.text || (ex.a + ' ' + ex.op + ' ' + ex.b + ' = ' + ex.ans + (ex.shown !== undefined ? '，同學寫 ' + ex.shown + (ex.why ? '（' + ex.why + '）' : '（對）') : '')));
}
// 跑酷難度：每一關的題目都要標 lv（1～3），初階和中階都至少要有 8 種不同的題目
for (const u of Q.UNITS.concat(Q.G4, Q.G5, Q.G6)) for (const s of u.stages) {
  if (s.mode !== 'run') continue;
  const pools = { 1: new Set(), 2: new Set(), 3: new Set() };
  for (let i = 0; i < 800; i++) { const q = s.gen(); assert.ok([1, 2, 3].includes(q.lv), s.id + ' 沒有標難度 ' + q.text); pools[q.lv].add(q.text + q.answer + (q.big || '') + (q.review || '')); }
  assert.ok(pools[1].size >= 8 && pools[2].size >= 8, s.id + ' 初階／中階題目太少 ' + pools[1].size + '/' + pools[2].size);
}
// 應用題：每個有關卡的單元都要有；問句對、不放用不到的數字（資源班孩子讀題已經很吃力）、照步驟算會得到答案
const W = Q.WORD, evalStep = (expr, prev) => Function('return ' + expr.replace(/(\d+)\/(\d+)/g, '($1/$2)').replace(/□/g, '(' + prev + ')').replace(/×/g, '*').replace(/÷/g, '/').replace(/＋/g, '+').replace(/－/g, '-'))();
const valOf = x => { x = String(x); if (x.includes('/')) { const [a, b] = x.split('/').map(Number); return a / b; } return parseFloat(x); };
for (const [g, units] of [['3', Q.UNITS], ['4', Q.G4], ['5', Q.G5], ['6', Q.G6]]) for (const u of units) {
  if (!u.stages.length) continue;
  const gen = W[g][String(u.id)]; assert.ok(gen, 'G' + g + ' 單元 ' + u.id + ' 沒有應用題');
  for (let i = 0; i < 400; i++) {
    const p = gen(), id = 'G' + g + '-' + u.id + ' ' + p.sents.join('');
    assert.ok(p.sents[p.ask] && p.sents[p.ask].includes('？'), id + ' 問句');
    const toks = p.sents.join('').match(/\d+(?:\.\d+)?(?:\/\d+)?/g) || [];
    p.use.forEach(v => assert.ok(toks.includes(v), id + ' 少了數字 ' + v));
    toks.forEach(t => assert.ok(p.use.includes(t) || ['12', '1', '3.14'].includes(t), id + ' 有用不到的數字 ' + t));
    let prev;
    for (const st of p.steps) {
      assert.strictEqual(new Set(st.opts).size, st.opts.length, id + ' 選項重複');
      assert.ok(st.opts.length === 3 && st.opts.includes(st.ans) && st.why, id + ' 選項');
      assert.ok(st.val !== undefined || st.expr, id + ' 步驟要能算');
      prev = st.val !== undefined ? st.val : evalStep(st.expr, prev);
    }
    const a = valOf(p.ans);
    assert.ok(a > 0 && Math.abs(prev - a) < 1e-6, id + ' 答案 ' + p.ans + ' 但步驟算出 ' + prev);
    if (!String(p.ans).includes('/')) assert.ok(/^\d+(\.\d{1,2})?$/.test(String(p.ans)), id + ' 答案格式 ' + p.ans);
  }
  const ex = gen(); console.log('應用題 G' + g + '-' + u.id, '|', ex.sents.join(''), '→', ex.ans, ex.unit);
}
console.log('全部通過');
