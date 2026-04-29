// config/buildingsConfig.js

function standardCost(baseCostMap, growthRate, count, costMultiplier = 1.0) {
    const effectiveGrowth = 1 + (growthRate - 1) * costMultiplier;
    const price = {};
    for (let res in baseCostMap) {
        price[res] = Math.floor(baseCostMap[res] * Math.pow(effectiveGrowth, count));
    }
    return price;
}

function getGlobalCostMultiplier(state) {
    return 1 + (window.EffectsManager?.getAdditiveValue?.('global.cost') || 0);
}

BUILDINGS_CONFIG = {
    // ========== 地面 - 住房 ==========
    "帐篷": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "搭建帐篷" },
        cost: (s, c) => standardCost({木头: 5}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        providesLocal: { population: 2 },
        requiresLocal: {},
        desc: "几根木棍撑起的兽皮帐篷，能为2个人遮风挡雨。"
    },
    "小屋": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "初级建筑学" },
        cost: (s, c) => standardCost({石头: 100, 建材:10}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        providesLocal: { population: 5 },
        requiresLocal: {},
        desc: "石头地基、木梁和茅草屋顶，舒适的小屋可容纳5人。"
    },
    "公寓楼": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 200, 钢: 150}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.1}, caps: {},
        happiness: 0.1,
        providesLocal: { population: 2 },
        requiresLocal: {},
        desc: "高层公寓，豪华但消耗电力，只能提供 2 人口容量，真是太奢侈了！"
    },

    // ========== 地面 - 生产 ==========
    "伐木场": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "伐木技术" },
        cost: (s, c) => standardCost({木头: 10}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {木头: 0.5},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "锯木机和运输带，将原木快速加工成标准木材。需要1名工人。"
    },
    "采石场": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "采石技术" },
        cost: (s, c) => standardCost({木头: 5, 石头: 5}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石头: 0.5},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "露天矿坑，用爆破和机械破碎采集石料。需要1名工人。"
    },
    "煤矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "煤矿生产" },
        cost: (s, c) => standardCost({石头: 100}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {煤: 0.2},
        consumes: {}, caps: {煤:50},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "矿井和传送带，产出煤炭并暂时储存。需要1名矿工。"
    },
    "大型矿点": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "矿物学" },
        cost: (s, c) => standardCost({建材: 20, 木头: 200}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "大型露天综合采矿基地，消耗电力来提高邻近煤矿、金矿和铀矿的产量。",
        modifiers: [{ target: "煤矿", prodFactor: 0.15 },{target:"金矿",prodFactor:0.05},{target:"铀矿",prodFactor:0.05}]
    },
    "工具加工站": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "铁制工具" },
        cost: (s, c) => standardCost({铁: 500, 石头: 500}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高精度数控机床，为伐木场和采石场制造耐磨刀具，提升二者效率。",
        modifiers: [{ target: "伐木场", prodFactor: 0.05 }, { target: "采石场", prodFactor: 0.05 }]
    },
    "金矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "金精炼" },
        cost: (s, c) => standardCost({铁: 80, 木头: 500}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {金: 0.1},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "淘洗砂金或开采脉金，产出微量黄金。需要1名淘金者。"
    },
    "油田": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "有机化学" },
        cost: (s, c) => standardCost({金属板: 50, 钢: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石油: 0.6}, consumes: {电力: 0.8}, caps: {石油: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "抽油机和分离罐，开采地下石油并暂存。需要1名操作员，消耗电力。"
    },
    "铀矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "核物理" },
        cost: (s, c) => standardCost({铁: 300, 建材: 150}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铀: 0.3}, consumes: {}, caps: {铀: 50},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "地下开采铀矿石，经简单破碎后得到铀。"
    },

    // ========== 地面 - 工厂 ==========
    "铜冶炼厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "铜冶炼" },
        cost: (s, c) => standardCost({石头: 50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铜: 0.3}, consumes: {煤: 0.6, 石头: 1.0}, caps: {},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "鼓风炉将铜精矿熔炼成粗铜，消耗煤和石头，产出铜。由于工厂的污染严重，会降低幸福度。"
    },
    "铁冶炼厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "铁冶炼" },
        cost: (s, c) => standardCost({石头: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铁: 0.2}, consumes: {煤: 0.8, 石头: 1.2}, caps: {},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高炉流程，用焦炭还原铁矿石，产出铁。"
    },
    "建材工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "初级建筑学" },
        cost: (s, c) => standardCost({铁: 50, 木头: 200}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {建材: 0.3}, consumes: {木头: 6, 石头: 3, 铁: 0.5, 电力: 0.5}, caps: {建材: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将木头、石头和铁加工成标准建筑模块（建材），消耗电力和大量原料。"
    },
    "炼钢厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "炼钢技术" },
        cost: (s, c) => standardCost({建材: 30, 铜: 100}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.2}, consumes: {煤: 0.4, 铁: 0.8}, caps: {钢: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "转炉或电弧炉将生铁炼成钢，消耗煤和铁。"
    },
    "电解铝厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "电解铝" },
        cost: (s, c) => standardCost({建材: 30, 钢: 40}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {铝: 0.2}, consumes: {电力: 1.0, 石头: 1.5}, caps: {铝: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "熔盐电解槽，将氧化铝还原为金属铝，耗电巨大。"
    },
    "金属加工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属加工" },
        cost: (s, c) => standardCost({建材: 50, 铁: 100}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {金属板: 0.2}, consumes: {电力: 0.5, 铜: 1.5, 铝: 0.5}, caps: {金属板: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "冲压、铸造、切削，将铜和铝加工成金属板。"
    },
    "金属回收厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属回收" },
        cost: (s, c) => standardCost({建材: 50, 金属板: 100}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.4, 铁:0.8, 铜:1.5, 铝:1.0}, consumes: {电力: 0.8, 金属板: 0.4},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "熔炼废金属板，重新得到钢、铁、铜、铝。"
    },
    "塑料厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "石油加工" },
        cost: (s, c) => standardCost({金属板: 30, 建材: 30}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {塑料: 0.3}, consumes: {电力: 0.5, 石油: 0.8}, caps: {塑料: 100},
        happiness: -0.6,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "聚合反应釜，将石油转化为塑料颗粒，污染十分严重。"
    },
    "碳纤维厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "碳纤维材料" },
        cost: (s, c) => standardCost({金属板: 200, 塑料: 100}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {碳纤维: 0.3}, consumes: {电力: 1.2, 煤: 0.5}, caps: {碳纤维: 100},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高温碳化炉，把塑料纤维转化为高强度碳纤维。"
    },
    "核燃料工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "核燃料" },
        cost: (s, c) => standardCost({金属板: 150, 铁: 400}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.3}, consumes: {电力: 1.5, 铀: 0.4}, caps: {核燃料: 100},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将铀矿石转化为二氧化铀芯块，装入锆管制成核燃料。"
    },

    // ========== 地面 - 电力 ==========
    "蒸汽机": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "电磁感应" },
        cost: (s, c) => standardCost({石头: 100, 铁: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力: 0.6}, consumes: {煤: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "燃煤锅炉推动活塞曲柄，带动发电机。产出电力，消耗煤。"
    },
    "石油发电厂": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "石油发电" },
        cost: (s, c) => standardCost({建材:50, 钢:50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力:0.5}, consumes: {石油:0.2}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "内燃机，燃烧石油发电。"
    },
    "太阳能板": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "太阳能" },
        cost: (s, c) => standardCost({塑料: 30, 铜: 200}, 1.08, c, getGlobalCostMultiplier(s)),
        produces: (state) => {
            const dayOfYear = state.gameDays % 360;
            let base = 0.3;
            if (dayOfYear >= 90 && dayOfYear < 180) base = 0.6;
            else if (dayOfYear >= 270) base = 0.15;
            return {电力: base};
        },
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { },
        desc: "多晶硅光伏阵列，发电量随季节变化：夏季翻倍，冬季减半。不需要人力维护。"
    },
    "电池": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "储能技术" },
        cost: (s, c) => standardCost({铜: 300, 铁: 300}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {电力: 50},
        providesLocal: {},
        requiresLocal: {},
        desc: "铅酸蓄电池组，储存多余电力，以备电网波动时使用。"
    },
    "裂变反应堆": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "核裂变" },
        cost: (s, c) => standardCost({金属板: 100, 铀: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {铀: 100},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "压水堆，可使用核燃料或铀。",
        modes: [
            { id: "nuclear_fuel", name: "核燃料模式", produces: {电力: 0.5}, consumes: {核燃料: 0.01} },
            { id: "uranium_fuel", name: "铀燃料模式", produces: {电力: 0.8}, consumes: {铀: 0.4} }
        ]
    },

    // ========== 地面 - 科学 ==========
    "图书馆": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "印刷术" },
        cost: (s, c) => standardCost({木头: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.10}, consumes: {}, caps: {科学: 10},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "藏书室和阅读区，缓慢产生科学知识，同时增加科学上限。"
    },
    "大学": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "微积分" },
        cost: (s, c) => standardCost({铜: 30, 铁: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.15}, consumes: {电力: 0.15}, caps: {科学: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "教室和实验室，需要电力。"
    },
    "博物馆": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "探索遗迹" },
        cost: (s, c) => standardCost({石头: 300, 铜: 150}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.1, 金: 0.15}, consumes: {}, caps: {科学: 50},
        happiness: (state) => 0.1 * Math.log(Math.pow(Math.E, 5) + (state.resources["遗物"]?.amount || 0)),
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "陈列远古遗物，同时产出科学和金。幸福感加成随遗物持有数量增长。"
    },
    "科学院": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "材料化学" },
        cost: (s, c) => standardCost({塑料: 30, 金属板: 30}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "先进仪器和智库，提升相邻大学10%的科学产出与上限。",
        modifiers: [{ target: "大学", prodFactor: 0.1, capFactor: 0.1 }]
    },
    "粒子加速器": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "量子力学" },
        cost: (s, c) => standardCost({金属板:500, 建材:500, 科学:500}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学:0.2}, consumes: {电力:0.6}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "环形对撞机，产出科学，且每座（无论是否激活）提升2%遗物获取概率。"
    },

    // ========== 地面 - 存储 ==========
    "仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "基础储存技术" },
        cost: (s, c) => standardCost({木头: 50, 石头: 50}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头: 100, 石头: 100},
        providesLocal: {},
        requiresLocal: {},
        desc: "木结构棚库，增加木头和石头储存上限。"
    },
    "集装箱": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "进阶存储技术" },
        cost: (s, c) => standardCost({铁: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头:500, 石头:500, 煤:200, 铜:200, 铁:200, 钢:200, 铝:200},
        providesLocal: {},
        requiresLocal: {},
        desc: "钢制标准箱堆场，大幅提高多种资源的上限。"
    },
    "大型仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 80, 钢: 80}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.2}, caps: {木头:5000, 石头:5000, 煤:1000, 铜:1000, 铁:1000, 钢:500, 铝:400, 金:400, 建材:400, 塑料:400, 金属板:400,碳纤维:200},
        providesLocal: {},
        requiresLocal: {},
        desc: "自动化立体仓库，耗电运行，极度提升几乎所有资源的上限。"
    },

    // ========== 地面 - 军事 ==========
    "军营": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军事理论" },
        cost: (s, c) => standardCost({铁: 1000, 铜: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {军备: 0.2}, consumes: {铁: 0.5, 铜: 0.3, 政策点:0.1}, caps: {军备:20},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "训练场和武器库，消耗铁和铜生产军备，同时消耗政策点维持纪律。"
    },
    "军工厂": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军工技术" },
        cost: (s, c) => standardCost({金属板: 1000, 钢: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {钢:0.2, 电力:0.2}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers: [{ target: "军营", prodFactor: 0.05, capFactor: 0.05 }],
        desc: "弹药生产线，提升军营的效率和容量。"
    },

    // ========== 地面 - 其他 ==========
    "行政机关": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "管理学" },
        cost: (s, c) => standardCost({木头: 100, 铁: 30}, 2.0, c, getGlobalCostMultiplier(s)),
        produces: {政策点: 0.1}, consumes: {科学: 0.4}, caps: {政策点: 50},
        happiness: 0.5,
        providesLocal: {},
        requiresLocal: {population:1},
        desc: "办公大楼，消耗科学产生政策点（用于切换政策）"
    },
    "市场": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "国际贸易学" },
        cost: (s, c) => standardCost({建材: 20, 金: 20}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {金:100},
        providesLocal: {},
        requiresLocal: {},
        desc: "交易集市，扩大单次买卖的数量上限。"
    },
    "发射井": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "火箭动力学" },
        cost: (s, c) => standardCost({建材: 200,金属板:200, 核燃料: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {核燃料:0.02}, caps: {},
        providesLocal: (state) => ({
            space_habitat: 1 * (1 + 0.05 * (state.buildings["航天公司"]?.active || 0))
        }),
        requiresLocal: {},
        desc: "火箭发射设施，定期消耗核燃料将载荷送入轨道，提供太空承载。"
    },
    "航天公司": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "商业航天" },
        cost: (s, c) => standardCost({金属板: 3000,  金: 1000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.5, 金: 0.1},
        caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "商业航天企业，通过竞争与创新，每激活一个航天公司可使每个发射井提供的太空承载提升5%。"
    },
    // ========== 太空==========
    "轨道电梯": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "轨道电梯" },
        cost: (s, c) => standardCost({碳纤维: 5000, 钛: 3000, 金属板: 8000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.8}, caps: {},
        providesLocal: {space_habitat:1},
        requiresLocal: { population: 1 },
        modifiers: [
            { target: "月球铁矿", prodFactor: 0.03 },
            { target: "月球铜矿", prodFactor: 0.03 },
            { target: "月球钛矿", prodFactor: 0.03 }
        ],
        desc:"从地面延伸至地球同步轨道的碳纳米管缆绳，大幅提高月球矿物产出，同时每个轨道电梯降低月球基地价格1%。"
    },
    "月球基地": {
        class: "space", type: "月球",
        unlockCondition: { tech: "探索月球" },
        cost: (s, c) => {
            const base = {金属板: 50, 碳纤维: 100};
            const growth = 1.15;
            const mult = getGlobalCostMultiplier(s);
            const eff = 1 + (growth - 1) * mult;
            const elevator = s.buildings["轨道电梯"]?.active || 0;
            const discount = Math.pow(0.99, elevator);
            const price = {};
            for (let r in base) price[r] = Math.floor(base[r] * Math.pow(eff, c) * discount);
            return price;
        },
        produces: {}, consumes: {电力: 2.0},
        caps: {铀:500, 钛:500, 碳纤维:500, 核燃料:200},
        providesLocal: { moon_habitat:1 },
        requiresLocal: { space_habitat:1,population: 1 },
        desc: "密闭穹顶和生命维持系统，提供1点月球宜居度，价格随轨道电梯数量降低。"
    },
    "月球铁矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({钢: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铁: 1.5}, consumes: {电力: 1.0}, caps: {铁:100},
        providesLocal: {},
        requiresLocal: {  moon_habitat: 0.5, population: 1 },
        desc: "月壤中的富铁玄武岩，经电磁分离得到铁。"
    },
    "月球铜矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({铝: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铜: 2.0}, consumes: {电力: 0.8}, caps: {铜:100},
        providesLocal: {},
        requiresLocal: {  moon_habitat: 0.5, population: 1 },
        desc: "月球高地的铜矿脉，产出铜。"
    },
    "月球钛矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "进阶月球采矿" },
        cost: (s, c) => standardCost({金属板: 100, 碳纤维: 250}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {钛: 0.5}, consumes: {电力: 1.2}, caps: {钛: 100},
        providesLocal: {},
        requiresLocal: { moon_habitat: 0.5, population: 1 },
        desc:"从月海钛铁矿中提取钛。"
    },
    "月球研究所": {
        class: "space", type: "月球",
        unlockCondition: { tech: "研究月球" },
        cost: (s, c) => standardCost({钛: 250, 钢: 400}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.1}, consumes: {电力: 1.0}, caps: {科学: 200},
        providesLocal: {},
        requiresLocal: { moon_habitat: 0.5, population: 1 },
        desc:"低重力实验室，产出科学。"
    },
    "月球工厂": {
        class: "space", type: "月球",
        unlockCondition: { tech: "月球工厂" },
        cost: (s, c) => standardCost({钛: 300, 碳纤维: 300}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.3},
        providesLocal: {},
        requiresLocal: {  moon_habitat: 0.5, population: 1 },
        modifiers: [
            { target: "建材工厂", prodFactor: 0.05 },
            { target: "炼钢厂", prodFactor: 0.05 },
            { target: "电解铝厂", prodFactor: 0.05 },
            { target: "金属加工厂", prodFactor: 0.05 },
            { target: "塑料厂", prodFactor: 0.05 },
            { target: "碳纤维厂", prodFactor: 0.05 },
            { target: "核燃料工厂", prodFactor: 0.05 }
        ],
        desc:"利用月球真空环境精炼材料，提升地面多种工厂产量。"
    },

    "木星基地": {
        class: "space", type: "木星",
        unlockCondition: { tech: "探索木星" },
        cost: (s, c) => standardCost({钛: 10000, 塑料: 5000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.8},
        caps: {氚:300, 核燃料:300},
        providesLocal: { gas_habitat:1 },
        requiresLocal: { space_habitat:1,population: 1 },
        modifiers: [
            { target: "氚提取站", prodFactor: 0.03 },
            { target: "氚燃料厂", prodFactor: 0.03 }
        ],
        desc:"漂浮在木星上空的浮空城，提供1点木星宜居度。"
    },
    "氚提取站": {
        class: "space", type: "木星",
        unlockCondition: { tech: "氚提取" },
        cost: (s, c) => standardCost({建材: 20000, 金属板: 10000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {氚: 0.2}, consumes: {电力: 0.6}, caps: {氚: 100},
        providesLocal: {},
        requiresLocal: { gas_habitat: 1.0, population: 1 },
        desc:"从大气深处捕获氚同位素。"
    },
    "氚燃料厂": {
        class: "space", type: "木星",
        unlockCondition: { tech: "氚处理" },
        cost: (s, c) => standardCost({钛: 10000, 碳纤维: 20000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.4}, consumes: {氚: 0.1, 电力: 0.3}, caps: {核燃料: 100},
        providesLocal: {},
        requiresLocal: {  gas_habitat: 1.0, population: 1 },
        desc: "将氚与锂反应生成氦和大量核燃料"
    },
    "浮空居民区": {
        class: "space",
        type: "木星",
        unlockCondition: { tech: "木星殖民" },
        cost: (s, c) => standardCost({钢: 5000, 金属板: 5000, 核燃料: 2000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力: 0.5},
        caps: {},
        happiness: 0.1,
        providesLocal: { population: 3 },
        requiresLocal: { gas_habitat: 1},
        desc: "悬浮在木星云顶的居住舱，利用磁场维持稳定，窗外有波澜壮阔的气态风暴非常美丽。每座可容纳3位殖民者。"
    },
    "核燃料转化炉": {
        class: "space",
        type: "木星",
        unlockCondition: { tech: "核素转化" },
        cost: (s, c) => standardCost({金属板: 8000, 钢: 6000,}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {煤: 2.0},
        consumes: {核燃料: 0.05},
        caps: {},
        happiness: -0.5,
        providesLocal: {},
        requiresLocal: { population: 1,gas_habitat:0.5 },
        desc: "通过核反应逆向裂变将核燃料转变为普通煤炭，可以依靠核燃料本身能量因而不需要额外电力，但是过程中会产生大量污染。"
    },
    "聚变反应堆": {
        class: "space", type: "月球",
        unlockCondition: { tech: "可控核聚变" },
        cost: (s, c) => standardCost({金属板: 10000, 碳纤维: 5000, 核燃料: 1000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {电力: 3}, consumes: {核燃料: 0.50}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc:"托卡马克装置，用核燃料实现可控聚变，产生海量电力。"
    },
    "太空剧院": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "太空剧院" },
        cost: (s, c) => standardCost({金属板: 500, 塑料: 500}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4, 科学: 2}, caps: {},
        happiness: (state) => 0.2 * Math.log(Math.pow(2.718, 5) + (state.resources["暗能量"]?.amount || 0)),
        providesLocal: {},
        requiresLocal: { space_habitat: 0.5, population: 1 },
        desc:"利用暗能量制造全息幻象，愉悦殖民者。幸福感加成随暗能量持有数量增长。"
    },
    "戴森球": {
        class: "space", type: "太阳",
        unlockCondition: { tech: "戴森球计划" },
        cost: (s, c) => standardCost({钛: 500000, 金属板: 500000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力:1.5}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc:"包裹恒星的能源收集壳，提供持续的巨大电力。"
    },
    "星际交易站": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "星际交易" },
        cost: (s, c) => standardCost({钢: 50000, 金: 5000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:0.1}, caps: {金:1000},
        providesLocal: {},
        requiresLocal: {population:1},
        desc:"停泊外星商船的码头，极大扩展市场单次交易量。"
    },

    "暗物质研究所": {
        class: "space", type: "月球",
        unlockCondition: { tech: "暗物质利用" },
        cost: (s, c) => standardCost({钛:5000, 碳纤维:500, 科学:500}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {电力:0.2, 科学:0.2}, consumes: {},
        requiresLocal: { population: 1 },
        desc:"探测并转化暗能量为电力和科学，堪称‘永动机’。"
    },
};