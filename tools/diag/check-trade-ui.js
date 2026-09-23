// 验证贸易量输入框修复效果：DOM 与 GameState 是否双向同步、是否还会跳回。
// 用真实 index.html 全量脚本 + 真实 GameLoop。只读诊断，不改游戏代码。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM, VirtualConsole } = require(path.join(__dirname, '..', '..', 'node_modules', 'jsdom'));

const root = path.join(__dirname, '..', '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcs = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(indexHtml, {
    url: 'http://localhost/', runScripts: 'outside-only',
    pretendToBeVisual: true, virtualConsole: vc,
});
const { window } = dom;
const context = vm.createContext(window);
for (const src of srcs) {
    const p = path.join(root, src);
    if (!fs.existsSync(p)) continue;
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), context, { filename: src }); }
    catch (e) { errors.push(`脚本执行失败 ${src}: ${e.message}`); }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const G = () => vm.runInContext('GameState', context);
let pass = 0, fail = 0;
const out = [];
const log = (...a) => out.push(a.join(' '));
function check(name, ok, detail) {
    if (ok) pass++; else fail++;
    log(`  [${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}
const input = () => window.document.querySelector('#user-trade-volume');
// 模拟浏览器原生步进箭头：改 DOM 值 + 派发 input（真实浏览器点箭头即触发 input）
async function spin(newValue) {
    const el = input();
    el.value = String(newValue);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
    await wait(40);
}

(async () => {
    window.dispatchEvent(new window.Event('load'));
    await wait(300);

    log('=== 场景 A：市场未建（maxTradeVolume = 0）===');
    window.debugUnlockTech('国际贸易学');
    await wait(60);
    {
        const tab = window.document.querySelector('.tab-btn[data-tab="trade"]');
        if (tab) { tab.click(); await wait(80); }
        const el = input();
        log('  maxTradeVolume =', G().maxTradeVolume, '  input.disabled =', el && el.disabled);
        check('输入框被禁用（不再是一个点了没反应的框）', !!(el && el.disabled));
    }

    log('');
    log('=== 场景 B：建造 1 座市场（max=50, step=2）===');
    window.debugBuild('市场', 1);
    await wait(150);
    log('  maxTradeVolume =', G().maxTradeVolume, '  userTradeVolume =', G().userTradeVolume);
    {
        const el = input();
        log('  input: max=' + el.getAttribute('max') + ' step=' + el.getAttribute('step') +
            ' disabled=' + el.disabled + ' value=' + el.value);
        check('输入框启用', !el.disabled);
    }

    log('');
    log('=== 场景 C：按减号箭头（50 → 48）后状态是否同步、是否会被弹回 ===');
    await spin(48);
    log('  立即: DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('状态同步为 48', Math.abs(G().userTradeVolume - 48) < 1e-9, '实际 ' + G().userTradeVolume);
    check('DOM 与状态一致', input().value === String(G().userTradeVolume), 'DOM=' + input().value);
    await wait(500);   // 真实 gameloop 跑数轮
    log('  等 500ms 后: DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('未被弹回（500ms 后仍是 48）', Math.abs(G().userTradeVolume - 48) < 1e-9,
        '实际 ' + G().userTradeVolume);
    check('DOM 未被重置', input().value === '48', '实际 ' + input().value);

    log('');
    log('=== 场景 D：连续按箭头（48 → 46 → 44）===');
    await spin(46);
    await spin(44);
    log('  结果: DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('连续步进每次都生效', Math.abs(G().userTradeVolume - 44) < 1e-9, '实际 ' + G().userTradeVolume);

    log('');
    log('=== 场景 E：手动输入超上限（999，max=50）===');
    await spin(999);
    log('  DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('状态被夹到上限 50', Math.abs(G().userTradeVolume - 50) < 1e-9, '实际 ' + G().userTradeVolume);
    check('DOM 同步显示为 50', input().value === '50', '实际 ' + input().value);

    log('');
    log('=== 场景 F：清空输入框后失焦 ===');
    {
        const el = input();
        el.value = '';
        el.dispatchEvent(new window.Event('input', { bubbles: true }));
        await wait(30);
        log('  清空后: DOM="' + el.value + '"  状态=' + G().userTradeVolume);
        check('清空过程中不改状态', Math.abs(G().userTradeVolume - 50) < 1e-9, '实际 ' + G().userTradeVolume);
        el.dispatchEvent(new window.Event('change', { bubbles: true }));
        await wait(30);
        log('  失焦后: DOM="' + el.value + '"  状态=' + G().userTradeVolume);
        check('失焦后显示值规范化回状态', el.value === String(G().userTradeVolume),
            'DOM=' + el.value + ' 状态=' + G().userTradeVolume);
    }

    log('');
    log('=== 场景 G：手动输入合法小数值（0.5）===');
    await spin(0.5);
    log('  DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('小数被正确接受', Math.abs(G().userTradeVolume - 0.5) < 1e-9, '实际 ' + G().userTradeVolume);
    await spin(1.5);
    log('  再设为 1.5: DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('0.5 → 1.5 生效且不回退', Math.abs(G().userTradeVolume - 1.5) < 1e-9,
        '实际 ' + G().userTradeVolume);
    await wait(400);
    log('  等 400ms 后: DOM=' + input().value + '  状态=' + G().userTradeVolume);
    check('未被弹回（仍是 1.5）', Math.abs(G().userTradeVolume - 1.5) < 1e-9,
        '实际 ' + G().userTradeVolume);

    log('');
    if (errors.length) log('页面错误: ' + errors.slice(0, 3).join(' | '));
    log(`==== 结果: ${pass} 通过, ${fail} 失败 ====`);
    console.log(out.join('\n'));
    process.exitCode = fail ? 1 : 0;
})();
