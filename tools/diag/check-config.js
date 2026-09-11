// 只读一致性检查：配置层悬空引用
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const load = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const sandbox = {
    console, Math, Date, JSON, TextEncoder, TextDecoder,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    window: {}, alert: () => {}, confirm: () => true,
    renderAll: () => {}, refreshUI: () => {}, addEventLog: () => {},
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

const files = [
    'config/resourcesConfig.js', 'config/buildingsConfig.js', 'config/techsConfig.js',
    'config/upgradesConfig.js', 'config/permanentConfig.js', 'config/policiesConfig.js',
    'config/achievementConfig.js', 'config/eventsConfig.js', 'config/localResourceConfig.js',
    'utils.js', 'formulas.js', 'data.js', 'recourcesManager.js', 'effectsManager.js',
    'production.js', 'tradeEngine.js', 'queue.js', 'logic.js',
];
for (const f of files) {
    try { vm.runInContext(load(f), ctx, { filename: f }); }
    catch (e) { console.log('LOAD FAIL', f, e.message); }
}

const get = (name) => vm.runInContext(name, ctx);
const B = get('BUILDINGS_CONFIG');
const T = get('TECHS_CONFIG');
const U = get('UPGRADES_CONFIG');
const P = get('PERMANENT_CONFIG');
const R = get('RESOURCES_CONFIG');
const Pol = get('POLICIES_CONFIG');
const bNames = new Set(Object.keys(B));
const tNames = new Set(Object.keys(T));
const rNames = new Set(Object.keys(R));

const out = [];
const p = (s) => out.push(s);

p('=== A. 科技 prereq 悬空 ===');
let bad = 0;
for (const [name, cfg] of Object.entries(T)) {
    for (const pre of (cfg.prereq || [])) {
        if (!tNames.has(pre)) { p(`  [科技] ${name} 的 prereq "${pre}" 不存在`); bad++; }
    }
    for (const ul of (cfg.unlocks || [])) {
        if (!bNames.has(ul)) { p(`  [科技] ${name} 的 unlocks "${ul}" 不存在`); bad++; }
    }
    // effect 指向的建筑
    if (cfg.effect) {
        for (const bid of Object.keys(cfg.effect)) {
            if (!bNames.has(bid)) { p(`  [科技] ${name}.effect 指向不存在的建筑 "${bid}"`); bad++; }
        }
    }
}
if (!bad) p('  无问题');
else p(`  共 ${bad} 处`);

p('\n=== B. 永久升级 prereq / 资源名悬空 ===');
bad = 0;
for (const [name, cfg] of Object.entries(P)) {
    for (const pre of (cfg.prereq || [])) {
        if (!P[pre]) { p(`  [永恒] ${name} 的 prereq "${pre}" 不存在`); bad++; }
    }
    for (const rname of Object.keys(cfg.price || {})) {
        if (!rNames.has(rname)) { p(`  [永恒] ${name} 价格用了不存在的资源 "${rname}"`); bad++; }
    }
}
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== C. 升级 unlockCondition / effect 悬空 ===');
bad = 0;
for (const [name, cfg] of Object.entries(U)) {
    const uc = cfg.unlockCondition;
    if (uc && uc.tech && !tNames.has(uc.tech)) {
        p(`  [升级] ${name} 解锁依赖不存在的科技 "${uc.tech}"`); bad++;
    }
    if (cfg.effect) {
        for (const bid of Object.keys(cfg.effect)) {
            if (!bNames.has(bid)) { p(`  [升级] ${name}.effect 指向不存在的建筑 "${bid}"`); bad++; }
        }
    }
}
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== D. 建筑依赖悬空（科技/资源） ===');
bad = 0;
for (const [name, cfg] of Object.entries(B)) {
    const uc = cfg.unlockCondition;
    if (uc) {
        if (uc.tech && !tNames.has(uc.tech)) { p(`  [建筑] ${name} 解锁依赖不存在的科技 "${uc.tech}"`); bad++; }
    }
    // modifiers 指向的建筑
    for (const m of (cfg.modifiers || [])) {
        if (m.target && !bNames.has(m.target)) { p(`  [建筑] ${name}.modifiers 指向不存在的建筑 "${m.target}"`); bad++; }
    }
}
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== E. 建筑引用不存在的资源 ===');
bad = 0;
try {
    vm.runInContext('initGameData()', ctx);
    for (const [name, cfg] of Object.entries(B)) {
        const check = (obj, label) => {
            if (!obj) return;
            for (const r of Object.keys(obj)) {
                if (!rNames.has(r)) { p(`  [建筑] ${name}.${label} 用了不存在的资源 "${r}"`); bad++; }
            }
        };
        try {
            check(typeof cfg.produces === 'function' ? cfg.produces(get('GameState')) : cfg.produces, 'produces');
            check(typeof cfg.consumes === 'function' ? cfg.consumes(get('GameState')) : cfg.consumes, 'consumes');
            check(typeof cfg.caps === 'function' ? cfg.caps(get('GameState')) : cfg.caps, 'caps');
        } catch (e) { p(`  [建筑] ${name} 求值抛错: ${e.message}`); bad++; }
    }
} catch (e) { p('  ERR ' + e.message); }
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== F. 政策引用不存在的科技 ===');
bad = 0;
for (const [name, cfg] of Object.entries(Pol)) {
    const uc = cfg.unlockCondition;
    if (uc && uc.tech && !tNames.has(uc.tech)) {
        p(`  [政策] ${name} 解锁依赖不存在的科技 "${uc.tech}"`); bad++;
    }
}
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== G. 成就 effect 键名合法性 ===');
const EFF_KEYS = new Set(['globalProd','globalCost','globalScienceProd','globalSpeed','costRatio',
    'capPerRelic','sciCapPerRelicLog','globalSpaceProd','globalGalaxyProd','globalHappiness']);
bad = 0;
for (const cfg of get('ACHIEVEMENTS_CONFIG')) {
    for (const k of Object.keys(cfg.effect || {})) {
        if (!EFF_KEYS.has(k)) { p(`  [成就] ${cfg.id}.effect 含未知键 "${k}"`); bad++; }
    }
}
if (!bad) p('  无问题');
else p(`  ${bad} 处`);

p('\n=== H. 挑战科技 star 与成就条件匹配 ===');
for (const [name, cfg] of Object.entries(T)) {
    if (cfg.challenge) {
        p(`  ${name}: star=${cfg.challenge.star}, resetType=${cfg.challenge.resetType}`);
    }
}

p('\n=== I. 资源 baseCap 异常 ===');
for (const [name, cfg] of Object.entries(R)) {
    if (typeof cfg.baseCap !== 'number' || cfg.baseCap <= 0) {
        p(`  [资源] ${name} baseCap 异常: ${cfg.baseCap}`);
    }
}

// 同时落盘一份，便于在 PowerShell 下查看（本环境 stdout 不易捕获）。
// 写到脚本同级目录，避免污染项目根。
fs.writeFileSync(path.join(__dirname, 'config-check.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));
