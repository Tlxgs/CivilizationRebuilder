// data.js - 重构后的 initGameData
/**
 * @typedef {Object} ResourceState
 * @property {number} amount
 * @property {number} production
 * @property {boolean} visible
 * @property {number} baseCap
 * @property {number} cap
 * @property {number} tradeHeat
 * @property {number} [value]
 * @property {number} [decayRate]
 */

/**
 * @typedef {Object} BuildingState
 * @property {number} count
 * @property {number} active
 * @property {boolean} visible
 * @property {Object.<string, number>} price
 * @property {number} [mode]
 * @property {number} [efficiency]
 */

/**
 * @typedef {Object} TechState
 * @property {Object.<string, number>} price
 * @property {string[] | null} prereq
 * @property {string} desc
 * @property {Object | null} effect
 * @property {boolean} researched
 * @property {Object | null} challenge
 * @property {boolean} challengeCompleted
 * @property {Function | null} unlockCondition
 */

/**
 * @typedef {Object} UpgradeState
 * @property {Object | null} unlockCondition
 * @property {Object.<string, number>} price
 * @property {Object | null} effect
 * @property {number} level
 * @property {boolean} visible
 * @property {string} desc
 * @property {Function} costFunc
 */

/**
 * @typedef {Object} PolicyOption
 * @property {number} price
 * @property {Object.<string, number>} prodFactor
 * @property {Object.<string, number>} consFactor
 * @property {Object.<string, number>} capFactor
 */

/**
 * @typedef {Object} PolicyState
 * @property {Object | null} unlockCondition
 * @property {string} activePolicy
 * @property {boolean} visible
 * @property {Object.<string, PolicyOption>} options
 */

/**
 * @typedef {Object} PermanentState
 * @property {string} name
 * @property {Object.<string, number>} price
 * @property {string} desc
 * @property {Object | null} effect
 * @property {string[] | null} prereq
 * @property {boolean} researched
 */

/**
 * @typedef {Object} CrystalEffect
 * @property {string} type
 * @property {string} target
 * @property {number} value
 */

/**
 * @typedef {Object} Crystal
 * @property {number} id
 * @property {string} name
 * @property {CrystalEffect[]} effects
 */

/**
 * @typedef {Object} CrystalsState
 * @property {(Crystal | null)[]} equipped
 * @property {Crystal[]} inventory
 */

/**
 * @typedef {Object} AchievementState
 * @property {string} name
 * @property {Object} effect
 * @property {string} effectText
 */

/**
 * @typedef {Object} RandomEvent
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {number} endDay
 * @property {Object[]} effects
 */

/**
 * @typedef {Object} EventLog
 * @property {string} dateStr
 * @property {string} text
 */

/**
 * @typedef {Object} LocalResourceState
 * @property {number} capacity
 * @property {number} used
 */

/**
 * @typedef {Object} GameState
 * @property {Object.<string, ResourceState>} resources
 * @property {Object.<string, BuildingState>} buildings
 * @property {Object.<string, number>} buildingEfficiency
 * @property {Object.<string, TechState>} techs
 * @property {Object.<string, UpgradeState>} upgrades
 * @property {Object.<string, PolicyState>} policies
 * @property {Object.<string, PermanentState>} permanent
 * @property {Object.<string, AchievementState>} achievements
 * @property {number} gameDays
 * @property {number} happiness
 * @property {number} speed
 * @property {Object.<string, number>} tradeRates
 * @property {number} maxTradeVolume
 * @property {number} userTradeVolume
 * @property {number} season
 * @property {number} seasonDayCounter
 * @property {number} lastSaveTime
 * @property {RandomEvent[]} activeRandomEvents
 * @property {EventLog[]} eventLogs
 * @property {Object[]} happinessContributions
 * @property {CrystalsState} crystals
 * @property {boolean} autoWarEnabled
 * @property {Object.<string, LocalResourceState>} localResources
 */

/** @type {GameState} */
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
    GameState.buildingEfficiency = {}
    for (let bKey in BUILDINGS_CONFIG) {
        const cfg = BUILDINGS_CONFIG[bKey];
        const initialPrice = cfg.cost(GameState, 0);
        GameState.buildings[bKey] = {
            count: 0,
            active: 0,
            visible: false,
            price: {...initialPrice },
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
            price: {...config.price },
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
    GameState.upgrades = {};
    for (let uKey in UPGRADES_CONFIG) {
        const cfg = UPGRADES_CONFIG[uKey];
        const initialPrice = cfg.cost(GameState, 0);
        GameState.upgrades[uKey] = {
            unlockCondition: cfg.unlockCondition ? {...cfg.unlockCondition } : null,
            price: {...initialPrice },
            effect: cfg.effect ? {...cfg.effect } : null,
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
        GameState.policies[pKey] = {
            unlockCondition: cfg.unlockCondition ? {...cfg.unlockCondition} : null,
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
    GameState.permanent = {};
    for (let permKey in PERMANENT_CONFIG) {
        const cfg = PERMANENT_CONFIG[permKey];
        GameState.permanent[permKey] = {
            name: cfg.name || permKey,
            price: {...cfg.price },
            desc: cfg.desc,
            effect: cfg.effect ? {...cfg.effect } : null,
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
    if (!GameState.seed) {
        GameState.seed = Date.now() >>> 0;
    }
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
    GameState.queue = [];
    GameState.achievements = GameState.achievements || {};

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