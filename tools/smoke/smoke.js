// 冒烟测试：在 jsdom 中模拟浏览器完整加载游戏（configs + 引擎 + Vue UI），验证渲染与交互。
// 用法: node tools/smoke/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM, VirtualConsole } = require(path.join(__dirname, '..', '..', 'node_modules', 'jsdom'));

const root = path.join(__dirname, '..', '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 收集页面中的 script src（按顺序）
const srcs = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (srcs.length === 0) throw new Error('index.html 中未找到任何 <script src>');

// 收集加载错误
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
vc.on('error', (...args) => errors.push('console.error: ' + args.join(' ')));

const dom = new JSDOM(indexHtml, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc,
});

const { window } = dom;
const context = vm.createContext(window);

// 按顺序执行所有脚本（与浏览器一致）
for (const src of srcs) {
    const p = path.join(root, src);
    if (!fs.existsSync(p)) throw new Error(`脚本不存在: ${src}`);
    const code = fs.readFileSync(p, 'utf8');
    try {
        vm.runInContext(code, context, { filename: src });
    } catch (e) {
        errors.push(`脚本执行失败 ${src}: ${e.message}\n${e.stack.split('\n').slice(0, 4).join('\n')}`);
    }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  PASS', msg); }
    else { failed++; console.error('  FAIL', msg); }
}
function assertSoon(fn, msg, timeout = 3000) {
    return new Promise(resolve => {
        const t0 = Date.now();
        (function check() {
            let ok = false, err = null;
            try { ok = fn(); } catch (e) { err = e; }
            if (ok) { passed++; console.log('  PASS', msg); resolve(); }
            else if (Date.now() - t0 > timeout) {
                failed++;
                console.error('  FAIL', msg, err ? '(' + err.message + ')' : '');
                resolve();
            } else setTimeout(check, 100);
        })();
    });
}

(async () => {
    console.log('== 1. 页面加载 ==');
    assert(errors.length === 0, '所有脚本无加载错误' + (errors.length ? '：\n' + errors.join('\n') : ''));
    if (errors.length) { console.log(errors.slice(0, 5).join('\n')); }

    // 触发 onload（main.js 引导流程）
    window.dispatchEvent(new window.Event('load'));
    await wait(300);

    const $ = (sel) => window.document.querySelector(sel);
    const $$ = (sel) => [...window.document.querySelectorAll(sel)];
    // GameState / Core 是顶层 let/const 词法绑定（不在 window 上），通过 vm 表达式读取
    const G = () => vm.runInContext('GameState', context);
    const Core = () => vm.runInContext('Core', context);

    console.log('== 2. Vue 挂载与初始渲染 ==');
    assert(!!$('#app') && $('#app').children.length > 0, '#app 已挂载 Vue 内容');
    assert(!!$('.main-layout'), '存在 .main-layout');
    assert(!!$('.sidebar') && !!$('.main-content') && !!$('.log-panel'), '三栏布局存在');
    assert(!!$('#happiness-display') && $('#happiness-display').textContent.includes('幸福度'), '幸福度显示渲染');
    assert(!!$('#current-date') && $('#current-date').textContent.includes('年'), '日期显示渲染: ' + $('#current-date').textContent);
    assert(!!$('#current-season'), '季节显示渲染');
    // 初始可见标签：建筑/科技/成就/选项/更新日志（政策/贸易/晶体/永恒未解锁）
    const tabIds = $$('.tab-btn').map(b => b.dataset.tab);
    assert(JSON.stringify(tabIds) === JSON.stringify(['building', 'tech', 'achievements', 'reset', 'changelog']),
        '初始可见标签正确: ' + tabIds.join(','));
    assert($$('#panel-building .sub-tab-btn').length > 0, '建筑面板渲染了大分类子标签');
    assert($('#panel-tech .sub-tab-btn[data-subtab="tech"]') !== null, '科技面板渲染了子标签');
    assert($('#panel-building').style.display !== 'none' && $('#panel-tech').style.display === 'none',
        '仅建筑面板可见（v-show）');

    console.log('== 3. 行动面板 + 响应式资源条 ==');
    const woodBtn = $$('.action-btn').find(b => b.dataset.action === 'collect_wood');
    assert(!!woodBtn, '行动面板包含"收集木头"按钮');
    assert($$('#resource-bar .resource-item').length === 0, '初始资源条为空');
    woodBtn.click();
    await wait(50);
    assert($$('#resource-bar .resource-item').length === 1, '点击后资源条出现木头（Vue 响应式，无手动 renderAll）');
    assert($$('#resource-bar .res-value')[0]?.textContent.includes('1'), '木头数量显示为 1: ' + $$('#resource-bar .res-value')[0]?.textContent);

    console.log('== 4. 选项卡切换 ==');
    const techTab = $('.tab-btn[data-tab="tech"]');
    techTab.click();
    await wait(50);
    assert($('#panel-tech').style.display !== 'none' && $('#panel-building').style.display === 'none',
        '点击科技标签后切换面板可见性');
    assert($('.tab-btn[data-tab="tech"]').classList.contains('active'), '科技标签获得 active 状态');

    console.log('== 5. 游戏循环推进日期 ==');
    await assertSoon(() => (G().gameDays || 0) >= 1, '游戏循环运行，gameDays 达到 1');
    const dateText = $('#current-date').textContent;
    assert(/\d+年\d+日/.test(dateText) && dateText !== '0年1日', '日期随天数推进: ' + dateText);

    console.log('== 6. 购买建筑（解锁科技 → 显示 → 点击购买） ==');
    window.debugUnlockTech('搭建帐篷');
    await wait(50);
    const tentCard = $('.building-card[data-building="帐篷"]');
    assert(!!tentCard, '解锁搭建帐篷后建筑卡片出现');
    // 收集木头凑足购买费用（帐篷价格：木头5）
    for (let i = 0; i < 6; i++) Core().performAction('collect_wood');
    await wait(50);
    tentCard.click();
    await wait(50);
    assert(G().buildings['帐篷'].count === 1, '点击建筑卡片后帐篷数量=1');
    assert($('.building-card[data-building="帐篷"] small').textContent.trim() === '1/1', '卡片显示 1/1');

    console.log('== 7. 存档/读档 ==');
    window.saveGame();
    const saved1 = window.localStorage.getItem('civilizationRebuilder');
    assert(!!saved1, 'saveGame 写入 localStorage');
    G().gameDays = 12345;
    window.loadGame();
    assert(G().gameDays < 1000, 'loadGame 恢复存档数据: gameDays=' + G().gameDays);

    console.log('== 8. 导入弹窗 ==');
    window.UI.state.importModalOpen = true;
    await wait(50);
    assert($('#import-modal') !== null && $('#import-modal').style.display !== 'none', '导入弹窗显示');
    const closeBtn = $('#import-modal .modal-close');
    closeBtn.click();
    await wait(50);
    assert($('#import-modal') === null, '关闭后弹窗移除');

    console.log('== 9. 建筑模式/加减按钮 ==');
    // 小屋需要"初级建筑学"；用 debug 快速解锁并建造 3 个帐篷来测试 +/- 
    for (let i = 0; i < 3; i++) window.debugBuild('帐篷', 1);
    await wait(50);
    const plusBtn = $('.building-card[data-building="帐篷"] .plus-btn');
    plusBtn.click();
    await wait(50);
    assert(G().buildings['帐篷'].active === 4, '点击 + 激活建筑 active=4');
    const minusBtn = $('.building-card[data-building="帐篷"] .minus-btn');
    minusBtn.click();
    await wait(50);
    assert(G().buildings['帐篷'].active === 3, '点击 - 取消激活 active=3');

    console.log('== 10. 贸易面板 ==');
    window.debugUnlockTech('国际贸易学');
    window.debugBuild('市场', 1);
    await wait(100);
    const tradeTab2 = $('.tab-btn[data-tab="trade"]');
    assert(!!tradeTab2, '解锁市场后贸易标签出现');
    tradeTab2.click();
    await wait(100);
    assert($$('#panel-trade .trade-single-card').length > 0, '贸易面板渲染资源卡片');
    assert($('#user-trade-volume') !== null, '贸易量输入框存在');

    console.log('== 11. 政策面板（解锁银行学 → 显示政策） ==');
    window.debugUnlockTech('银行学');
    await wait(100);
    const policyTab = $('.tab-btn[data-tab="policy"]');
    assert(!!policyTab, '解锁银行学后政策标签出现');
    policyTab.click();
    await wait(100);
    assert($$('#panel-policy .policy-group').length > 0, '政策面板渲染政策组');
    // 给政策点后点击 +1
    window.debugSetResource('政策点', 50);
    await wait(50);
    const incBtn = $('#panel-policy .policy-inc[data-policy]');
    const beforeVal = G().policies['税收政策'].currentValue;
    incBtn.click();
    await wait(50);
    assert(G().policies['税收政策'].currentValue === beforeVal + 1, '点击 +1 政策值变化: ' + beforeVal + '→' + G().policies['税收政策'].currentValue);
    const policyTitle = $('.policy-title');
    assert(policyTitle.textContent.includes(String(beforeVal + 1)), '政策面板数值显示更新');

    console.log('== 12. 科技研究 + 队列 ==');
    const techTab2 = $('.tab-btn[data-tab="tech"]');
    techTab2.click();
    await wait(50);
    // 重置科技状态后研究"初级建筑学"（需先解锁前置）
    window.debugUnlockTech('初级建筑学');
    await wait(50);
    const researchBtn = $('#panel-tech .tech-btn[data-tech="初级建筑学"]');
    // 已研究则按钮消失；这里直接调用 Core 验证研究流程
    if (!G().techs['初级建筑学'].researched) {
        Core().researchTech('初级建筑学');
        await wait(50);
    }
    assert(G().techs['初级建筑学'].researched === true, 'researchTech 成功研究科技');
    // 队列：加入一个当前买不起的建筑（队列会保留该条目，验证渲染与移除）
    window.addToQueue('building', '发射井');
    await wait(100);
    const queueItems = $$('.queue-item');
    assert(G().queue.length === 1 && queueItems.length >= 1, '队列面板渲染队列项');
    const removeBtn = $('.queue-remove-btn');
    removeBtn.click();
    await wait(50);
    assert(G().queue.length === 0, '点击 ✕ 移除队列项');

    console.log('== 13. 生产计算（电力/木头产量） ==');
    // 研究"打磨工具"后解锁伐木场？直接检查 computeProductionAndCaps 不报错
    try {
        vm.runInContext('ProductionEngine.computeProductionAndCaps()', context);
        assert(true, 'computeProductionAndCaps 正常执行');
    } catch (e) {
        assert(false, 'computeProductionAndCaps 异常: ' + e.message);
    }

    console.log('== 14. beforeunload 自动保存（_hardResetting 修复验证） ==');
    assert(vm.runInContext('typeof _hardResetting !== "undefined"', context), '_hardResetting 已定义');
    G().gameDays = 777;
    window.dispatchEvent(new window.Event('beforeunload'));
    const savedAfter = window.localStorage.getItem('civilizationRebuilder');
    const parsedAfter = savedAfter ? JSON.parse(savedAfter) : null;
    assert(parsedAfter && parsedAfter.gameDays === 777, 'beforeunload 自动保存生效（gameDays=777 已写入，无 ReferenceError）');

    console.log('== 15. 回归：setPolicyValue 超范围按裁剪后差值计费 ==');
    window.debugSetResource('政策点', 100);
    G().policies['税收政策'].currentValue = 25;
    const ppBefore = G().resources['政策点'].amount;
    Core().setPolicyValue('税收政策', 100);   // max=50，应只收 25 点而非 75
    const ppAfter = G().resources['政策点'].amount;
    assert(ppBefore - ppAfter === 25, `超范围请求只扣 ${ppBefore - ppAfter} 政策点（应为 25）`);
    assert(G().policies['税收政策'].currentValue === 50, '政策值被裁剪到上限 50');

    console.log('== 16. 回归：switchPolicy 死代码已移除 ==');
    assert(Core().switchPolicy === undefined, 'Core 上不存在 switchPolicy');

    console.log('== 17. 回归：consciousReset 成就类型与日志孢子数量 ==');
    vm.runInContext('window.__capturedResetType = null; window.__origUnlock = unlockAchievementsForReset; unlockAchievementsForReset = function(t) { window.__capturedResetType = t; window.__origUnlock(t); }', context);
    vm.runInContext('confirm = () => true', context);
    window.debugUnlockTech('意识上传');
    vm.runInContext('GameState.resources["科学"].cap = 100000', context);
    // 按 consciousReset 的公式计算预期值（星级=0，倍率=1）
    const baseRelicGain = vm.runInContext('Formulas.calcRelicGainFromNuke(GameState.resources["科学"].cap, 0, GameState.localResources.population.capacity)', context);
    const expRelic = Math.floor(baseRelicGain * 10);
    const expDark = Math.floor(Math.sqrt(1 + expRelic));
    const expSpore = Math.floor(Math.sqrt(1 + baseRelicGain * 3));
    const expSing = Math.floor((Math.log(300 + expRelic) - Math.log(300)) * 10);
    const expWisdom = Math.floor(Math.sqrt(expRelic / 200));
    vm.runInContext('consciousReset()', context);
    await wait(100);
    assert(vm.runInContext('window.__capturedResetType', context) === 'conscious', 'unlockAchievementsForReset 收到重置类型 conscious');
    const resetLog = G().eventLogs[0].text;
    assert(resetLog.includes(`获得 ${expRelic} 遗物, ${expDark} 暗能量, ${expSpore} 孢子, ${expSing} 奇点, ${expWisdom} 智慧`),
        '日志显示正确的孢子数量（不再重复暗能量）: ' + resetLog);
    assert(G().resources['孢子'].amount === expSpore, '重置后孢子数量正确: ' + G().resources['孢子'].amount);
    assert(G().gameDays === 0, '重置后天数清零');
    vm.runInContext('unlockAchievementsForReset = window.__origUnlock', context);

    console.log('== 18. 晶体面板 ==');
    window.debugUnlockTech('军事理论');
    vm.runInContext(`GameState.crystals.inventory.push({ id: 12345, name: '测试水晶', effects: [{ type: 'prod', target: 'global', value: 0.1 }] })`, context);
    await wait(100);
    const crystalTab = $('.tab-btn[data-tab="crystal"]');
    assert(!!crystalTab, '军事理论解锁后晶体标签出现');
    crystalTab.click();
    await wait(100);
    assert($$('#panel-crystal .crystal-slot').length === 9, '晶体面板渲染 3 装备槽 + 6 库存槽');
    $('.equip-crystal').click();
    await wait(50);
    assert(G().crystals.equipped[0]?.name === '测试水晶' && G().crystals.inventory.length === 0, '点击装备后晶体进入槽位 0');
    $('.unequip-crystal').click();
    await wait(50);
    assert(G().crystals.equipped[0] === null && G().crystals.inventory.length === 1, '点击卸下后晶体回到库存');

    console.log('== 19. 永恒面板 ==');
    const permTab = $('.tab-btn[data-tab="permanent"]');
    assert(!!permTab, '拥有遗物后永恒标签出现');
    permTab.click();
    await wait(100);
    const permBtn = $('#panel-permanent .perm-btn[data-permanent="节约成本I"]');
    assert(!!permBtn, '永恒面板显示节约成本I（成本优化·入门）');
    permBtn.click();
    await wait(50);
    assert(G().permanent['节约成本I'].researched === true, '购买永恒升级成功');

    console.log('== 20. 成就面板（F12 彩蛋） ==');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'F12' }));
    await wait(50);
    assert(!!G().achievements['不道德的巅峰'], 'F12 解锁彩蛋成就');
    const achTab = $('.tab-btn[data-tab="achievements"]');
    achTab.click();
    await wait(100);
    assert($('#panel-achievements').textContent.includes('已完成 1/7'), '成就面板显示 1/7');
    assert($$('#panel-achievements .achievement-card').length === 1, '成就卡片渲染');

    console.log('== 21. 软重置 ==');
    window.debugBuild('帐篷', 5);
    vm.runInContext('softReset(0, 0)', context);
    await wait(100);
    assert(G().buildings['帐篷'].count === 0, '软重置清空建筑数量');
    assert(G().gameDays <= 1, '软重置清零游戏天数（循环可能已推进 1 天）');

    console.log('== 22. 离线时间结算 ==');
    vm.runInContext('GameState.lastSaveTime = Date.now() - 10000', context);
    vm.runInContext('processOfflineTime()', context);
    assert(G().resources['时间晶体'].amount >= 4.9, '离线 10 秒获得约 5 时间晶体: ' + G().resources['时间晶体'].amount);
    assert(G().resources['时间晶体'].visible === true, '时间晶体变为可见');
    assert(G().eventLogs[0].text.includes('离线'), '日志记录离线结算');

    console.log('== 23. Tooltip 指令 ==');
    const tipTarget = $('.resource-item');
    assert(!!tipTarget, '存在可见资源项作为 Tooltip 目标');
    tipTarget.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: false }));
    await wait(80);
    const tip = $('#game-tooltip');
    assert(!!tip && tip.style.display !== 'none' && tip.innerHTML.length > 0, '鼠标悬停资源显示 Tooltip');
    tipTarget.dispatchEvent(new window.MouseEvent('mouseleave', { bubbles: false }));
    await wait(50);
    assert(tip.style.display === 'none', '移出后 Tooltip 隐藏');

    console.log('== 24. 无渲染报错 ==');
    assert(errors.length === 0, '全过程无 jsdom/console 错误' + (errors.length ? '：' + errors.join(' | ') : ''));

    console.log(`\n==== 结果: ${passed} 通过, ${failed} 失败 ====`);
    window.GameLoop.stop();
    dom.window.close();
    process.exit(failed ? 1 : 0);
})().catch(e => {
    console.error('测试崩溃:', e);
    process.exit(1);
});
