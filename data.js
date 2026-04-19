// data.js

// 全局游戏状态
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
    GameState.seasonDayCounter = 0;   // 当前季节已过天数
    GameState.resources = {};
    for (let rKey in RESOURCES_CONFIG) {
        const cfg = RESOURCES_CONFIG[rKey];
        // 创建资源对象，包含运行时字段和配置字段的副本
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

    GameState.buildings = {};
    for (let bKey in BUILDINGS_CONFIG) {
        const cfg = BUILDINGS_CONFIG[bKey];
        GameState.buildings[bKey] = {
            count: 0,
            active: 0,
            visible: false,
            price: { ...cfg.basePrice }
        };
    }
    GameState.techs = {};
    for (let techKey in TECHS_CONFIG) {
        const config = TECHS_CONFIG[techKey];
        // 复制一份，避免引用污染
        GameState.techs[techKey] = {
            price: { ...config.price },
            prereq: config.prereq ? [...config.prereq] : null,
            desc: config.desc,
            unlocks: config.unlocks ? [...config.unlocks] : [],
            unlocksPolicies: config.unlocksPolicies ? [...config.unlocksPolicies] : [],
            unlocksUpgrades: config.unlocksUpgrades ? [...config.unlocksUpgrades] : [],
            effect: config.effect ? JSON.parse(JSON.stringify(config.effect)) : null,
            researched: config.researched || false
        };
    }

    // ==================== 升级定义 ====================
    GameState.upgrades = {
        "伐木场优化": { basePrice: {木头:1500,科学:300}, price: {木头:1500,科学:300}, growth: 1.05,
            effect: {伐木场: 0.03}, level: 0, visible: false, desc: "伐木场效率+3%/级" },
        "采石场优化": { basePrice: {石头:1500,科学:300}, price: {石头:1500,科学:300}, growth: 1.05,
            effect: {采石场: 0.03}, level: 0, visible: false, desc: "采石场效率+3%/级" },
        "储存优化": { basePrice: {建材:50,科学:600}, price: {建材:50,科学:600}, growth: 1.05,
            effect: {仓库:0.01,集装箱:0.01,大型仓库:0.01}, level: 0, visible: false,
            desc: "仓库/集装箱/大型仓库效率+1%/级" },
        "工厂优化": { basePrice: {金属板:50,科学:600}, price: {金属板:50,科学:600}, growth: 1.05,
            effect: {建材工厂:0.02,金属加工厂:0.02,塑料厂:0.02}, level: 0, visible: false,
            desc: "建材/金属加工/塑料厂效率+2%/级" },
        "高速反应堆":{basePrice:{核燃料:50,科学:1500},price:{核燃料:50,科学:1500},growth:1.05,
            effect:{裂变反应堆:0.01},level:0,visible:false,
            desc: "裂变反应堆效率+1%/级"},
        "聚变规模化":{basePrice:{氚:2000,科学:20000},price:{氚:2000,科学:20000},growth:1.05,
            effect:{聚变反应堆:0.01},level:0,visible:false,
            desc:"聚变反应堆效率+1%/级"},
        "宜居化改造":{basePrice:{钛:500,科学:3000},price:{钛:500,科学:3000},growth:1.05,
            effect:{月球基地:0.01},level:0,visible:false,
            desc:"月球基地效率+1%/级"}
    };

    // ==================== 政策定义 ====================
    GameState.policies = {
        "基础资源政策": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视林业": { price: 20, prodFactor: {伐木场: 0.80,采石场: -0.5} },
                "重视矿业": { price: 20, prodFactor: {采石场: 0.80,伐木场: -0.5}}
            }
        },
        "冶炼方式": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视节能": { price: 40, prodFactor: {铜冶炼厂: -0.20, 铁冶炼厂: -0.20},
                            consFactor: {铜冶炼厂: -0.40, 铁冶炼厂: -0.40} },
                "重视速度": { price: 40, prodFactor: {铜冶炼厂: 0.50, 铁冶炼厂: 0.50},
                            consFactor: {铜冶炼厂: 0.80, 铁冶炼厂: 0.80} }
            }
        },
        "经济观念": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "科学至上": { price: 60, prodFactor: {图书馆:1.0, 大学:1.0, 金矿:-0.30},
                            capFactor: {图书馆:0.05, 大学:0.05} },
                "金钱至上": { price: 60, prodFactor: {图书馆:-0.80, 大学:-0.80, 金矿:0.30} }
            }
        },
        "能源政策": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视清洁能源": { price: 200, prodFactor: {太阳能板:1.0, 裂变反应堆:0.2, 聚变反应堆:0.1,石油发电厂:-0.6,蒸汽机:-0.6}, },
                "发展传统能源": { price: 200, prodFactor: {石油发电厂:0.30, 蒸汽机:0.30, 太阳能板:-0.80} }
            }
        }
    };

    // ==================== 永恒升级 ====================
    GameState.permanent = {
        "节约成本I": { price: {遗物: 10}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: null },
        "节约成本II": { price: {遗物: 30}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本I"] },
        "节约成本III": { price: {遗物: 100}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本II"] },
        "节约成本IV": { price: {遗物: 200}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本III"] },
        "节约成本V": { price: {遗物: 500}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本IV"] },
        "节约成本VI": { price: {遗物: 1000,暗能量:10}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本V"] },
        "节约成本VII": { price: {遗物: 1500,暗能量:20}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VI"] },
        "节约成本VIII": { price: {遗物: 2000,暗能量:40}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VII"] },
        "节约成本IX": { price: {遗物: 2500,暗能量:80}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VIII"] },
        "节约成本X": { price: {遗物: 3000,暗能量:160}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本IX"] },
        "高效生产I": { price: {遗物: 1}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: null },
        "高效生产II": { price: {遗物: 5}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产I"] },
        "高效生产III": { price: {遗物: 10}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产II"] },
        "高效生产IV": { price: {遗物: 20}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产III"] },
        "高效生产V": { price: {遗物: 30}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IV"] },
        "高效生产VI": { price: {遗物: 40}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产V"] },
        "高效生产VII": { price: {遗物: 50}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VI"] },
        "高效生产VIII": { price: {遗物: 60}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VII"] },
        "高效生产IX": { price: {遗物: 80}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VIII"] },
        "高效生产X": { price: {遗物: 100}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IX"] },
        "高速生产I": { price: {遗物: 10}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: null },
        "高速生产II": { price: {遗物: 20}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产I"] },
        "高速生产III": { price: {遗物: 40}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产II"] },
        "高速生产IV": { price: {遗物: 80}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产III"] },
        "高速生产V": { price: {遗物: 160}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产IV"] },
        "高速生产VI": { price: {遗物: 240}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产V"] },
        "高速生产VII": { price: {遗物: 360}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VI"] },
        "高速生产VIII": { price: {遗物: 480}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VII"] },
        "高速生产IX": { price: {遗物: 600}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VIII"] },
        "高速生产X": { price: {遗物: 800}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产IX"] },
        "空间压缩I": { price: {遗物: 5}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: null },
        "空间压缩II": { price: {遗物: 20}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩I"] },
        "空间压缩III": { price: {遗物: 100}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩II"] },
        "空间压缩IV": { price: {遗物: 200}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩III"] },
        "空间压缩V": { price: {遗物: 400}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩IV"] },
        "技术爆炸": { price: {遗物: 50}, researched: false, desc: "根据遗物数量提升少量科学上限", effect: { sciCapPerRelicLog: 0.05 }, prereq: null },
        "宇宙学": { price: {遗物: 50,暗能量:1}, researched: false, desc: "研究宇宙的奥秘，提高太空建筑产量10%(消耗不变)", effect: {globalSpaceProd:0.10}, prereq: null },
        "宇宙起源": { price: {遗物: 500,暗能量:100}, researched: false, desc: "研究宇宙起源的学科，提高太空建筑产量20%(消耗不变)", effect: {globalSpaceProd:0.20}, prereq: null },
        
    };

    // 初始化建筑价格及其他辅助字段
    for (let b in GameState.buildings) {
        let bd = GameState.buildings[b];
        bd.count = bd.count || 0;
        bd.active = bd.active || 0;
        bd.visible = bd.visible || false;
    }
    GameState.happinessContributions = [];
    GameState.gameDays = 0;               // 总天数（0年1日 = 0）
    GameState.activeRandomEvents = [];
    GameState.eventLogs = [];              // 日志数组，每项 { dateStr, text }
    GameState.happinessContributions = [];
        GameState.crystals = {
        equipped: [null, null, null], 
        inventory: []                   // 库存，最多3个
    };
}
