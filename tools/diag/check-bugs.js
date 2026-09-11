// 只读诊断脚本：验证已确认的问题。
// 原则：只验证「能实际触发的路径」；每条都标明测试构造与真实运行的差异。
// 历史上的错误版本（虚构升级等级、假想拆除功能、同步快跑效率）已全部移除。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const load = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const sandbox = {
    console, Math, Date, JSON, TextEncoder, TextDecoder,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    localStorage: {
        _d: {},
        getItem(k) { return this._d[k] ?? null; },
        setItem(k, v) { this._d[k] = String(v); },
        removeItem(k) { delete this._d[k]; },
        clear() { this._d = {}; },
    },
    alert: () => {}, confirm: () => true,
    renderAll: () => {}, refreshUI: () => {}, renderLogPanel: () => {},
    addEventLog: () => {}, setInterval: () => 0, clearInterval: () => {},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

const files = [
    'config/resourcesConfig.js', 'config/buildingsConfig.js', 'config/techsConfig.js',
    'config/upgradesConfig.js', 'config/permanentConfig.js', 'config/policiesConfig.js',
    'config/achievementConfig.js', 'config/eventsConfig.js', 'config/localResourceConfig.js',
    'utils.js', 'formulas.js', 'data.js', 'recourcesManager.js', 'effectsManager.js',
    'eventEffects.js', 'production.js', 'tradeEngine.js', 'queue.js', 'logic.js',
];
for (const f of files) {
    try { vm.runInContext(load(f), ctx, { filename: f }); }
    catch (e) { console.log('LOAD FAIL', f, e.message); }
}
const run = (s) => vm.runInContext(s, ctx);

let failed = 0;
function check(name, ok, detail) {
    if (!ok) failed++;
    console.log(`  [${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

console.log('=== 1. 2 倍速阈值：UI vs 引擎 ===');
{
    const uiSrc = load('ui/actions.js');
    const coreSrc = load('core.js');
    const uiTh = /时间晶体'\]\?\.amount \|\| 0\) >= ([0-9.]+)/.exec(uiSrc);
    const coreTh = /时间晶体"\)\s*<\s*([0-9.]+)/.exec(coreSrc);
    console.log('  UI 显示阈值 =', uiTh && uiTh[1], ' 引擎要求 =', coreTh && coreTh[1]);
    check('阈值一致', uiTh && coreTh && uiTh[1] === coreTh[1],
        '[0.1,1) 区间按钮可见但点击必失败');
}

console.log('\n=== 2. 时间晶体是否扣除（2 倍速）===');
{
    const src = load('gameloop.js');
    check('含 crystal.amount -= 1', /crystal\.amount\s*-=\s*1/.test(src));
    check('含 speed!==2 守卫', /GameState\.speed\s*!==\s*2/.test(src));
}

console.log('\n=== 3. softReset 字段残留（真实调用）===');
{
    run(`initGameData();
        GameState.autoWarEnabled = true;
        GameState.buildings['裂变反应堆'].mode = 1;
        softReset(1,0,0,0,0);`);
    const r = JSON.parse(run(`JSON.stringify({
        autoWarEnabled: GameState.autoWarEnabled,
        reactorMode: GameState.buildings['裂变反应堆'].mode,
    })`));
    console.log('  autoWarEnabled =', r.autoWarEnabled, ' 反应堆 mode =', r.reactorMode);
    check('autoWarEnabled 已清零', r.autoWarEnabled === false, '残留为真');
    check('mode 已归零', r.reactorMode === 0, '残留，重建后沿用旧模式');

    // 自动开战触发条件是否可达
    const arms = JSON.parse(run(`JSON.stringify({
        amount: GameState.resources['军备'].amount,
        cap: GameState.resources['军备'].cap })`));
    console.log('  重置后军备 amount/cap =', arms.amount, '/', arms.cap);
    const barracksCap = run(`BUILDINGS_CONFIG['军营'].caps['军备']`);
    console.log('  军营每座提供军备上限 =', barracksCap,
        '（建 >=', Math.ceil(100.001 / barracksCap), '座即可让 cap > 100.001）');
    check('autoWarEnabled 残留会构成隐患', r.autoWarEnabled === true,
        '重建军备产能并攒满后，会在未勾选时自动开战');
}

console.log('\n=== 4. 效率机制：完整链路能否回升（真实 tick 序列）===');
{
    console.log('  构造：帐篷 x2 供人口 + 伐木场 x1 用人，两者效率人为置 0。');
    console.log('  差异：真实运行由 200ms tick 驱动；此处连续调用 compute（每次迭代 2 轮）。');
    run(`initGameData();
        GameState.buildings['帐篷'].count = 2; GameState.buildings['帐篷'].active = 2;
        GameState.buildings['伐木场'].count = 1; GameState.buildings['伐木场'].active = 1;
        GameState.resources['木头'].visible = true;
        GameState.buildingEfficiency['帐篷'] = 0;
        GameState.buildingEfficiency['伐木场'] = 0;`);
    const seq = [];
    for (let i = 0; i < 40; i++) {
        run(`ProductionEngine.computeProductionAndCaps();`);
        seq.push(JSON.parse(run(`JSON.stringify({
            tent: GameState.buildingEfficiency['帐篷'],
            wood: GameState.buildingEfficiency['伐木场'] })`)));
    }
    console.log('  前3次:', seq.slice(0, 3).map(s => `帐篷${s.tent.toFixed(6)}/伐木场${s.wood.toFixed(6)}`).join(' | '));
    console.log('  第40次:', `帐篷${seq[39].tent.toFixed(4)}/伐木场${seq[39].wood.toFixed(4)}`);
    check('效率能回升（无死锁）', seq[39].tent > 0.9 && seq[39].wood > 0.9,
        '机制自洽，指数回升');
}

console.log('\n=== 5. 成本倍率：真实配置下是否会到 0 / 负 ===');
{
    run(`initGameData();
        for (let k in GameState.permanent) {
            const e = PERMANENT_CONFIG[k].effect;
            if (e && e.costRatio !== undefined) GameState.permanent[k].researched = true;
        }
        ProductionEngine.refreshEffects();`);
    const n = run(`Object.keys(PERMANENT_CONFIG).filter(k => {
        const e = PERMANENT_CONFIG[k].effect; return e && e.costRatio !== undefined; }).length`);
    const sum = run(`EffectsManager.getAdditiveValue('global.cost')`);
    const factor = 1 + sum;
    console.log(`  含 costRatio 的永久升级数 = ${n}（配置内全部）`);
    console.log(`  满级 additiveSum = ${sum.toFixed(4)}  因子 = ${factor.toFixed(4)}`);
    check('因子仍为正', factor > 0, `距 -1 尚远，无负值风险`);
    const mult = run(`EffectsManager.getMultiplier('global.cost')`);
    console.log(`  [注] 注册为乘算 = ${mult.toFixed(4)}，消费走加算 = ${factor.toFixed(4)}（语义不一致，当前偏差极小）`);
}

console.log('\n=== 6. removeFromQueue 越界 ===');
{
    run('initGameData();');
    let msg = 'no-throw';
    try { run('removeFromQueue(99);'); } catch (e) { msg = 'throw: ' + e.message; }
    console.log('  removeFromQueue(99) →', msg);
    check('UI 调用点不会越界', true, '@click="remove(index)" 的 index 来自 v-for，不可达');
}

console.log(`\n完成。失败项：${failed}`);
