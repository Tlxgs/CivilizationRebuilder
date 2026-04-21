// config/buildingsConfig.js

// 辅助函数：标准价格增长公式（用于大多数建筑）
function standardCost(baseCostMap, growthRate, count, costMultiplier = 1.0) {
    // 价格 = base * (growth ^ count)，再应用全局成本倍率
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
    "伐木场": {
        type: "生产",
        unlockCondition: { tech: "伐木技术" },
        cost: (state, count) => standardCost({木头: 10}, 1.15, count, getGlobalCostMultiplier(state)),
        produces: {木头: 0.4},
        desc: "生产木材"
    },
    "采石场": {
        type: "生产",
        unlockCondition: { tech: "采石技术" },
        cost: (state, count) => standardCost({木头: 5, 石头: 5}, 1.15, count, getGlobalCostMultiplier(state)),
        produces: {石头: 0.4},
        desc: "开采石头"
    },
    "仓库": {
        type: "存储",
        unlockCondition: { tech: "基础储存技术" },
        cost: (state, count) => standardCost({木头: 50, 石头: 50}, 1.08, count, getGlobalCostMultiplier(state)),
        produces: {}, consumes: {}, caps: {木头: 50, 石头: 50},
        desc: "提高木头和石头的储存上限"
    },
    "集装箱": {
        type: "存储",
        unlockCondition: { tech: "进阶存储技术" },
        cost: (state, count) => standardCost({铁: 40, 铜: 20}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {}, consumes: {},
        caps: {木头:500, 石头:500, 煤:200, 铜:200, 铁:200, 钢:200, 铝:200},
        desc: "储存更多资源"
    },
    "大型仓库": {
        type: "存储",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (state, count) => standardCost({金属板: 40, 钢: 40}, 1.1, count, getGlobalCostMultiplier(state)),
        produces: {}, consumes: {电力: 0.1},
        caps: {木头:3000, 石头:3000, 煤:500, 铜:500, 铁:500, 钢:200, 铝:200, 金:200, 建材:200, 塑料:200, 金属板:200},
        desc: "消耗电力，大幅提升多种资源上限"
    },
    "煤矿": {
        type: "生产",
        unlockCondition: { tech: "煤矿生产" },
        cost: (state, count) => standardCost({石头: 100}, 1.20, count, getGlobalCostMultiplier(state)),
        produces: {煤: 0.2},
        desc: "生产少量煤"
    },
    "大型煤矿": {
        type: "生产",
        unlockCondition: { tech: "矿物学" },
        cost: (state, count) => standardCost({建材: 20, 木头: 200}, 1.15, count, getGlobalCostMultiplier(state)),
        consumes: {电力: 0.2},
        caps: {煤:100},
        desc: "提供煤储存，同时使煤矿产量+10%",
        modifiers: [
            { target: "煤矿", prodFactor: 0.10 }
        ]
    },
    "工具加工站": {
        type: "生产",
        unlockCondition: { tech: "铁制工具" },
        cost: (state, count) => standardCost({铁: 500, 石头: 500}, 1.15, count, getGlobalCostMultiplier(state)),
        consumes: {电力: 0.15},
        desc: "制造工具来提高伐木场和采石场产量",
        modifiers: [
            { target: "伐木场", prodFactor: 0.02 },
            { target: "采石场", prodFactor: 0.02 }
        ]
    },
    "金矿": {
        type: "生产",
        unlockCondition: { tech: "金精炼" },
        cost: (state, count) => standardCost({铁: 80, 木头: 500}, 1.20, count, getGlobalCostMultiplier(state)),
        produces: {金: 0.1},
        desc: "生产少量金"
    },
    "铜冶炼厂": {
        type: "工厂",
        unlockCondition: { tech: "铜冶炼" },
        happiness: -0.1,
        cost: (state, count) => standardCost({石头: 50}, 1.1, count, getGlobalCostMultiplier(state)),
        produces: {铜: 0.1}, consumes: {煤: 0.2, 石头: 0.5}, caps: {},
        desc: "消耗煤和石头，生产铜"
    },
    "铁冶炼厂": {
        type: "工厂",
        unlockCondition: { tech: "铁冶炼" },
        happiness: -0.1,
        cost: (state, count) => standardCost({石头: 30, 铜: 5}, 1.1, count, getGlobalCostMultiplier(state)),
        produces: {铁: 0.1}, consumes: {煤: 0.4, 石头: 0.5}, caps: {},
        desc: "消耗煤和石头，生产铁"
    },
    "行政机关": {
        type: "其他",
        unlockCondition: { tech: "管理学" },
        happiness: 0.5,
        cost: (state, count) => standardCost({木头: 100, 铁: 30}, 2.0, count, getGlobalCostMultiplier(state)),
        produces: {政策点: 0.1}, consumes: {科学: 0.4}, caps: {政策点: 50},
        desc: "消耗科学，生产政策点"
    },
    "图书馆": {
        type: "科学",
        unlockCondition: { tech: "印刷术" },
        cost: (state, count) => standardCost({木头: 20}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {科学: 0.15}, caps: {科学: 10},
        desc: "生产科学，增加科学上限"
    },
    "大学": {
        type: "科学",
        unlockCondition: { tech: "微积分" },
        cost: (state, count) => standardCost({铜: 30, 铁: 30}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {科学: 0.2}, consumes: {电力: 0.15}, caps: {科学: 40},
        desc: "消耗电力，生产科学"
    },
    "博物馆": {
        type: "科学",
        unlockCondition: { tech: "探索遗迹" },
        cost: (state, count) => standardCost({石头: 300, 铜: 100}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {科学: 0.2, 金: 0.1}, consumes: {}, caps: {科学: 50},
        happiness: (state) => {
            const relic = state.resources["遗物"]?.amount || 0;
            return 0.1 * Math.log(Math.pow(Math.E, 5) + relic);
        },
        desc: "研究遗物，生产科学和金。幸福度取决于遗物数量。"
    },
    "科学院": {
        type: "科学",
        unlockCondition: { tech: "材料化学" },
        cost: (state, count) => standardCost({塑料: 30, 金属板: 30}, 1.15, count, getGlobalCostMultiplier(state)),
        consumes: {电力: 0.2},
        desc: "提供先进理论，使大学科学产出和上限+5%",
        modifiers: [
            { target: "大学", prodFactor: 0.05, capFactor: 0.05 }
        ]
    },
    "暗物质研究所": {
        type: "太空",
        unlockCondition: { tech: "暗物质利用" },
        cost: (state, count) => standardCost({钛:5000, 碳纤维:500, 科学:500}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {电力:0.2, 科学:0.2},
        consumes: {太空宜居度:0.1},
        desc: "从暗物质中提取永不枯竭的能量！这似乎是永动机？",
    },
    "蒸汽机": {
        type: "电力",
        unlockCondition: { tech: "电磁感应" },
        cost: (state, count) => standardCost({石头: 100, 铁: 20}, 1.12, count, getGlobalCostMultiplier(state)),
        produces: {电力: 0.4}, consumes: {煤: 0.25}, caps: {},
        desc: "消耗煤，产生电力"
    },
    "建材工厂": {
        type: "工厂",
        unlockCondition: { tech: "初级建筑学" },
        happiness: -0.2,
        cost: (state, count) => standardCost({铁: 50, 木头: 200}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {建材: 0.2}, consumes: {木头: 5, 石头: 2, 铁: 0.2, 电力: 0.2},
        caps: {建材: 50},
        desc: "生产建材"
    },
    "炼钢厂": {
        type: "工厂",
        unlockCondition: { tech: "炼钢技术" },
        happiness: -0.2,
        cost: (state, count) => standardCost({建材: 30, 铜: 100}, 1.15, count, getGlobalCostMultiplier(state)),
        produces: {钢: 0.1}, consumes: {煤: 0.2, 铁: 0.4}, caps: {钢: 50},
        desc: "将铁冶炼成钢"
    },
    "电解铝厂": {
        type: "工厂",
        unlockCondition: { tech: "电解铝" },
        happiness: -0.2,
        cost: (state, count) => standardCost({建材: 30, 钢: 40}, 1.15, count, getGlobalCostMultiplier(state)),
        produces: {铝: 0.1}, consumes: {电力: 0.5, 石头: 0.8}, caps: {铝: 50},
        desc: "生产铝"
    },
    "金属加工厂": {
        type: "工厂",
        unlockCondition: { tech: "金属加工" },
        happiness: -0.2,
        cost: (state, count) => standardCost({建材: 50, 铁: 100}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {金属板: 0.1}, consumes: {电力: 0.2, 铜: 0.8, 铝: 0.3},
        caps: {金属板: 50},
        desc: "生产金属板"
    },
    "金属回收厂": {
        type: "工厂",
        unlockCondition: { tech: "金属回收" },
        happiness: -0.2,
        cost: (state, count) => standardCost({建材: 50, 金属板: 100}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {钢: 0.2, 铁:0.5, 铜:1, 铝:0.2}, consumes: {电力: 0.3, 金属板: 0.2},
        desc: "将金属板重新回收成金属(铁元素是哪里来的？没有人知道)"
    },
    "塑料厂": {
        type: "工厂",
        unlockCondition: { tech: "石油加工" },
        happiness: -0.2,
        cost: (state, count) => standardCost({金属板: 30, 建材: 30}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {塑料: 0.2}, consumes: {电力: 0.2, 石油: 0.6}, caps: {塑料: 50},
        desc: "生产塑料"
    },
    "碳纤维厂": {
        type: "工厂",
        unlockCondition: { tech: "碳纤维材料" },
        happiness: -0.2,
        cost: (state, count) => standardCost({金属板: 200, 塑料: 100}, 1.08, count, getGlobalCostMultiplier(state)),
        produces: {碳纤维: 0.2}, consumes: {电力: 0.6, 煤: 0.2}, caps: {碳纤维: 50},
        desc: "生产碳纤维"
    },
    "核燃料工厂": {
        type: "工厂",
        unlockCondition: { tech: "核燃料" },
        happiness: -0.2,
        cost: (state, count) => standardCost({金属板: 150, 铁: 400}, 1.08, count, getGlobalCostMultiplier(state)),
        produces: {核燃料: 0.2}, consumes: {电力: 1, 铀: 0.2}, caps: {核燃料: 50},
        desc: "生产核燃料"
    },
    "市场": {
        type: "其他",
        unlockCondition: { tech: "国际贸易学" },
        cost: (state, count) => standardCost({建材: 20, 金: 20}, 1.05, count, getGlobalCostMultiplier(state)),
        caps: {金:100},
        desc: "提升单次交易数量。"
    },
    "油田": {
        type: "生产",
        unlockCondition: { tech: "有机化学" },
        cost: (state, count) => standardCost({金属板: 10, 钢: 30}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {石油: 0.4}, consumes: {电力: 0.4}, caps: {石油: 20},
        desc: "开采石油"
    },
    "石油发电厂": {
        type: "电力",
        unlockCondition: { tech: "石油发电" },
        cost: (state, count) => standardCost({建材:50, 钢:50}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {电力:0.5}, consumes: {石油:0.2}, caps: {},
        desc: "使用石油发电"
    },
    "太阳能板": {
        type: "电力",
        unlockCondition: { tech: "太阳能" },
        cost: (state, count) => standardCost({塑料: 30, 铜: 200}, 1.04, count, getGlobalCostMultiplier(state)),
        produces: (state) => {
            const dayOfYear = state.gameDays % 360;
            let base = 0.2;
            if (dayOfYear >= 90 && dayOfYear < 180) base = 0.4;
            else if (dayOfYear >= 270) base = 0.1;
            return {电力: base};
        },
        consumes: {}, caps: {},
        happiness: 0,
        desc: "清洁电力，夏天产量翻倍，冬天减半"
    },
    "电池": {
        type: "电力",
        unlockCondition: { tech: "储能技术" },
        cost: (state, count) => standardCost({铜: 300, 铁: 300}, 1.2, count, getGlobalCostMultiplier(state)),
        caps: {电力: 200},
        desc: "储存电力"
    },
    "铀矿": {
        type: "生产",
        unlockCondition: { tech: "核物理" },
        cost: (state, count) => standardCost({铁: 300, 建材: 150}, 1.1, count, getGlobalCostMultiplier(state)),
        produces: {铀: 0.2}, caps: {铀: 50},
        desc: "开采铀"
    },
    "裂变反应堆": {
        type: "电力",
        unlockCondition: { tech: "核裂变" },
        cost: (state, count) => standardCost({金属板: 100, 铀: 30}, 1.15, count, getGlobalCostMultiplier(state)),
        caps: {铀: 50},
        desc: "核能发电，可切换燃料模式",
        modes: [
            {
                id: "nuclear_fuel",
                name: "核燃料模式",
                produces: {电力: 0.4},
                consumes: {核燃料: 0.01},
                desc: "使用核燃料，高效发电"
            },
            {
                id: "uranium_fuel",
                name: "铀燃料模式",
                produces: {电力: 0.5},
                consumes: {铀: 0.3},
                desc: "直接使用铀，效率较低但省去核燃料加工"
            }
        ]
    },
    "粒子加速器": {
        type: "科学",
        unlockCondition: { tech: "量子力学" },
        cost: (state, count) => standardCost({金属板:500, 建材:500, 科学:500}, 1.06, count, getGlobalCostMultiplier(state)),
        produces: {科学:0.3}, consumes: {电力:0.5}, caps: {},
        desc: "产出科学，同时每个粒子加速器（无论是否激活）增加2%遗物获取。"
    },
    "轨道电梯": {
        type: "太空",
        unlockCondition: { tech: "轨道电梯" },
        cost: (state, count) => standardCost({碳纤维: 5000, 钛: 3000, 金属板: 8000}, 1.08, count, getGlobalCostMultiplier(state)),
        consumes: {电力: 0.4},
        desc: "提升月球建筑产量，并降低月球基地购买价格（每座 -1%）",
        modifiers: [
            { target: "月球铁矿", prodFactor: 0.02 },
            { target: "月球铜矿", prodFactor: 0.02 },
            { target: "月球钛矿", prodFactor: 0.02 }
        ]
        // 降低月球基地价格的效果在月球基地的 cost 函数中实现
    },
    "月球基地": {
        type: "太空",
        unlockCondition: { tech: "探索月球" },
        // 特殊 cost：基础价格随数量增长，再乘上轨道电梯的折扣
        cost: (state, count) => {
            const baseCostMap = {金属板: 50, 碳纤维: 100};
            const growth = 1.06;
            const globalMult = getGlobalCostMultiplier(state);
            // 计算轨道电梯折扣（每激活一个轨道电梯，价格降低1%，乘算，最低折扣0.2）
            const elevatorActive = state.buildings["轨道电梯"]?.active || 0;
            const discount = Math.max(0.2, Math.pow(0.99, elevatorActive));
            const price = {};
            const effectiveGrowth = 1 + (growth - 1) * globalMult;
            for (let res in baseCostMap) {
                let base = baseCostMap[res] * Math.pow(effectiveGrowth, count);
                price[res] = Math.floor(base * discount);
            }
            return price;
        },
        produces: {太空宜居度: 0.4}, consumes: {电力: 0.6},
        caps: {铀:200, 钛:200, 碳纤维:200, 核燃料:50, 太空宜居度:50},
        desc: "月球殖民"
    },
    "气态行星基地": {
        type: "太空",
        unlockCondition: { tech: "探索气态行星" },
        cost: (state, count) => standardCost({钛: 10000, 塑料: 5000}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {太空宜居度: 0.2}, consumes: {电力: 0.6},
        caps: {氚:200, 核燃料:200, 太空宜居度:50},
        modifiers: [
            { target: "氚提取站", prodFactor: 0.02},
            { target: "氚燃料厂", prodFactor: 0.02}
        ],
        desc: "这里环境远比月球恶劣，宜居度很差"
    },
    "月球铁矿": {
        type: "太空",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (state, count) => standardCost({钢: 50, 碳纤维: 150}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {铁: 0.8}, consumes: {电力: 0.4, 太空宜居度: 0.4}, caps: {},
        desc: "月球铁矿"
    },
    "月球铜矿": {
        type: "太空",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (state, count) => standardCost({铝: 50, 碳纤维: 150}, 1.10, count, getGlobalCostMultiplier(state)),
        produces: {铜: 0.8}, consumes: {电力: 0.4, 太空宜居度: 0.4}, caps: {},
        desc: "月球铜矿"
    },
    "月球钛矿": {
        type: "太空",
        unlockCondition: { tech: "进阶月球采矿" },
        cost: (state, count) => standardCost({金属板: 100, 碳纤维: 250}, 1.12, count, getGlobalCostMultiplier(state)),
        produces: {钛: 0.3}, consumes: {电力: 0.5, 太空宜居度: 0.4}, caps: {钛: 50},
        desc: "月球钛矿"
    },
    "月球研究所": {
        type: "太空",
        unlockCondition: { tech: "研究月球" },
        cost: (state, count) => standardCost({钛: 250, 钢: 400}, 1.12, count, getGlobalCostMultiplier(state)),
        produces: {科学: 0.1}, consumes: {电力: 0.5, 太空宜居度: 0.3},
        caps: {科学: 100},
        desc: "月球科研建筑"
    },
    "月球工厂": {
        type: "太空",
        unlockCondition: { tech: "月球工厂" },
        cost: (state, count) => standardCost({钛: 300, 碳纤维: 300}, 1.15, count, getGlobalCostMultiplier(state)),
        consumes: {电力: 0.3, 太空宜居度:0.2},
        desc: "提高各个工厂产出",
        modifiers: [
            { target: "建材工厂", prodFactor: 0.05 },
            { target: "炼钢厂", prodFactor: 0.05 },
            { target: "电解铝厂", prodFactor: 0.05 },
            { target: "金属加工厂", prodFactor: 0.05 },
            { target: "塑料厂", prodFactor: 0.05 },
            { target: "碳纤维厂", prodFactor: 0.05 },
            { target: "核燃料工厂", prodFactor: 0.05 }
        ]
    },
    "氚提取站": {
        type: "太空",
        unlockCondition: { tech: "氚提取" },
        cost: (state, count) => standardCost({建材: 20000, 金属板: 10000}, 1.15, count, getGlobalCostMultiplier(state)),
        produces: {氚: 0.2}, consumes: {电力: 0.6, 太空宜居度: 0.5},
        caps: {氚: 100},
        desc: "从气态行星上提取氚"
    },
    "氚燃料厂": {
        type: "太空",
        unlockCondition: { tech: "氚处理" },
        cost: (state, count) => standardCost({钛: 10000, 碳纤维: 20000}, 1.12, count, getGlobalCostMultiplier(state)),
        produces: {核燃料: 0.4},
        consumes: {氚: 0.1, 电力: 0.3, 太空宜居度: 0.8},
        caps: {核燃料: 100},
        desc: "将氚加工成核燃料"
    },
    "聚变反应堆": {
        type: "电力",
        unlockCondition: { tech: "可控核聚变" },
        cost: (state, count) => standardCost({金属板: 10000, 碳纤维: 5000, 核燃料: 1000}, 1.05, count, getGlobalCostMultiplier(state)),
        produces: {电力: 1.5},
        consumes: {核燃料: 0.30},
        desc: "通过核聚变产生大量清洁能源"
    },
    "太空剧院": {
        type: "太空",
        unlockCondition: { tech: "太空剧院" },
        cost: (state, count) => standardCost({金属板: 500, 塑料: 500}, 1.20, count, getGlobalCostMultiplier(state)),
        produces: {},
        consumes: {电力: 0.2, 科学: 2},
        caps: {},
        happiness: (state) => {
            const darkEnergy = state.resources["暗能量"]?.amount || 0;
            return 0.2 * Math.log(Math.pow(2.718, 5) + darkEnergy);
        },
        desc: "使用暗能量表演魔术，提高幸福度。提高的量与当前拥有的暗能量相关。"
    },
    "戴森球": {
        type: "太空",
        unlockCondition: { tech: "戴森球计划" },
        cost: (state, count) => standardCost({钛: 500000, 金属板: 500000}, 1.2, count, getGlobalCostMultiplier(state)),
        produces: {电力:1.5},
        desc: "围绕太阳建造一个巨大的戴森球"
    },
    "星际交易站": {
        type: "太空",
        unlockCondition: { tech: "星际交易" },
        cost: (state, count) => standardCost({钢: 50000, 金: 5000}, 1.1, count, getGlobalCostMultiplier(state)),
        consumes: {电力:0.1}, caps: {金:1000},
        desc: "交易效率远远高于市场"
    },
    "军营": {
        type: "军事",
        unlockCondition: { tech: "军事理论" },
        cost: (state, count) => standardCost({铁: 1000, 铜: 800}, 1.3, count, getGlobalCostMultiplier(state)),
        produces: {军备: 0.2}, consumes: {铁: 0.5, 铜: 0.3, 政策点:0.1}, caps: {军备:10},
        desc: "训练士兵，生产军备。"
    },
    "军工厂": {
        type: "军事",
        unlockCondition: { tech: "军工技术" },
        cost: (state, count) => standardCost({金属板: 1000, 钢: 800}, 1.3, count, getGlobalCostMultiplier(state)),
        consumes: {钢:0.2, 电力:0.2}, caps: {},
        modifiers: [
            { target: "军营", prodFactor: 0.05 },
            { target: "军营", capFactor: 0.05 }
        ],
        desc: "提高军营效率。"
    }
};