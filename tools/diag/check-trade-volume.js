// 只读验证：贸易量输入框 step 与 max 的实际关系（数值层）。
// 注意：本文件只回答「step/max 取值是否合理」，
//       「按了没反应 / 数字跳回」的交互层根因见 tools/diag/check-trade-ui.js。
// 目的一：确认 maxTradeVolume 与 step 的取值组合，不修改任何游戏状态。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const load = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const sandbox = {
    console, Math, Date, JSON, TextEncoder, TextDecoder,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    localStorage: { _d: {}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);},
        removeItem(k){delete this._d[k];}, clear(){this._d={};} },
    alert: () => {}, confirm: () => true,
    renderAll: () => {}, refreshUI: () => {}, renderLogPanel: () => {},
    addEventLog: () => {}, setInterval: () => 0, clearInterval: () => {},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

for (const f of [
    'config/resourcesConfig.js','config/buildingsConfig.js','config/techsConfig.js',
    'config/upgradesConfig.js','config/permanentConfig.js','config/policiesConfig.js',
    'config/achievementConfig.js','config/eventsConfig.js','config/localResourceConfig.js',
    'utils.js','formulas.js','data.js','recourcesManager.js','effectsManager.js',
    'eventEffects.js','production.js','tradeEngine.js','queue.js','logic.js']) {
    try { vm.runInContext(load(f), ctx, { filename: f }); }
    catch (e) { console.log('LOAD FAIL', f, e.message); }
}
const run = (s) => vm.runInContext(s, ctx);
const out = [];
const log = (...a) => out.push(a.join(' '));

log('=== 1. maxTradeVolume 与 step 的对齐情况 ===');
log('公式：max = 市场x50 + 星际x10000 + 物流x25000，研究贸易III则 x1.5');
log('      step = Math.floor(max * 0.05)   ← ui/trade.js:69');
log('');
log('市场数  max       step   max%step  点+是否被clamp(at max)  最大可调值');
for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20]) {
    const max = m * 50;
    const step = Math.floor(max * 0.05);
    const rem = max % step;
    // 初始 userTradeVolume = max（见 updateMaxTradeVolume / resetTradeRates）
    // 点 + 时浏览器把值 +step，超过 max 则 clamp 回 max → 值不变
    const clampPlus = (max + step) > max ? true : false;   // 只要在 max 就必被 clamp
    log(`${String(m).padEnd(6)} ${String(max).padEnd(8)} ${String(step).padEnd(6)} ${String(rem).padEnd(9)} ${clampPlus ? '是（值不变）' : '否'}`);
}

log('');
log('=== 2. 市场可见但未建造时（maxTradeVolume = 0）===');
{
    run('initGameData();');
    const st = JSON.parse(run(`JSON.stringify({
        maxTradeVolume: GameState.maxTradeVolume,
        userTradeVolume: GameState.userTradeVolume,
        marketCount: GameState.buildings['市场'] ? GameState.buildings['市场'].count : 'n/a',
        marketVisible: GameState.buildings['市场'] ? GameState.buildings['市场'].visible : 'n/a',
    })`));
    log('  initGameData 后:', JSON.stringify(st));
    log('  → UI 的 :max = maxTradeVolume.toFixed(2) = "' + Number(st.maxTradeVolume).toFixed(2) + '"');
    log('  → UI 的 :step = Math.floor(' + st.maxTradeVolume + ' * 0.05) = ' + Math.floor(st.maxTradeVolume * 0.05));
    log('  min="0" 且 max="0.00" → 输入框被锁死在 0，点任一箭头都无反应。');
    log('  step=0 在 HTML 里是非法值（规范要求 step>0），浏览器会忽略它退化为 1。');
}

log('');
log('=== 3. 市场可见条件（判断 max=0 面板是否真的会显示）===');
{
    const cfg = run(`(function(){
        const c = BUILDINGS_CONFIG['市场'];
        return JSON.stringify({
            unlock: c.unlockCondition ? JSON.stringify(c.unlockCondition) : null,
            desc: c.desc,
        });
    })()`);
    log('  市场配置:', cfg);
    // 模拟：研究解锁科技后，市场 visible 会怎样
    run(`initGameData(); GameState.resources['金'].visible = true;`);
    run(`ProductionEngine.updateBuildingPrices(); ProductionEngine.computeProductionAndCaps();`);
    const vis = run(`JSON.stringify({
        marketVisible: GameState.buildings['市场'].visible,
        marketCount: GameState.buildings['市场'].count,
    })`);
    log('  给金可见后:', vis);
}

log('');
log('=== 4. updateMaxTradeVolume 的 clamp 行为 ===');
{
    run(`initGameData();
        GameState.buildings['市场'].count = 3;
        GameState.buildings['市场'].active = 3;
        TradeEngine.updateMaxTradeVolume(GameState);`);
    let r = JSON.parse(run(`JSON.stringify({
        max: GameState.maxTradeVolume, user: GameState.userTradeVolume })`));
    log('  建 3 座市场后: max=' + r.max + ', user=' + r.user);
    log('  → userTradeVolume 被设为 max（' + r.max + '），此时点 + 必然无效。');

    // 玩家手动调小
    run(`GameState.userTradeVolume = 100;`);
    run(`TradeEngine.updateMaxTradeVolume(GameState);`);
    r = JSON.parse(run(`JSON.stringify({
        max: GameState.maxTradeVolume, user: GameState.userTradeVolume })`));
    log('  手动设为 100 后再 update: user=' + r.user + '（未被改动，正常）');

    // 玩家手动调 0
    run(`GameState.userTradeVolume = 0;`);
    run(`TradeEngine.updateMaxTradeVolume(GameState);`);
    r = JSON.parse(run(`JSON.stringify({
        max: GameState.maxTradeVolume, user: GameState.userTradeVolume })`));
    log('  手动设为 0 后再 update: user=' + r.user + '  ← 被弹回 max（tradeEngine.js:23）');
    log('  → 这就是"调小到 0 又突然跳回最大值"的来源。');
}

console.log(out.join('\n'));
