// 執行：node tests/questions.test.js
const assert = require('assert');
require('../js/questions.js');
const Q = globalThis.MathQ;

// 國字
const cases = { 3005: '三千零五', 3050: '三千零五十', 3500: '三千五百', 3205: '三千二百零五', 1010: '一千零一十', 10000: '一萬', 9999: '九千九百九十九', 15: '十五', 7040: '七千零四十', 100: '一百' };
for (const [n, s] of Object.entries(cases)) assert.strictEqual(Q.zh(+n), s, n);
assert.strictEqual(Q.literal(3005), 305);

// 每個關卡出 3000 題，檢查答案正確、選項 3 個且不重複
function check(id, q) {
  assert.ok(q.text && q.say && q.answer && q.hint, id + ' missing fields');
  assert.strictEqual(q.options.length, 3, id + ' options ' + JSON.stringify(q));
  assert.strictEqual(new Set(q.options).size, 3, id + ' dup');
  assert.ok(q.options.includes(q.answer), id + ' no answer');
}
const evalExpr = t => { const m = t.match(/^(\d+) ([＋－×]) (\d+) ＝/); if (!m) return null; const a = +m[1], b = +m[3]; return m[2] === '＋' ? a + b : m[2] === '－' ? a - b : a * b; };
let counts = {};
for (const u of Q.UNITS) for (const s of u.stages) {
  for (let i = 0; i < 3000; i++) {
    const q = s.gen(); check(s.id, q);
    const v = evalExpr(q.text); if (v != null) assert.strictEqual(String(v), q.answer, s.id + ' ' + q.text);
    if (/^\d+$/.test(q.answer)) assert.ok(+q.answer > 0 && +q.answer <= 10000, s.id + ' range ' + q.answer);
    q.options.forEach(o => { if (/^\d+$/.test(o)) assert.ok(+o >= 0, 'neg'); });
  }
  counts[s.id] = 'ok';
}
// 範例
for (const u of Q.UNITS) for (const s of u.stages) for (let i = 0; i < 3; i++) { const q = s.gen(); console.log(s.id, '|', q.text, q.big || '', '| 答', q.answer, '| 選項', q.options.join(' / ')); }
console.log('全部通過', counts);
