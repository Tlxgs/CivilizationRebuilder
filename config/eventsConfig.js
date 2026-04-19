// eventsConfig.js - 灵活的事件配置
const EVENTS_CONFIG = {
    // 每个事件独立配置
    "meteor_shower": {
        id: "meteor_shower",
        name: "流星雨",
        desc: "流星雨激发了研究灵感",
        effects: { 科学: 2.0 },
        durationDays: 50, 
        baseProbability: 1, 
        prereqTech: null, 
    },
    "iron_discovery": {
        id: "iron_discovery",
        name: "发现铁矿",
        desc: "大型铁矿脉被发现了",
        effects: { 铁: 3.0 },
        durationDays: 50,
        baseProbability: 1,
        prereqTech: "铁冶炼"         // 需要研究铁冶炼
    },
    "copper_discovery": {
        id: "copper_discovery",
        name: "发现铜矿",
        desc: "富铜矿脉带来惊喜",
        effects: { 铜: 3.0 },
        durationDays: 50,
        baseProbability: 1,
        prereqTech: "铜冶炼"
    },
    "gold_rush": {
        id: "gold_rush",
        name: "淘金热",
        desc: "人们狂热地寻找黄金",
        effects: { 金: 2.5 },
        durationDays: 50,
        baseProbability: 1,
        prereqTech: "金精炼"
    },
    "solar_flare": {
        id: "solar_flare",
        name: "太阳耀斑",
        desc: "太阳活动增强，电力产量下降",
        effects: { 电力: 0.6 },
        durationDays: 50,
        baseProbability: 1,
        prereqTech: "太阳能"
    },
    "oil_discovery": {
        id: "oil_discovery",
        name: "发现油田",
        desc: "发现了一片巨大油田",
        effects: { 石油: 3.0 },
        durationDays: 50,
        baseProbability: 1,
        prereqTech: "有机化学"
    }
};

// 辅助函数：获取所有当前可用的事件（根据科技解锁）
function getAvailableEvents(gameState) {
    const available = [];
    for (let key in EVENTS_CONFIG) {
        const ev = EVENTS_CONFIG[key];
        // 检查科技前置
        if (ev.prereqTech && (!gameState.techs[ev.prereqTech] || !gameState.techs[ev.prereqTech].researched)) {
            continue;
        }
        available.push(ev);
    }
    return available;
}

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
    return available[0]; // fallback
}

// 导出（浏览器环境直接挂载 window）
if (typeof window !== 'undefined') {
    window.EVENTS_CONFIG = EVENTS_CONFIG;
    window.getAvailableEvents = getAvailableEvents;
    window.selectRandomEvent = selectRandomEvent;
}