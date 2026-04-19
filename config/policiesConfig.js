// config/policiesConfig.js
const POLICIES_CONFIG = {
    "基础资源政策": {
        unlockCondition: { tech: "管理学" },
        activePolicy: "默认",
        options: {
            "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
            "重视林业": { price: 20, prodFactor: {伐木场: 0.80, 采石场: -0.5} },
            "重视矿业": { price: 20, prodFactor: {采石场: 0.80, 伐木场: -0.5}}
        }
    },
    "冶炼方式": {
        unlockCondition: { tech: "冶炼管理" },
        activePolicy: "默认",
        options: {
            "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
            "重视节能": { price: 40, prodFactor: {铜冶炼厂: -0.20, 铁冶炼厂: -0.20},
                        consFactor: {铜冶炼厂: -0.40, 铁冶炼厂: -0.40} },
            "重视速度": { price: 40, prodFactor: {铜冶炼厂: 0.50, 铁冶炼厂: 0.50},
                        consFactor: {铜冶炼厂: 0.80, 铁冶炼厂: 0.80} }
        }
    },
    "经济观念": {
        unlockCondition: { tech: "金融学" },
        activePolicy: "默认",
        options: {
            "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
            "科学至上": { price: 60, prodFactor: {图书馆:1.0, 大学:1.0, 金矿:-0.30},
                        capFactor: {图书馆:0.05, 大学:0.05} },
            "金钱至上": { price: 60, prodFactor: {图书馆:-0.80, 大学:-0.80, 金矿:0.30} }
        }
    },
    "能源政策": {
        unlockCondition: { tech: "能源规划" },
        activePolicy: "默认",
        options: {
            "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
            "重视清洁能源": { price: 200, prodFactor: {太阳能板:1.0, 裂变反应堆:0.2, 聚变反应堆:0.1, 石油发电厂:-0.6, 蒸汽机:-0.6} },
            "发展传统能源": { price: 200, prodFactor: {石油发电厂:0.30, 蒸汽机:0.30, 太阳能板:-0.80} }
        }
    }
};