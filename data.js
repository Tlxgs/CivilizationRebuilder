// data.js - 重构后的 initGameData

let GameState = {
    resources: {},
    buildings: {},
    techs: {},
    upgrades: {},
    policies: {},
    permanent: {},
    achievements: {}, 
    gameTime: 0
};

// ---------- 辅助初始化函数 ----------
function initResources() {
    GameState.resources = {};
    for (let rKey in RESOURCES_CONFIG) {
        const cfg = RESOURCES_CONFIG[rKey];
        GameState.resources[rKey] = {
            amount: 0,
            production: 0,
            visible: false,
            baseCap: cfg.baseCap,
            cap: cfg.baseCap,
            tradeHeat: 0,
        };
        for (let prop in cfg) {
            if (prop === 'heat') continue;
            if (!GameState.resources[rKey].hasOwnProperty(prop)) {
                GameState.resources[rKey][prop] = cfg[prop];
            }
        }
    }
}

function initLocalResources() {
    GameState.localResources = {};
    for (let lrKey in LOCAL_RESOURCES_CONFIG) {
        GameState.localResources[lrKey] = {
            capacity: 0,
            used: 0
        };
    }
}

function initBuildings() {
    GameState.buildings = {};
    GameState.buildingEfficiency={}
    for (let bKey in BUILDINGS_CONFIG) {
        const cfg = BUILDINGS_CONFIG[bKey];
        const initialPrice = cfg.cost(GameState, 0);
        GameState.buildings[bKey] = {
            count: 0,
            active: 0,
            visible: false,
            price: { ...initialPrice },
            mode: (cfg.modes && cfg.modes.length > 0) ? 0 : undefined,
            providesLocal: cfg.providesLocal || {},
            requiresLocal: cfg.requiresLocal || {},
        };
    }
}

function initTechs() {
    GameState.techs = {};
    for (let techKey in TECHS_CONFIG) {
        const config = TECHS_CONFIG[techKey];
        GameState.techs[techKey] = {
            price: { ...config.price },
            prereq: config.prereq ? [...config.prereq] : null,
            desc: config.desc,
            effect: config.effect ? JSON.parse(JSON.stringify(config.effect)) : null,
            researched: config.researched || false,
            challenge: config.challenge ? JSON.parse(JSON.stringify(config.challenge)) : null,
            challengeCompleted: false,   // 新增：标记该挑战的永久成就是否已解锁
        };
    }
}

function initUpgrades() {
    GameState.upgrades = {};
    for (let uKey in UPGRADES_CONFIG) {
        const cfg = UPGRADES_CONFIG[uKey];
        const initialPrice = cfg.cost(GameState, 0);
        GameState.upgrades[uKey] = {
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
    GameState.policies = {};
    for (let pKey in POLICIES_CONFIG) {
        const cfg = POLICIES_CONFIG[pKey];
        const optionsCopy = {};
        for (let optKey in cfg.options) {
            optionsCopy[optKey] = {
                price: cfg.options[optKey].price,
                prodFactor: cfg.options[optKey].prodFactor ? { ...cfg.options[optKey].prodFactor } : {},
                consFactor: cfg.options[optKey].consFactor ? { ...cfg.options[optKey].consFactor } : {},
                capFactor: cfg.options[optKey].capFactor ? { ...cfg.options[optKey].capFactor } : {}
            };
        }
        GameState.policies[pKey] = {
            unlockCondition: cfg.unlockCondition ? { ...cfg.unlockCondition } : null,
            activePolicy: cfg.activePolicy,
            visible: false,
            options: optionsCopy
        };
    }
}

function initPermanent() {
    GameState.permanent = {};
    for (let permKey in PERMANENT_CONFIG) {
        const cfg = PERMANENT_CONFIG[permKey];
        GameState.permanent[permKey] = {
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
    GameState.tradeRates = {};
    GameState.maxTradeVolume = 0;
    GameState.userTradeVolume = 0;
    for (let r in RESOURCES_CONFIG) {
        if (RESOURCES_CONFIG[r].value !== undefined && r !== "金") {
            GameState.tradeRates[r] = 0;
        }
    }
}

function initGameData() {
    GameState.happiness = 100;
    GameState.season = 0;
    GameState.seasonDayCounter = 0;
    GameState.gameDays = 0;
    GameState.activeRandomEvents = [];
    GameState.eventLogs = [];
    GameState.happinessContributions = [];
    GameState.speed = 1;
    GameState.lastSaveTime = null;
    GameState.crystals = {
        equipped: [null, null, null],
        inventory: []
    };
    GameState.achievements = GameState.achievements || {};
    GameState.activeChallenges = GameState.activeChallenges || [];

    initResources();
    initLocalResources();
    initBuildings();
    initTechs();
    initUpgrades();
    initPolicies();
    initPermanent();
    initTrade();
    GameState.autoWarEnabled = false; 
    refreshAllVisibility();

    for (let b in GameState.buildings) {
        let bd = GameState.buildings[b];
        bd.count = bd.count || 0;
        bd.active = bd.active || 0;
    }
}