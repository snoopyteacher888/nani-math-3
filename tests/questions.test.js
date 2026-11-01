// 執行：node tests/questions.test.js
const assert = require('assert');
require('../js/questions.js');
const Q = globalThis.MathQ;

// 國字
const cases = { 3005: '三千零五', 3050: '三千零五十', 3500: '三千五百', 3205: '三千二百零五', 1010: '一千零一十', 10000: '一萬', 9999: '九千九百九十九', 15: '十五', 7040: '七千零四十', 100: '一百' };
for (const [n, s] of Object.entries(cases)) assert.strictEqual(Q.zh(+n), s, n);
assert.strictEqual(Q.literal(3005), 305);

const calc = (a, op, b) => op === '＋' ? a + b : op === '－' ? a - b : a * b;
const N = 3000;
for (const u of Q.UNITS) for (const s of u.stages) {
  for (let i = 0; i < N; i++) {
    if (s.mode === 'run') {
      const q = s.gen();
      assert.ok(q.text && q.say && q.answer && q.hint, s.id + ' missing fields');
      assert.strictEqual(q.options.length, 3, s.id + ' options');
      assert.strictEqual(new Set(q.options).size, 3, s.id + ' dup');
      assert.ok(q.options.includes(q.answer), s.id + ' no answer');
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
  const ex = s.mode === 'run' ? s.gen() : s.make();
  console.log(s.id, s.mode, '|', ex.text || (ex.a + ' ' + ex.op + ' ' + ex.b + ' = ' + ex.ans + (ex.shown !== undefined ? '，同學寫 ' + ex.shown + (ex.why ? '（' + ex.why + '）' : '（對）') : '')));
}
console.log('全部通過');
