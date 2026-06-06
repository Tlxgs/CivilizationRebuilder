// data.js - 初始化数据并转为 Vue 响应式对象
// 定义原始数据容器
const rawGameState = {
    resources: {},
    buildings: {},
    techs: {},
    upgrades: {},
    policies: {},
    permanent: {},
    achievements: {},
    gameDays: 0,
    happiness: 100,
    speed: 1,
    tradeRates: {},
    maxTradeVolume: 0,
    userTradeVolume: 0,
    activeRandomEvents: [],
    eventLogs: [],
    happinessContributions: [],
    crystals: { equipped: [null, null, null], inventory: [] },
    queue: [],
    autoWarEnabled: false,
    localResources: {},
    buildingEfficiency: {},
    seed: null,
    lastSaveTime: null,
};

// 原有的初始化函数（保持不变，只是操作 rawGameState）
function initResources() {
    for (let rKey in RESOURCES_CONFIG) {
        const cfg = RESOURCES_CONFIG[rKey];
        rawGameState.resources[rKey] = {
            amount: 0,
            production: 0,
            visible: false,
            baseCap: cfg.baseCap,
            cap: cfg.baseCap,
            tradeHeat: 0,
        };
        for (let prop in cfg) {
            if (prop === 'heat') continue;
            if (!rawGameState.resources[rKey].hasOwnProperty(prop)) {
                rawGameState.resources[rKey][prop] = cfg[prop];
            }
        }
    }
}

function initLocalResources() {
    rawGameState.localResources = {};
    for (let lrKey in LOCAL_RESOURCES_CONFIG) {
        rawGameState.localResources[lrKey] = { capacity: 0, used: 0 };
    }
}

function initBuildings() {
    rawGameState.buildings = {};
    rawGameState.buildingEfficiency = {};
    for (let bKey in BUILDINGS_CONFIG) {
        const cfg = BUILDINGS_CONFIG[bKey];
        const initialPrice = cfg.cost(rawGameState, 0);
        rawGameState.buildings[bKey] = {
            count: 0,
            active: 0,
            visible: false,
            price: { ...initialPrice },
            mode: (cfg.modes && cfg.modes.length > 0) ? 0 : undefined,
        };
    }
}

function initTechs() {
    rawGameState.techs = {};
    for (let techKey in TECHS_CONFIG) {
        const config = TECHS_CONFIG[techKey];
        rawGameState.techs[techKey] = {
            price: { ...config.price },
            prereq: config.prereq ? [...config.prereq] : null,
            desc: config.desc,
            effect: config.effect ? JSON.parse(JSON.stringify(config.effect)) : null,
            researched: config.researched || false,
            challenge: config.challenge ? JSON.parse(JSON.stringify(config.challenge)) : null,
            challengeCompleted: false,
            unlockCondition: config.unlockCondition,
        };
    }
}

function initUpgrades() {
    rawGameState.upgrades = {};
    for (let uKey in UPGRADES_CONFIG) {
        const cfg = UPGRADES_CONFIG[uKey];
        const initialPrice = cfg.cost(rawGameState, 0);
        rawGameState.upgrades[uKey] = {
            unlockCondition: cfg.unlockCondition ? { ...cfg.unlockCondition } : null,
            price: { ...initialPrice },
            effect: cfg.effect ? { ...cfg.effect } : null,
            level: cfg.level || 0,
            visible: false,
            desc: cfg.desc,
            costFunc: cfg.cost
        };
    }
}

function initPolicies() {
    rawGameState.policies = {};
    for (let pKey in POLICIES_CONFIG) {
        const cfg = POLICIES_CONFIG[pKey];
        rawGameState.policies[pKey] = {
            unlockCondition: cfg.unlockCondition ? { ...cfg.unlockCondition } : null,
            currentValue: cfg.defaultValue,
            visible: false,
            min: cfg.min,
            max: cfg.max,
            step: cfg.step,
            unit: cfg.unit || "",
        };
    }
}

function initPermanent() {
    rawGameState.permanent = {};
    for (let permKey in PERMANENT_CONFIG) {
        const cfg = PERMANENT_CONFIG[permKey];
        rawGameState.permanent[permKey] = {
            name: cfg.name || permKey,
            price: { ...cfg.price },
            desc: cfg.desc,
            effect: cfg.effect ? { ...cfg.effect } : null,
            prereq: cfg.prereq ? [...cfg.prereq] : null,
            researched: false
        };
    }
}

function initTrade() {
    rawGameState.tradeRates = {};
    rawGameState.maxTradeVolume = 0;
    rawGameState.userTradeVolume = 0;
    for (let r in RESOURCES_CONFIG) {
        if (RESOURCES_CONFIG[r].value !== undefined && r !== "金") {
            rawGameState.tradeRates[r] = 0;
        }
    }
}

function initGameData() {
    rawGameState.happiness = 100;
    if (!rawGameState.seed) rawGameState.seed = Date.now() >>> 0;
    rawGameState.gameDays = 0;
    rawGameState.activeRandomEvents = [];
    rawGameState.eventLogs = [];
    rawGameState.happinessContributions = [];
    rawGameState.speed = 1;
    rawGameState.lastSaveTime = null;
    rawGameState.crystals = { equipped: [null, null, null], inventory: [] };
    rawGameState.queue = [];
    rawGameState.achievements = {};

    initResources();
    initLocalResources();
    initBuildings();
    initTechs();
    initUpgrades();
    initPolicies();
    initPermanent();
    initTrade();
    rawGameState.autoWarEnabled = false;
    if (typeof refreshAllVisibility === 'function') refreshAllVisibility();
}

// 关键：将原始对象转为 Vue 响应式对象
const GameState = Vue.reactive(rawGameState);
window.GameState = GameState;

// 执行初始化
initGameData();

// 如果没有定义 getTotalActiveChallengeStars 等，补充默认（你的 logic.js 应该有）