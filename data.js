// data.js
let GameState = {
    resources: {},
    buildings: {},
    techs: {},
    upgrades: {},
    policies: {},
    permanent: {},
    gameTime: 0
};

function initGameData() {
    GameState.happiness = 100;
    GameState.season = 0;
    GameState.seasonDayCounter = 0;
    
    // 初始化资源
    GameState.resources = {};
    for (let rKey in RESOURCES_CONFIG) {
        const cfg = RESOURCES_CONFIG[rKey];
        GameState.resources[rKey] = {
            amount: 0,
            production: 0,
            visible: false,
            baseCap: cfg.baseCap,
            cap: cfg.baseCap,
        };
        for (let prop in cfg) {
            if (!GameState.resources[rKey].hasOwnProperty(prop)) {
                GameState.resources[rKey][prop] = cfg[prop];
            }
        }
    }

    // 初始化建筑
    GameState.buildings = {};
    for (let bKey in BUILDINGS_CONFIG) {
        const cfg = BUILDINGS_CONFIG[bKey];
        // 初始 count = 0，调用 cost 函数得到初始价格
        const initialPrice = cfg.cost(GameState, 0);
        GameState.buildings[bKey] = {
            count: 0,
            active: 0,
            visible: false,
            price: { ...initialPrice }   // 深拷贝价格对象
        };
    }

    // 初始化科技
    GameState.techs = {};
    for (let techKey in TECHS_CONFIG) {
        const config = TECHS_CONFIG[techKey];
        GameState.techs[techKey] = {
            price: { ...config.price },
            prereq: config.prereq ? [...config.prereq] : null,
            desc: config.desc,
            effect: config.effect ? JSON.parse(JSON.stringify(config.effect)) : null,
            researched: config.researched || false
        };
    }
    // 初始化升级（从配置读取）
    GameState.upgrades = {};
    for (let uKey in UPGRADES_CONFIG) {
        const cfg = UPGRADES_CONFIG[uKey];
        const initialPrice = cfg.cost(GameState, 0);
        GameState.upgrades[uKey] = {
            unlockCondition: cfg.unlockCondition ? { ...cfg.unlockCondition } : null,
            price: { ...initialPrice },        // 深拷贝价格
            effect: cfg.effect ? { ...cfg.effect } : null,
            level: cfg.level || 0,
            visible: false,
            desc: cfg.desc,
            costFunc: cfg.cost
        };
    }

    // 初始化政策
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

    // 初始化永恒升级
    GameState.permanent = {};
    for (let permKey in PERMANENT_CONFIG) {
        const cfg = PERMANENT_CONFIG[permKey];
        GameState.permanent[permKey] = {
            price: { ...cfg.price },
            desc: cfg.desc,
            effect: cfg.effect ? { ...cfg.effect } : null,
            prereq: cfg.prereq ? [...cfg.prereq] : null,
            researched: false
        };
    }

    refreshAllVisibility();

    for (let b in GameState.buildings) {
        let bd = GameState.buildings[b];
        bd.count = bd.count || 0;
        bd.active = bd.active || 0;
    }
    GameState.happinessContributions = [];
    GameState.gameDays = 0;
    GameState.activeRandomEvents = [];
    GameState.eventLogs = [];
    GameState.crystals = {
        equipped: [null, null, null],
        inventory: []
    };
}