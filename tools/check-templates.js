// 开发辅助脚本：在 Node 中校验所有 Vue 组件模板可编译（不依赖浏览器）
// 用法: node tools/check-templates.js
'use strict';
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const vm = require('vm');
const code = fs.readFileSync(path.join(root, 'vendor', 'vue.global.prod.js'), 'utf8');
// Vue 包在 vm 沙箱中执行，所需浏览器全局需放入沙箱对象
const sandbox = {
    window: { addEventListener() {}, removeEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {}, clear() {} },
    document: {
        getElementById() { return null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        body: { classList: { add() {}, remove() {}, toggle() { return true; } } },
        // Vue 编译器解析含 & 的文本/属性时会用 DOM 做 HTML 实体解码
        createElement(tag) {
            const child = {
                _attrs: {},
                getAttribute(attr) { return this._attrs[attr] ?? null; },
            };
            const el = {
                tagName: String(tag).toUpperCase(),
                _html: '',
                children: [],
                getAttribute() { return null; },
                textContent: '',
            };
            Object.defineProperty(el, 'innerHTML', {
                get() { return this._html; },
                set(v) {
                    this._html = String(v);
                    el.textContent = this._html;
                    el.children = [];
                    // 模拟 decodeEntities(asAttr) 使用的 `<div foo="...">` 形态
                    const m = /^<(\w+)\s+([^>]+)>$/.exec(this._html);
                    if (m) {
                        const am = /^([\w-]+)="([^"]*)"$/.exec(m[2].trim());
                        if (am) {
                            child._attrs[am[1]] = am[2];
                            el.children.push(child);
                        }
                    }
                },
            });
            return el;
        },
    },
};
vm.runInNewContext(code, sandbox);
const Vue = sandbox.Vue;
if (!Vue.compile) {
    console.error('Vue 全局构建包未导出 compile（可能误用了 runtime-only 版本）');
    process.exit(1);
}

// 加载时所需的最小桩环境
const components = {};
global.window = {
    addEventListener() {},
    removeEventListener() {},
};
global.localStorage = {
    _s: {},
    getItem(k) { return this._s[k] ?? null; },
    setItem(k, v) { this._s[k] = String(v); },
    clear() { this._s = {}; },
};
global.document = sandbox.document;
global.Vue = Vue;
global.UI = {
    registerComponent(name, comp) { comp.name = name; components[name] = comp; },
    state: {},
    getMultiplier() { return 1; },
    getClassName(cls) { return cls; },
    getLocalResourcesForType() { return []; },
    getLocalResourcesForClass() { return []; },
    openTooltip() {},
    closeTooltip() {},
    tooltipDirective: {},
};

// 需要按加载顺序模拟的全局（仅保证脚本加载不报错）
const globals = ['GameState', 'RESOURCES_CONFIG', 'LOCAL_RESOURCES_CONFIG', 'BUILDINGS_CONFIG',
    'ACHIEVEMENTS_CONFIG', 'TECHS_CONFIG', 'EVENTS_CONFIG', 'UPGRADES_CONFIG', 'POLICIES_CONFIG',
    'PERMANENT_CONFIG', 'ChangelogData', 'Core', 'TradeEngine', 'ProductionEngine',
    'EffectsManager', 'ResourcesManager', 'Formulas', 'EventEffectHandler', 'GameLoop',
    'formatNumber', 'formatLocalNumber', 'formatTime', 'canAfford', 'checkUnlockCondition',
    'refreshAllVisibility', 'onTechResearched', 'getAffordabilityStatus', 'randomSeeded',
    'getTotalActiveChallengeStars', 'addEventLog', 'getResourceContributions',
    'addToQueue', 'removeFromQueue', 'processQueue', 'clearQueue', 'saveGame', 'loadGame',
    'exportGame', 'copyGameExportText', 'importGame', 'importGameFromFile', 'hardReset',
    'softReset', 'equipCrystal', 'unequipCrystal', 'discardCrystal', 'computeProductionAndCaps',
    'updateBuildingPrices', 'updateUpgradePrices', 'renderAll', 'refreshUI',
    'debugUnlockTech', 'debugBuild'];
globals.forEach(g => {
    if (!(g in global)) global[g] = function () {};
});

// 按 index.html 中的顺序加载 UI 文件
const uiFiles = ['common.js', 'tooltip.js', 'population.js', 'resourceBar.js', 'actions.js',
    'tabs.js', 'buildings.js', 'tech.js', 'policy.js', 'permanent.js', 'reset.js', 'trade.js',
    'crystal.js', 'changelog.js', 'achievements.js', 'log.js', 'queue.js', 'importModal.js',
    'app.js', 'index.js'];

for (const f of uiFiles) {
    const p = path.join(root, 'ui', f);
    if (!fs.existsSync(p)) { console.error('缺少 UI 文件:', f); process.exit(1); }
    require(p);
}

// 编译所有组件模板
let fail = 0;
for (const name of Object.keys(components)) {
    const comp = components[name];
    if (!comp.template) continue;
    try {
        Vue.compile(comp.template);
        console.log(`OK   ${name}`);
    } catch (e) {
        fail++;
        console.error(`FAIL ${name}: ${e.message}`);
        console.error(e.stack.split('\n').slice(0, 5).join('\n'));
    }
}
console.log('----');
console.log(`共 ${Object.keys(components).length} 个组件，${fail} 个模板编译失败`);
process.exit(fail ? 1 : 0);
