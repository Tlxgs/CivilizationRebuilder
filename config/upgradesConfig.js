// config/upgradesConfig.js

function standardUpgradeCost(baseCostMap, growth, level, globalCostMult = 1.0) {
    const effectiveGrowth = 1 + (growth - 1) * globalCostMult;
    const price = {};
    for (let res in baseCostMap) {
        price[res] = Math.floor(baseCostMap[res] * Math.pow(effectiveGrowth, level));
    }
    return price;
}

function getGlobalCostMultiplier(state) {
    return 1 + (EffectsManager?.getAdditiveValue?.('global.cost') || 0);
}

const UPGRADES_CONFIG = {
    "伐木场优化": { 
        unlockCondition: { tech: "林业工程" },
        cost: (state, level) => standardUpgradeCost({木头:1500, 科学:300}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {伐木场: 0.03}, level: 0, desc: "引进更高效的链锯和林木培育技术，伐木场效率提高3%，可重复升级。" 
    },
    "采石场优化": { 
        unlockCondition: { tech: "高效采石" },
        cost: (state, level) => standardUpgradeCost({石头:1500, 科学:300}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {采石场: 0.03}, level: 0, desc: "改用金刚石钻头和自动化破碎锤，采石场效率提高3%，可重复升级。" 
    },
    "储存优化": { 
        unlockCondition: { tech: "压缩存储技术" },
        cost: (state, level) => standardUpgradeCost({建材:50, 科学:600}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {仓库:0.01, 集装箱:0.01, 大型仓库:0.01}, level: 0,
        desc: "立体货架和智能堆垛机，使仓库/集装箱/大型仓库的容量提高1%，可多次升级。" 
    },
    "空间储存优化": { 
        unlockCondition: { tech: "深空存储技术" },
        cost: (state, level) => standardUpgradeCost({生物合金:500, 科学:5000}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {空间仓库:0.01}, level: 0,
        desc: "在太空中进行合理排布，使空间仓库的容量提高1%，可多次升级。" 
    },
    "高速冶炼":{
        unlockCondition: { tech: "高速冶炼" },
        cost: (state, level) => standardUpgradeCost({煤:50, 科学:600}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {铁冶炼厂:0.02,铜冶炼厂:0.02}, level: 0,
        desc: "加大冶炼厂的功率，使铜/铁冶炼厂速度提高2%/级,这会同时增加消耗。" 
    },
    "工厂优化": { 
        unlockCondition: { tech: "运筹学" },
        cost: (state, level) => standardUpgradeCost({金属板:50, 科学:600}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {建材工厂:0.02, 金属加工厂:0.02, 塑料厂:0.02}, level: 0,
        desc: "运用精益生产和六西格玛管理，建材、金属加工和塑料厂效率提升2%/级，这会同时增加消耗。" 
    },
    "高速反应堆": {
        unlockCondition: { tech: "核裂变改进" },
        cost: (state, level) => standardUpgradeCost({核燃料:50, 科学:1500}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {裂变反应堆:0.01}, level: 0,
        desc: "使用碳化硅控制棒和更高效的热交换器，裂变反应堆发电效率+1%/级，这会同时增加消耗。" 
    },
    "聚变规模化": {
        unlockCondition: { tech: "聚变规模化" },
        cost: (state, level) => standardUpgradeCost({氚:2000, 科学:20000}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {聚变反应堆:0.01}, level: 0,
        desc: "增加更多磁线圈和真空舱段，聚变反应堆的输出提升1%/级，这会同时增加消耗。" 
    },
    "高效戴森球": {
        unlockCondition: { tech: "高效戴森球" },
        cost: (state, level) => standardUpgradeCost({生物合金:50000, 科学:50000}, 1.05, level, getGlobalCostMultiplier(state)),
        effect: {戴森球:0.01}, level: 0,
        desc: "使用生物合金提高戴森球效率1%/级。" 
    },
};