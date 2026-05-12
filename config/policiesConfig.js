const POLICIES_CONFIG = {
    "税收政策": {
        unlockCondition: { tech: "银行学" },
        min: 0, max: 50, step: 1, defaultValue: 25, unit: "%", costPerUnit: 1,
        desc: "调整税率，影响金矿产出和民众幸福度",
        getEffects: (value) => ({
            prodFactor: { "金矿": (value-25) * 0.04 },
            consFactor: {},
            capFactor: {},
            happinessMod: -(value-25) * 0.5
        })
    },
    "基础资源": {
        unlockCondition: { tech: "管理学" },
        min: -50, max: 50, step: 1, defaultValue: 0, unit: "", costPerUnit: 1,
        desc: "调整伐木场和采石场产出，负数伐木场，正数采石场",
        getEffects: (value) => ({
            prodFactor: { "伐木场": value * (-0.02),"采石场": value* (0.02)},
            consFactor: {},
            capFactor: {},
        })
    },
    "冶炼管理": {
        unlockCondition: { tech: "冶炼管理" },
        min: -20, max: 50, step: 1, defaultValue: 0, unit: "", costPerUnit: 2,
        desc: "调整铜铁冶炼偏重：负值节能，正值提速",
        getEffects: (value) => ({
            prodFactor: { 
                "铜冶炼厂": value * 0.01,
                "铁冶炼厂": value * 0.01 
            },
            consFactor: { 
                "铜冶炼厂": value * 0.02,
                "铁冶炼厂": value * 0.02 
            },
            capFactor: {}
        })
    },
    "经济观念": {
        unlockCondition: { tech: "金融学" },
        min: -25, max: 25, step: 1, defaultValue: 0, unit: "", costPerUnit: 5,
        desc: "调整经济重心：负值偏向金钱，正值偏向科学",
        getEffects: (value) => ({
            prodFactor: { 
                "图书馆": (Math.pow(Math.abs(25+value),0.5)-5) * 0.15,
                "大学": (Math.pow(Math.abs(25+value),0.5)-5) * 0.15,
                "金矿": (Math.pow(Math.abs(25-value),0.5)-5) * 0.15,
            },
            consFactor: {},
            capFactor: { 
                "图书馆": value * 0.005,
                "大学": value * 0.005 
            }
        })
    },
    "能源政策": {
        unlockCondition: { tech: "能源规划" },
        min: -25, max: 25, step: 1, defaultValue: 0, unit: "", costPerUnit: 5,
        desc: "调整能源结构：负值偏向传统能源(石油和蒸汽机)，正值偏向清洁能源（太阳能和核能）",
        getEffects: (value) => ({
            prodFactor: { 
                "太阳能板": (Math.pow(Math.abs(25+value),0.5)-5) * 0.18,
                "裂变反应堆": (Math.pow(Math.abs(25+value),0.5)-5) * 0.12 ,
                "聚变反应堆": (Math.pow(Math.abs(25+value),0.5)-5) * 0.12 ,
                "石油发电厂": (Math.pow(Math.abs(25-value),0.5)-5) * 0.18,
                "蒸汽机": (Math.pow(Math.abs(25-value),0.5)-5) * 0.18
            },
            consFactor: {},
            capFactor: {}
        })
    }
};