// config/upgradesConfig.js

// 辅助函数：标准升级价格（保持与原公式一致）
function standardUpgradeCost(baseCostMap, growth, level, globalCostMult = 1.0) {
    const effectiveGrowth = 1 + (growth - 1) * globalCostMult;
    const price = {};
    for (let res in baseCostMap) {
        price[res] = Math.floor(baseCostMap[res] * Math.pow(effectiveGrowth, level));
    }
    return price;
}

// 获取全局成本倍率（来自永恒升级等）
function getGlobalCostMultiplier(state) {
    return 1 + (window.EffectsManager?.getAdditiveValue?.('global.cost') || 0);
}

const UPGRADES_CONFIG = {
    "伐木场优化": { 
        unlockCondition: { tech: "林业工程" },
        // 原 basePrice: {木头:1500, 科学:300}, growth: 1.05
        cost: (state, level) => standardUpgradeCost(
            {木头:1500, 科学:300}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {伐木场: 0.03}, level: 0, desc: "伐木场效率+3%/级" 
    },
    "采石场优化": { 
        unlockCondition: { tech: "高效采石" },
        cost: (state, level) => standardUpgradeCost(
            {石头:1500, 科学:300}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {采石场: 0.03}, level: 0, desc: "采石场效率+3%/级" 
    },
    "储存优化": { 
        unlockCondition: { tech: "压缩存储技术" },
        cost: (state, level) => standardUpgradeCost(
            {建材:50, 科学:600}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {仓库:0.01, 集装箱:0.01, 大型仓库:0.01}, level: 0,
        desc: "仓库/集装箱/大型仓库效率+1%/级" 
    },
    "工厂优化": { 
        unlockCondition: { tech: "运筹学" },
        cost: (state, level) => standardUpgradeCost(
            {金属板:50, 科学:600}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {建材工厂:0.02, 金属加工厂:0.02, 塑料厂:0.02}, level: 0,
        desc: "建材/金属加工/塑料厂效率+2%/级。"
    },
    "高速反应堆": {
        unlockCondition: { tech: "核裂变改进" },
        cost: (state, level) => standardUpgradeCost(
            {核燃料:50, 科学:1500}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {裂变反应堆:0.01}, level: 0,
        desc: "裂变反应堆效率+1%/级"
    },
    "聚变规模化": {
        unlockCondition: { tech: "聚变规模化" },
        cost: (state, level) => standardUpgradeCost(
            {氚:2000, 科学:20000}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {聚变反应堆:0.01}, level: 0,
        desc: "聚变反应堆效率+1%/级"
    },
    "宜居化改造": {
        unlockCondition: { tech: "宜居化改造" },
        cost: (state, level) => standardUpgradeCost(
            {钛:500, 科学:3000}, 1.05, level, getGlobalCostMultiplier(state)
        ),
        effect: {月球基地:0.01}, level: 0,
        desc: "月球基地效率+1%/级"
    }
};