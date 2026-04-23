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
        desc: "简陋的帐篷，提供 2 人口容量"
    },
    "小屋": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "初级建筑学" },
        cost: (s, c) => standardCost({石头: 100, 建材:10}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        providesLocal: { population: 5 },
        requiresLocal: {},
        desc: "舒适的小屋，提供 5 人口容量"
    },
    "公寓楼": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 200, 钢: 150}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.1}, caps: {},
        happiness: 0.1,
        providesLocal: { population: 2 },
        requiresLocal: {},
        desc: "高层公寓，豪华但消耗电力，提供 2 人口容量"
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
        desc: "生产木材"
    },
    "采石场": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "采石技术" },
        cost: (s, c) => standardCost({木头: 5, 石头: 5}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石头: 0.5},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "开采石头"
    },
    "煤矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "煤矿生产" },
        cost: (s, c) => standardCost({石头: 100}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {煤: 0.2},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产少量煤"
    },
    "大型煤矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "矿物学" },
        cost: (s, c) => standardCost({建材: 20, 木头: 200}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {煤:100},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "提供煤储存，使煤矿产量+15%",
        modifiers: [{ target: "煤矿", prodFactor: 0.15 }]
    },
    "工具加工站": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "铁制工具" },
        cost: (s, c) => standardCost({铁: 500, 石头: 500}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "制造工具提高伐木场/采石场产量",
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
        desc: "生产少量金"
    },
    "油田": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "有机化学" },
        cost: (s, c) => standardCost({金属板: 50, 钢: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石油: 0.6}, consumes: {电力: 0.8}, caps: {石油: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "开采石油"
    },
    "铀矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "核物理" },
        cost: (s, c) => standardCost({铁: 300, 建材: 150}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铀: 0.3}, consumes: {}, caps: {铀: 50},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "开采铀"
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
        desc: "消耗煤和石头，生产铜"
    },
    "铁冶炼厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "铁冶炼" },
        cost: (s, c) => standardCost({石头: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铁: 0.2}, consumes: {煤: 0.8, 石头: 1.2}, caps: {},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "消耗煤和石头，生产铁"
    },
    "建材工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "初级建筑学" },
        cost: (s, c) => standardCost({铁: 50, 木头: 200}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {建材: 0.3}, consumes: {木头: 6, 石头: 3, 铁: 0.5, 电力: 0.5}, caps: {建材: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产建材"
    },
    "炼钢厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "炼钢技术" },
        cost: (s, c) => standardCost({建材: 30, 铜: 100}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.2}, consumes: {煤: 0.4, 铁: 0.8}, caps: {钢: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将铁冶炼成钢"
    },
    "电解铝厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "电解铝" },
        cost: (s, c) => standardCost({建材: 30, 钢: 40}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {铝: 0.2}, consumes: {电力: 1.0, 石头: 1.5}, caps: {铝: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产铝"
    },
    "金属加工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属加工" },
        cost: (s, c) => standardCost({建材: 50, 铁: 100}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {金属板: 0.2}, consumes: {电力: 0.5, 铜: 1.5, 铝: 0.5}, caps: {金属板: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产金属板"
    },
    "金属回收厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属回收" },
        cost: (s, c) => standardCost({建材: 50, 金属板: 100}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.4, 铁:0.8, 铜:1.5, 铝:1.0}, consumes: {电力: 0.8, 金属板: 0.4},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将金属板回收成金属"
    },
    "塑料厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "石油加工" },
        cost: (s, c) => standardCost({金属板: 30, 建材: 30}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {塑料: 0.3}, consumes: {电力: 0.5, 石油: 0.8}, caps: {塑料: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产塑料"
    },
    "碳纤维厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "碳纤维材料" },
        cost: (s, c) => standardCost({金属板: 200, 塑料: 100}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {碳纤维: 0.3}, consumes: {电力: 1.2, 煤: 0.5}, caps: {碳纤维: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产碳纤维"
    },
    "核燃料工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "核燃料" },
        cost: (s, c) => standardCost({金属板: 150, 铁: 400}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.3}, consumes: {电力: 1.5, 铀: 0.4}, caps: {核燃料: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "生产核燃料"
    },

    // ========== 地面 - 电力 ==========
    "蒸汽机": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "电磁感应" },
        cost: (s, c) => standardCost({石头: 100, 铁: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力: 0.6}, consumes: {煤: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "消耗煤，产生电力"
    },
    "石油发电厂": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "石油发电" },
        cost: (s, c) => standardCost({建材:50, 钢:50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力:0.5}, consumes: {石油:0.2}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "使用石油发电"
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
        requiresLocal: { population: 1 },
        desc: "清洁电力，夏季产量翻倍，冬季减半"
    },
    "电池": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "储能技术" },
        cost: (s, c) => standardCost({铜: 300, 铁: 300}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {电力: 50},
        providesLocal: {},
        requiresLocal: {},
        desc: "储存电力（不需要人口）"
    },
    "裂变反应堆": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "核裂变" },
        cost: (s, c) => standardCost({金属板: 100, 铀: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {铀: 100},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "核能发电，可切换燃料模式",
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
        desc: "生产科学，增加科学上限"
    },
    "大学": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "微积分" },
        cost: (s, c) => standardCost({铜: 30, 铁: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.15}, consumes: {电力: 0.15}, caps: {科学: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "消耗电力，生产科学"
    },
    "博物馆": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "探索遗迹" },
        cost: (s, c) => standardCost({石头: 300, 铜: 150}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.1, 金: 0.15}, consumes: {}, caps: {科学: 50},
        happiness: (state) => 0.1 * Math.log(Math.pow(Math.E, 5) + (state.resources["遗物"]?.amount || 0)),
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "研究遗物，生产科学和金"
    },
    "科学院": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "材料化学" },
        cost: (s, c) => standardCost({塑料: 30, 金属板: 30}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.5}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "使大学科学产出/上限+10%",
        modifiers: [{ target: "大学", prodFactor: 0.1, capFactor: 0.1 }]
    },
    "粒子加速器": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "量子力学" },
        cost: (s, c) => standardCost({金属板:500, 建材:500, 科学:500}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学:0.2}, consumes: {电力:0.6}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "产出科学，每个（无论激活）增加2%遗物获取"
    },

    // ========== 地面 - 存储 ==========
    "仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "基础储存技术" },
        cost: (s, c) => standardCost({木头: 50, 石头: 50}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头: 100, 石头: 100},
        providesLocal: {},
        requiresLocal: {},
        desc: "提高木头和石头储存上限（不占人口）"
    },
    "集装箱": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "进阶存储技术" },
        cost: (s, c) => standardCost({铁: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头:500, 石头:500, 煤:200, 铜:200, 铁:200, 钢:200, 铝:200},
        providesLocal: {},
        requiresLocal: {},
        desc: "储存更多资源（不占人口）"
    },
    "大型仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 80, 钢: 80}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.2}, caps: {木头:5000, 石头:5000, 煤:1000, 铜:1000, 铁:1000, 钢:500, 铝:400, 金:400, 建材:400, 塑料:400, 金属板:400,碳纤维:200},
        providesLocal: {},
        requiresLocal: {},
        desc: "消耗电力，大幅提升上限（不占人口）"
    },

    // ========== 地面 - 军事 ==========
    "军营": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军事理论" },
        cost: (s, c) => standardCost({铁: 1000, 铜: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {军备: 0.2}, consumes: {铁: 0.5, 铜: 0.3, 政策点:0.1}, caps: {军备:20},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "训练士兵，生产军备"
    },
    "军工厂": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军工技术" },
        cost: (s, c) => standardCost({金属板: 1000, 钢: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {钢:0.2, 电力:0.2}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers: [{ target: "军营", prodFactor: 0.05, capFactor: 0.05 }],
        desc: "提高军营效率"
    },

    // ========== 地面 - 其他 ==========
    "行政机关": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "管理学" },
        cost: (s, c) => standardCost({木头: 100, 铁: 30}, 2.0, c, getGlobalCostMultiplier(s)),
        produces: {政策点: 0.1}, consumes: {科学: 0.4}, caps: {政策点: 50},
        happiness: 0.5,
        providesLocal: {},
        requiresLocal: {},
        desc: "消耗科学，生产政策点（不占人口）"
    },
    "市场": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "国际贸易学" },
        cost: (s, c) => standardCost({建材: 20, 金: 20}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {金:100},
        providesLocal: {},
        requiresLocal: {},
        desc: "提升单次交易数量"
    },

    // ========== 太空==========
        "轨道电梯": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "轨道电梯" },
        cost: (s, c) => standardCost({碳纤维: 5000, 钛: 3000, 金属板: 8000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.8}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers: [
            { target: "月球铁矿", prodFactor: 0.03 },
            { target: "月球铜矿", prodFactor: 0.03 },
            { target: "月球钛矿", prodFactor: 0.03 }
        ],
        desc:"改善地月交通，进而提高月球矿物运送回地球的效率"
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
        providesLocal: { space_habitat: 1.0,moon_habitat:1 },
        requiresLocal: { population: 1 },
        desc: "月球殖民，提供太空宜居度"
    },
    "月球铁矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({钢: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铁: 1.5}, consumes: {电力: 1.0}, caps: {铁:100},
        providesLocal: {},
        requiresLocal: { space_habitat: 1.0, moon_habitat: 0.5, population: 1 },
        desc: "月球铁矿，需要氧气和宜居度"
    },
    "月球铜矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({铝: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铜: 2.0}, consumes: {电力: 0.8}, caps: {铜:100},
        providesLocal: {},
        requiresLocal: { space_habitat: 1.0, moon_habitat: 0.5, population: 1 },
        desc: "月球铜矿"
    },
    "月球钛矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "进阶月球采矿" },
        cost: (s, c) => standardCost({金属板: 100, 碳纤维: 250}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {钛: 0.5}, consumes: {电力: 1.2}, caps: {钛: 100},
        providesLocal: {},
        requiresLocal: { space_habitat: 1.5, moon_habitat: 0.7, population: 1 },
        desc:"月球钛矿"
    },
    "月球研究所": {
        class: "space", type: "月球",
        unlockCondition: { tech: "研究月球" },
        cost: (s, c) => standardCost({钛: 250, 钢: 400}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.1}, consumes: {电力: 1.0}, caps: {科学: 200},
        providesLocal: {},
        requiresLocal: { space_habitat: 1.0, moon_habitat: 0.3, population: 1 },
        desc:"月球研究所"
    },
    "月球工厂": {
        class: "space", type: "月球",
        unlockCondition: { tech: "月球工厂" },
        cost: (s, c) => standardCost({钛: 300, 碳纤维: 300}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.3},
        providesLocal: {},
        requiresLocal: { space_habitat: 0.3, moon_habitat: 0.2, population: 1 },
        modifiers: [
            { target: "建材工厂", prodFactor: 0.05 },
            { target: "炼钢厂", prodFactor: 0.05 },
            { target: "电解铝厂", prodFactor: 0.05 },
            { target: "金属加工厂", prodFactor: 0.05 },
            { target: "塑料厂", prodFactor: 0.05 },
            { target: "碳纤维厂", prodFactor: 0.05 },
            { target: "核燃料工厂", prodFactor: 0.05 }
        ],
        desc:"月球工厂"
    },

    "气态行星基地": {
        class: "space", type: "气态行星",
        unlockCondition: { tech: "探索气态行星" },
        cost: (s, c) => standardCost({钛: 10000, 塑料: 5000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.8},
        caps: {氚:300, 核燃料:300},
        providesLocal: { space_habitat: 0.3,gas_habitat:1 },
        requiresLocal: { population: 1 },
        modifiers: [
            { target: "氚提取站", prodFactor: 0.03 },
            { target: "氚燃料厂", prodFactor: 0.03 }
        ],
        desc:"首先在气态行星上建立固体地基，为其他建筑打下基础"
    },
    "氚提取站": {
        class: "space", type: "气态行星",
        unlockCondition: { tech: "氚提取" },
        cost: (s, c) => standardCost({建材: 20000, 金属板: 10000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {氚: 0.2}, consumes: {电力: 0.6}, caps: {氚: 100},
        providesLocal: {},
        requiresLocal: { space_habitat: 0.5, gas_habitat: 1.0, population: 1 },
    },
    "氚燃料厂": {
        class: "space", type: "气态行星",
        unlockCondition: { tech: "氚处理" },
        cost: (s, c) => standardCost({钛: 10000, 碳纤维: 20000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.4}, consumes: {氚: 0.1, 电力: 0.3}, caps: {核燃料: 100},
        providesLocal: {},
        requiresLocal: { space_habitat: 0.8, gas_habitat: 1.0, population: 1 },
    },

    "聚变反应堆": {
        class: "space", type: "月球",
        unlockCondition: { tech: "可控核聚变" },
        cost: (s, c) => standardCost({金属板: 10000, 碳纤维: 5000, 核燃料: 1000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {电力: 3}, consumes: {核燃料: 0.50}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc:"利用聚变反应产生大量电力"
    },
    "太空剧院": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "太空剧院" },
        cost: (s, c) => standardCost({金属板: 500, 塑料: 500}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4, 科学: 2}, caps: {},
        happiness: (state) => 0.2 * Math.log(Math.pow(2.718, 5) + (state.resources["暗能量"]?.amount || 0)),
        providesLocal: {},
        requiresLocal: { space_habitat: 0.5, population: 1 },
        desc:"用暗能量表演神奇的魔术"
    },
    "戴森球": {
        class: "space", type: "太阳",
        unlockCondition: { tech: "戴森球计划" },
        cost: (s, c) => standardCost({钛: 500000, 金属板: 500000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力:1.5}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc:"围绕太阳建造一个球，最大限度利用太阳能。"
    },
    "星际交易站": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "星际交易" },
        cost: (s, c) => standardCost({钢: 50000, 金: 5000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:0.1}, caps: {金:1000},
        providesLocal: {},
        requiresLocal: {population:1},
        desc:"极大提高单次交易数量"
    },

    "暗物质研究所": {
        class: "space", type: "月球",
        unlockCondition: { tech: "暗物质利用" },
        cost: (s, c) => standardCost({钛:5000, 碳纤维:500, 科学:500}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {电力:0.2, 科学:0.2}, consumes: {},
        requiresLocal: { population: 1 },
        desc:"研究从暗物质中凭空汲取能量，这可能是永动机？"
    },
};