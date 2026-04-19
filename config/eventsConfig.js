// config/eventsConfig.js

const EVENTS_CONFIG = {
    // 基础示例：流星雨 - 固定乘数，随机持续时间
    "meteor_shower": {
        id: "meteor_shower",
        name: "流星雨",
        desc: "流星雨激发了研究灵感",
        durationDays: (state) => 30 + Math.floor(Math.random() * 40),  // 30~69天
        baseProbability: 1,
        prereqTech: null,
        effects: [
            { type: "resourceMultiplier", resource: "科学", multiplier: 2.0 }
        ]
    },

    // 铁陨石：立即获得资源，数量基于铁上限随机
    "iron_meteor": {
        id: "iron_meteor",
        name: "铁陨石坠落",
        desc: "一颗富含铁的陨石坠落在附近",
        durationDays: 1,
        baseProbability: 1,
        prereqTech: "铁冶炼",
        effects: [
            {
                type: "addResource",
                resource: "铁",
                amount: (state) => {
                    const cap = state.resources["铁"]?.cap || 100;
                    return Math.floor(30+cap * (0.01 + Math.random() * 0.1));
                }
            },
            {
                type: "addResource",
                resource: "石头",
                amount: (state) => {
                    const cap = state.resources["石头"]?.cap || 100;
                    return Math.floor(cap * 0.1+50);
                }
            }
        ]
    },

    "solar_eclipse": {
        id: "solar_eclipse",
        name: "日食",
        desc: "太阳被遮蔽，太阳能板效率大减",
        durationDays: (state) => 15 + Math.floor(Math.random() * 25),  // 15~39天
        baseProbability: 1,
        prereqTech: "太阳能",
        effects: [
            { 
                type: "buildingMultiplier", 
                building: "太阳能板", 
                field: "prod", 
                multiplier: 0.3 
            }
        ]
    },

    "worker_strike": {
        id: "worker_strike",
        name: "工人罢工",
        desc: "工人们不满工作条件，生产效率下降",
        durationDays: (state) => 10 + Math.floor(Math.random() * 20),  // 10~29天
        baseProbability: 1,
        prereqTech: "管理学",
        effects: [
            { type: "buildingMultiplier", building: "伐木场", field: "prod", multiplier: 0.5 },
            { type: "buildingMultiplier", building: "采石场", field: "prod", multiplier: 0.5 },
            { 
                type: "happinessMod", 
                value: -25
            }
        ]
    },

    "gold_rush": {
        id: "gold_rush",
        name: "淘金热",
        desc: "人们狂热地寻找黄金",
        durationDays: (state) => 40 + Math.floor(Math.random() * 30),  // 40~69天
        baseProbability: 1,
        prereqTech: "金精炼",
        effects: [
            { type: "resourceMultiplier", resource: "金", multiplier: 2.5 }
        ]
    },

    "solar_flare": {
        id: "solar_flare",
        name: "太阳耀斑",
        desc: "太阳活动增强，电力产量下降",
        durationDays: (state) => 20 + Math.floor(Math.random() * 40),  // 20~59天
        baseProbability: 1,
        prereqTech: "太阳能",
        effects: [
            { 
                type: "resourceMultiplier", 
                resource: "电力", 
                multiplier: (state) => 0.5 + Math.random() * 0.3  // 0.5~0.8之间随机
            }
        ]
    },

    "oil_discovery": {
        id: "oil_discovery",
        name: "发现油田",
        desc: "发现了一片巨大油田",
        durationDays: (state) => 60 + Math.floor(Math.random() * 40),  // 60~99天
        baseProbability: 1,
        prereqTech: "有机化学",
        effects: [
            { type: "resourceMultiplier", resource: "石油", multiplier: 3.0 },
            {
                type: "addResource",
                resource: "石油",
                amount: (state) => {
                    const cap = state.resources["石油"]?.cap || 50;
                    return Math.floor(cap * (0.5 + Math.random() * 0.5));  // 上限的50%~100%
                }
            }
        ]
    },

    "ancient_relic": {
        id: "ancient_relic",
        name: "古代遗物",
        desc: "挖掘出一个古代遗物，科学家们兴奋不已",
        durationDays: 1,
        baseProbability: 0.5,
        prereqTech: "探索遗迹",
        effects: [
            {
                type: "addResource",
                resource: "遗物",
                amount: (state) => 1 + Math.floor(Math.random() * 3)
            },
            {
                type: "addResource",
                resource: "科学",
                amount: (state) => {
                    const sciCap = state.resources["科学"]?.cap || 100;
                    return Math.floor(sciCap * (0.3 + Math.random() * 0.4));  // 上限的30%~70%
                }
            }
        ]
    },

    "tech_breakthrough": {
        id: "tech_breakthrough",
        name: "技术突破",
        desc: "科学家取得了重大突破",
        durationDays: (state) => 20 + Math.floor(Math.random() * 30),
        baseProbability: 0.8,
        prereqTech: "微积分",
        effects: [
            { type: "buildingMultiplier", building: "大学", field: "prod", multiplier: 1.5 },
            { type: "buildingMultiplier", building: "科学院", field: "prod", multiplier: 1.5 },
            {
                type: "addResource",
                resource: "科学",
                amount: (state) => {
                    const sciCap = state.resources["科学"]?.cap || 100;
                    return Math.floor(sciCap * 0.2);
                }
            }
        ]
    },

};

// 辅助函数：获取当前可用事件（根据科技解锁）
function getAvailableEvents(gameState) {
    const available = [];
    for (let key in EVENTS_CONFIG) {
        const ev = EVENTS_CONFIG[key];
        if (ev.prereqTech && (!gameState.techs[ev.prereqTech] || !gameState.techs[ev.prereqTech].researched)) {
            continue;
        }
        available.push(ev);
    }
    return available;
}

// 随机选择事件（基于权重）
function selectRandomEvent(gameState) {
    const available = getAvailableEvents(gameState);
    if (available.length === 0) return null;
    
    let totalWeight = 0;
    for (let ev of available) {
        totalWeight += ev.baseProbability;
    }
    if (totalWeight <= 0) return null;
    
    let rand = Math.random() * totalWeight;
    let accum = 0;
    for (let ev of available) {
        accum += ev.baseProbability;
        if (rand <= accum) return ev;
    }
    return available[0];
}

if (typeof window !== 'undefined') {
    window.EVENTS_CONFIG = EVENTS_CONFIG;
    window.getAvailableEvents = getAvailableEvents;
    window.selectRandomEvent = selectRandomEvent;
}