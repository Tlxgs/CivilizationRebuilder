// 数值层验证：贸易量输入框的 step 语义。
//
// 结论（已固化）：动态 step（floor(maxTradeVolume * 0.05)）会让手输的小数落在
// step 网格之外，此时原生箭头执行的是「吸附到最近网格点」而不是「加减一个步长」，
// 值与 max 的组合不同、结果就不同 —— 表现为「有概率乱跳」。
// 因此 ui/trade.js 把该输入框的 step 固定为 "any"。
// 交互层的完整回归见 tools/diag/check-trade-ui.js。
//
// 本脚本用 jsdom（独立 DOM 实现，按 HTML 规范实现 step/validity）取证，不修改游戏状态。
// 运行：node tools/diag/check-trade-volume.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const { JSDOM } = require(path.join(root, 'node_modules', 'jsdom'));

const out = [];
const log = (...a) => out.push(a.join(' '));
let fail = 0;
const check = (name, ok, extra) => {
    if (!ok) fail++;
    log(`  [${ok ? 'OK' : 'FAIL'}] ${name}${extra ? '  — ' + extra : ''}`);
};

const doc = new JSDOM('<!doctype html><body></body>').window.document;

function makeInput(step, value, max) {
    const el = doc.createElement('input');
    el.type = 'number';
    el.setAttribute('min', '0');
    el.setAttribute('max', String(max));
    el.setAttribute('step', String(step));
    el.value = String(value);
    doc.body.appendChild(el);
    return el;
}

log('=== 1. 动态 step 的问题（取证：为什么不能这么写）===');
log('step = floor(maxTradeVolume * 0.05)，市场 1/2 座时分别是 2 / 5。');
for (const [max, step] of [[50, 2], [100, 5], [75, 3]]) {
    const row = [];
    for (const v of [0.5, 1.5]) {
        const el = makeInput(step, v, max);
        const mismatch = el.validity.stepMismatch;
        el.stepUp();
        row.push(`v=${v}(mismatch=${mismatch}) 点上=${el.value}`);
    }
    const el2 = makeInput(step, 1.5, max);
    log(`  max=${max} step=${step}: ${row.join('  |  ')}  valid=${el2.checkValidity()}`);
}
log('  → 点上不是 +step，而是被吸附到网格点（0.5 和 1.5 都变成 2/5/3）。');
log('  → 非网格值的 stepMismatch=true，表单校验判为非法。');

log('');
log('=== 2. step="any" 的行为（当前实现）===');
{
    const el = makeInput('any', 0.5, 50);
    check('step="any" 时 el.step 读回 any', el.step === 'any', '实际 ' + el.step);
    check('v=0.5 不再 stepMismatch', el.validity.stepMismatch === false);
    check('v=0.5 通过校验', el.checkValidity() === true);
    el.value = '1.5';
    check('手输 1.5 被原样接受（不被改写）', el.value === '1.5', '实际 ' + el.value);
    el.value = '0.001';
    check('任意小数可接受', el.value === '0.001', '实际 ' + el.value);
    el.value = '999';
    check('超上限仍被标记 rangeOverflow（max=50 由上层夹取）',
        el.validity.rangeOverflow === true);
}
log('  说明：step="any" 表示没有允许步长，原生箭头回到规范默认步长 1，');
log('        所以 0.5 点上正好是 1.5，符合玩家直觉。');

log('');
log('=== 3. ui/trade.js 源码断言 ===');
{
    const src = fs.readFileSync(path.join(root, 'ui', 'trade.js'), 'utf8');
    check('贸易量输入框使用 step="any"', /id="user-trade-volume"[\s\S]{0,200}?step="any"/.test(src));
    check('已移除动态 volumeStep 计算属性', !/volumeStep\(\)/.test(src));
    check('未再出现 :step="volumeStep"', !/:step="volumeStep"/.test(src));
}

log('');
log('=== 4. 同类风险：持续贸易速率输入框 ===');
{
    const src = fs.readFileSync(path.join(root, 'ui', 'trade.js'), 'utf8');
    const hasRateStep = /:step="rateStep"/.test(src);
    log('  rate 输入框仍使用动态 :step="rateStep"（floor(max * 0.0001)）: ' + hasRateStep);
    log('  rateStep 同样随 max 变化，同样会让非网格值被吸附。');
    log('  该输入框另用 :value + @change（单向绑定），存在同类同步问题。');
    log('  —— 属同类风险，尚未改动，待确认后处理。');
}

log('');
log(fail === 0 ? '结果: 全部 ' + (out.filter((l) => l.includes('[OK]')).length) + ' 项通过'
    : '结果: ' + fail + ' 项失败');
console.log(out.join('\n'));
