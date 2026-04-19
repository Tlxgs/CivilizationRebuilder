// config/upgradesConfig.js
const UPGRADES_CONFIG = {
    "伐木场优化": { 
        unlockCondition: { tech: "林业工程" },
        basePrice: {木头:1500, 科学:300}, growth: 1.05,
        effect: {伐木场: 0.03}, level: 0, desc: "伐木场效率+3%/级" 
    },
    "采石场优化": { 
        unlockCondition: { tech: "高效采石" },
        basePrice: {石头:1500, 科学:300}, growth: 1.05,
        effect: {采石场: 0.03}, level: 0, desc: "采石场效率+3%/级" 
    },
    "储存优化": { 
        unlockCondition: { tech: "压缩存储技术" },
        basePrice: {建材:50, 科学:600}, growth: 1.05,
        effect: {仓库:0.01, 集装箱:0.01, 大型仓库:0.01}, level: 0,
        desc: "仓库/集装箱/大型仓库效率+1%/级" 
    },
    "工厂优化": { 
        unlockCondition: { tech: "运筹学" },
        basePrice: {金属板:50, 科学:600}, growth: 1.05,
        effect: {建材工厂:0.02, 金属加工厂:0.02, 塑料厂:0.02}, level: 0,
        desc: "建材/金属加工/塑料厂效率+2%/级" 
    },
    "高速反应堆": {
        unlockCondition: { tech: "核裂变改进" },
        basePrice: {核燃料:50, 科学:1500}, growth: 1.05,
        effect: {裂变反应堆:0.01}, level: 0,
        desc: "裂变反应堆效率+1%/级"
    },
    "聚变规模化": {
        unlockCondition: { tech: "聚变规模化" },
        basePrice: {氚:2000, 科学:20000}, growth: 1.05,
        effect: {聚变反应堆:0.01}, level: 0,
        desc: "聚变反应堆效率+1%/级"
    },
    "宜居化改造": {
        unlockCondition: { tech: "宜居化改造" },
        basePrice: {钛:500, 科学:3000}, growth: 1.05,
        effect: {月球基地:0.01}, level: 0,
        desc: "月球基地效率+1%/级"
    }
};