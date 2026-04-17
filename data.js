// data.js

// 全局游戏状态
let GameState = {
    resources: {},
    buildings: {},
    techs: {},
    upgrades: {},
    policies: {},
    permanent: {},
    gameTime: 0
};

function initGameData() {
    GameState.resources = {
        "木头": { baseCap: 100, cap: 100, amount: 0, production: 0, visible: false, value: 1, heat: 1 },
        "石头": { baseCap: 100, cap: 100, amount: 0, production: 0, visible: false, value: 2, heat: 1 },
        "科学": { baseCap: 100, cap: 100, amount: 0, production: 0, visible: false },
        "政策点": { baseCap: 100, cap: 100, amount: 0, production: 0, visible: false },
        "煤": { baseCap: 100, cap: 100, amount: 0, production: 0, visible: false, value: 1.5, heat: 1 },
        "铜": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 3, heat: 1 },
        "铁": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 3, heat: 1 },
        "铝": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 4, heat: 1 },
        "金": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false },
        "钢": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 6, heat: 1 },
        "钛": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 8, heat: 1 },
        "电力": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false },
        "建材": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 5, heat: 1 },
        "石油": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 4, heat: 1 },
        "塑料": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 6, heat: 1 },
        "金属板": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 7, heat: 1 },
        "碳纤维": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 12, heat: 1 },
        "铀": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 15, heat: 1 },
        "核燃料": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 20, heat: 1 },
        "月球宜居度": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false },
        "遗物": { baseCap: 10000, cap: 10000, amount: 0, production: 0, visible: false }
    };

    // ==================== 建筑定义 ====================
    // baseProduce: 正产出数值 (单位/秒)   baseConsume: 消耗数值 (正数)   capProvide: 提供的基础上限
    GameState.buildings = {
        "伐木场": {
            basePrice: {木头: 10}, price: {木头: 10}, costGrowth: 1.15,
            baseProduce: {木头: 0.2}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产木材"
        },
        "采石场": {
            basePrice: {木头: 5,石头: 5}, price: {木头: 5,石头: 5}, costGrowth: 1.15,
            baseProduce: {石头: 0.2}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "开采石头"
        },
        "仓库": {
            basePrice: {木头: 50,石头: 50}, price: {木头: 50,石头: 50}, costGrowth: 1.08,
            baseProduce: {}, baseConsume: {}, capProvide: {木头: 50,石头: 50},
            count: 0, active: 0, visible: false, desc: "提高木头和石头的储存上限"
        },
        "集装箱": {
            basePrice: {铁: 40,铜: 20}, price: {铁: 40,铜: 20}, costGrowth: 1.2,
            baseProduce: {}, baseConsume: {},
            capProvide: {木头:500,石头:500,煤:200,铜:200,铁:200,钢:200,铝:200},
            count: 0, active: 0, visible: false, desc: "储存更多资源"
        },
        "大型仓库": {
            basePrice: {金属板: 40,钢: 40}, price: {金属板: 40,钢: 40}, costGrowth: 1.1,
            baseProduce: {}, baseConsume: {电力: 0.05},
            capProvide: {木头:3000,石头:3000,煤:500,铜:500,铁:500,钢:200,铝:200,金:200,建材:200,塑料:200,金属板:200},
            count: 0, active: 0, visible: false, desc: "消耗电力，大幅提升多种资源上限"
        },
        "煤矿": {
            basePrice: {石头: 100}, price: {石头: 100}, costGrowth: 1.20,
            baseProduce: {煤: 0.1}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产少量煤"
        },
        "大型煤矿": {
            basePrice: {建材: 20,木头: 200}, price: {建材: 20,木头: 200}, costGrowth: 1.15,
            baseProduce: {煤: 0.5}, baseConsume: {电力: 0.15}, capProvide: {煤: 50},
            count: 0, active: 0, visible: false, desc: "耗电，高产煤"
        },
        "金矿": {
            basePrice: {铁: 80,木头: 500}, price: {铁: 80,木头: 500}, costGrowth: 1.20,
            baseProduce: {金: 0.05}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产少量金"
        },
        "铜冶炼厂": {
            basePrice: {石头: 50}, price: {石头: 50}, costGrowth: 1.1,
            baseProduce: {铜: 0.05}, baseConsume: {煤: 0.1, 石头: 0.5}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤和石头，生产铜"
        },
        "铁冶炼厂": {
            basePrice: {石头: 30,铜: 5}, price: {石头: 30,铜: 5}, costGrowth: 1.1,
            baseProduce: {铁: 0.05}, baseConsume: {煤: 0.2, 石头: 0.5}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤和石头，生产铁"
        },
        "行政机关": {
            basePrice: {木头: 100,铁: 30}, price: {木头: 100,铁: 30}, costGrowth: 2.0,
            baseProduce: {政策点: 0.05}, baseConsume: {科学: 0.2}, capProvide: {政策点: 50},
            count: 0, active: 0, visible: false, desc: "消耗科学，生产政策点"
        },
        "图书馆": {
            basePrice: {木头: 20}, price: {木头: 20}, costGrowth: 1.2,
            baseProduce: {科学: 0.15}, baseConsume: {}, capProvide: {科学: 10},
            count: 0, active: 0, visible: false, desc: "生产科学，增加科学上限"
        },
        "大学": {
            basePrice: {铜: 30,铁: 30}, price: {铜: 30,铁: 30}, costGrowth: 1.2,
            baseProduce: {科学: 0.2}, baseConsume: {电力: 0.1}, capProvide: {科学: 40},
            count: 0, active: 0, visible: false, desc: "消耗电力，生产科学"
        },
        "博物馆": {
            basePrice: {石头: 300,铜: 100}, price: {石头: 300,铜: 100}, costGrowth: 1.2,
            baseProduce: {科学: 0.2, 金: 0.1}, baseConsume: {}, capProvide: {科学: 50},
            count: 0, active: 0, visible: false, desc: "研究遗物，生产科学和金"
        },
        "科学院": {
            basePrice: {塑料: 30,金属板: 30}, price: {塑料: 30,金属板: 30}, costGrowth: 1.15,
            baseProduce: {科学: 0.3}, baseConsume: {电力: 0.15}, capProvide: {科学: 80},
            count: 0, active: 0, visible: false, desc: "高级科学建筑"
        },
        "蒸汽机": {
            basePrice: {石头: 100,铁: 20}, price: {石头: 100,铁: 20}, costGrowth: 1.12,
            baseProduce: {电力: 0.2}, baseConsume: {煤: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤，产生电力"
        },
        "建材工厂": {
            basePrice: {铁: 50,木头: 200}, price: {铁: 50,木头: 200}, costGrowth: 1.10,
            baseProduce: {建材: 0.1}, baseConsume: {木头: 5, 石头: 2, 铁: 0.1, 电力: 0.1},
            capProvide: {建材: 50},
            count: 0, active: 0, visible: false, desc: "生产建材"
        },
        "炼钢厂": {
            basePrice: {建材: 30,铜: 100}, price: {建材: 30,铜: 100}, costGrowth: 1.15,
            baseProduce: {钢: 0.05}, baseConsume: {煤: 0.1, 铁: 0.3}, capProvide: {钢: 50},
            count: 0, active: 0, visible: false, desc: "将铁冶炼成钢"
        },
        "电解铝厂": {
            basePrice: {建材: 30,钢: 40}, price: {建材: 30,钢: 40}, costGrowth: 1.15,
            baseProduce: {铝: 0.05}, baseConsume: {电力: 0.25, 石头: 0.5}, capProvide: {铝: 50},
            count: 0, active: 0, visible: false, desc: "生产铝"
        },
        "金属加工厂": {
            basePrice: {建材: 50,铁: 100}, price: {建材: 50,铁: 100}, costGrowth: 1.10,
            baseProduce: {金属板: 0.05}, baseConsume: {电力: 0.1, 铜: 0.5, 铝: 0.2},
            capProvide: {金属板: 50},
            count: 0, active: 0, visible: false, desc: "生产金属板"
        },
        "塑料厂": {
            basePrice: {金属板: 30,建材: 30}, price: {金属板: 30,建材: 30}, costGrowth: 1.10,
            baseProduce: {塑料: 0.1}, baseConsume: {电力: 0.1, 石油: 0.3}, capProvide: {塑料: 50},
            count: 0, active: 0, visible: false, desc: "生产塑料"
        },
        "碳纤维厂": {
            basePrice: {金属板: 200,塑料: 100}, price: {金属板: 200,塑料: 100}, costGrowth: 1.08,
            baseProduce: {碳纤维: 0.1}, baseConsume: {电力: 0.3, 煤: 0.1}, capProvide: {碳纤维: 50},
            count: 0, active: 0, visible: false, desc: "生产碳纤维"
        },
        "核燃料工厂": {
            basePrice: {金属板: 150,铁: 400}, price: {金属板: 150,铁: 400}, costGrowth: 1.08,
            baseProduce: {核燃料: 0.1}, baseConsume: {电力: 0.5, 铀: 0.1}, capProvide: {核燃料: 50},
            count: 0, active: 0, visible: false, desc: "生产核燃料"
        },
        "市场": {
            basePrice: {建材: 20,金: 20}, price: {建材: 20,金: 20}, costGrowth: 1.05,
            baseProduce: {}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "提升交易数量"
        },
        "油田": {
            basePrice: {金属板: 10,钢: 30}, price: {金属板: 10,钢: 30}, costGrowth: 1.10,
            baseProduce: {石油: 0.2}, baseConsume: {电力: 0.2}, capProvide: {石油: 20},
            count: 0, active: 0, visible: false, desc: "开采石油"
        },
        "太阳能板": {
            basePrice: {塑料: 30,铜: 200}, price: {塑料: 30,铜: 200}, costGrowth: 1.04,
            baseProduce: {电力: 0.1}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "清洁电力"
        },
        "电池": {
            basePrice: {铜: 300,铁: 300}, price: {铜: 300,铁: 300}, costGrowth: 1.2,
            baseProduce: {}, baseConsume: {}, capProvide: {电力: 200},
            count: 0, active: 0, visible: false, desc: "储存电力"
        },
        "铀矿": {
            basePrice: {铁: 300,建材: 150}, price: {铁: 300,建材: 150}, costGrowth: 1.1,
            baseProduce: {铀: 0.1}, baseConsume: {}, capProvide: {铀: 50},
            count: 0, active: 0, visible: false, desc: "开采铀"
        },
        "裂变反应堆": {
            basePrice: {金属板: 100,铀: 30}, price: {金属板: 100,铀: 30}, costGrowth: 1.15,
            baseProduce: {电力: 0.5}, baseConsume: {核燃料: 0.02}, capProvide: {铀: 50},
            count: 0, active: 0, visible: false, desc: "核能发电"
        },
        "月球基地": {
            basePrice: {金属板: 50,碳纤维: 100}, price: {金属板: 50,碳纤维: 100}, costGrowth: 1.05,
            baseProduce: {月球宜居度: 0.2}, baseConsume: {电力: 0.3},
            capProvide: {铀:200,钛:200,碳纤维:200,核燃料:50,月球宜居度:50},
            count: 0, active: 0, visible: false, desc: "月球殖民"
        },
        "月球铁矿": {
            basePrice: {钢: 50,碳纤维: 150}, price: {钢: 50,碳纤维: 150}, costGrowth: 1.10,
            baseProduce: {铁: 0.3}, baseConsume: {电力: 0.2, 月球宜居度: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "月球铁矿"
        },
        "月球铜矿": {
            basePrice: {铝: 50,碳纤维: 150}, price: {铝: 50,碳纤维: 150}, costGrowth: 1.10,
            baseProduce: {铜: 0.3}, baseConsume: {电力: 0.2, 月球宜居度: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "月球铜矿"
        },
        "月球钛矿": {
            basePrice: {金属板: 100,碳纤维: 250}, price: {金属板: 100,碳纤维: 250}, costGrowth: 1.08,
            baseProduce: {钛: 0.1}, baseConsume: {电力: 0.4, 月球宜居度: 0.2}, capProvide: {钛: 50},
            count: 0, active: 0, visible: false, desc: "月球钛矿"
        },
        "月球研究所": {
            basePrice: {钛: 250,钢: 400}, price: {钛: 250,钢: 400}, costGrowth: 1.08,
            baseProduce: {科学: 0.1}, baseConsume: {电力: 0.4, 月球宜居度: 0.2},
            capProvide: {科学: 200},
            count: 0, active: 0, visible: false, desc: "月球科研"
        }
    };

    // ==================== 科技定义 ====================
    // effect 中使用 prodFactor / consFactor / capFactor 表示百分比加成 (例如 0.05 = +5%)
    GameState.techs = {
        "伐木技术": { price: {科学: 5}, prereq: null, desc: "解锁伐木场。要致富，先撸树！", unlocks: ["伐木场"], researched: false },
        "采石技术": { price: {科学: 5}, prereq: ["伐木技术"], desc: "解锁采石场，无中生有生产石头！", unlocks: ["采石场"], researched: false },
        "印刷术": { price: {科学: 10}, prereq: ["伐木技术"], desc: "解锁图书馆，可以储存更多知识", unlocks: ["图书馆"], researched: false },
        "高效采石": { price: {科学: 400}, prereq: ["矿物学"], desc: "解锁采石场优化升级", unlocksUpgrades: ["采石场优化"], researched: false },
        "基础储存技术": { price: {科学: 10}, prereq: ["采石技术"], desc: "解锁仓库，让你可以储存少量资源", unlocks: ["仓库"], researched: false },
        "木制工具": { price: {科学: 20,木头: 150}, prereq: ["伐木技术"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "石制工具": { price: {科学: 30,石头: 150}, prereq: ["木制工具"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "铁制工具": { price: {科学: 200,铁: 50}, prereq: ["铁冶炼"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "钢制工具": { price: {科学: 500,钢: 50}, prereq: ["炼钢技术"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "碳纤维工具": { price: {科学: 1200,碳纤维: 150}, prereq: ["碳纤维材料"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "钛制工具": { price: {科学: 2500,钛: 150}, prereq: ["进阶月球采矿"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "杜威分类法": { price: {科学: 150}, prereq: ["印刷术"], desc: "图书馆科学上限+100%",
            effect: {图书馆: {capFactor: 1.00}}, researched: false },
        "煤矿生产": { price: {科学: 60}, prereq: ["石制工具"], desc: "解锁煤矿", unlocks: ["煤矿"], researched: false },
        "化学": { price: {科学: 120,石头: 200}, prereq: ["印刷术"], desc: "基础化学", researched: false },
        "铜冶炼": { price: {科学: 150,煤: 10}, prereq: ["化学"], desc: "解锁铜冶炼厂", unlocks: ["铜冶炼厂"], researched: false },
        "铁冶炼": { price: {科学: 180,煤: 20}, prereq: ["煤矿生产"], desc: "解锁铁冶炼厂", unlocks: ["铁冶炼厂"], researched: false },
        "管理学": { price: {科学: 200}, prereq: ["铁冶炼"], desc: "解锁行政机关和基础资源政策", unlocks: ["行政机关"], unlocksPolicies: ["基础资源政策"], researched: false },
        "冶炼管理": { price: {科学: 300,铁: 20}, prereq: ["管理学"], desc: "解锁冶炼方式政策", unlocksPolicies: ["冶炼方式"], researched: false },
        "初等数学": { price: {科学: 200}, prereq: ["印刷术"], desc: "基础数学", researched: false },
        "微积分": { price: {科学: 220}, prereq: ["初等数学"], desc: "解锁大学", unlocks: ["大学"], researched: false },
        "高等代数": { price: {科学: 450}, prereq: ["微积分"], desc: "大学科学上限+20%",
            effect: {大学: {capFactor: 0.20}}, researched: false },
        "牛顿力学": { price: {科学: 250}, prereq: ["初等数学"], desc: "研究低速宏观弱引力下的物体运动规律。", researched: false },
        "电磁感应": { price: {科学: 300}, prereq: ["牛顿力学"], desc: "解锁蒸汽机，准确来说是蒸汽发电机。", unlocks: ["蒸汽机"], researched: false },
        "热学": { price: {科学: 300}, prereq: ["牛顿力学"], desc: "研究如何更好利用热量", researched: false },
        "改良蒸汽机": { price: {科学: 320,煤: 30}, prereq: ["热学"], desc: "蒸汽机电力+20%",
            effect: {蒸汽机: {prodFactor: 0.2}}, researched: false },
        "进阶存储技术": { price: {科学: 350,铁: 30}, prereq: ["基础储存技术"], desc: "解锁集装箱", unlocks: ["集装箱"], researched: false },
        "压缩存储技术": { price: {科学: 500,建材: 20}, prereq: ["进阶存储技术"], desc: "解锁储存优化升级", unlocksUpgrades: ["储存优化"], researched: false },
        "初级建筑学": { price: {科学: 300,铁: 30}, prereq: ["基础储存技术"], desc: "解锁建材工厂", unlocks: ["建材工厂"], researched: false },
        "高级建筑学": { price: {科学: 400,建材: 60}, prereq: ["初级建筑学"], desc: "建材工厂建材产量+100%",
            effect: {建材工厂: {prodFactor: 1.00}}, researched: false },
        "林业工程": { price: {科学: 500}, prereq: ["初级建筑学"], desc: "解锁伐木场优化升级", unlocksUpgrades: ["伐木场优化"], researched: false },
        "矿物学": { price: {科学: 400,石头: 300}, prereq: ["化学"], desc: "解锁大型煤矿", unlocks: ["大型煤矿"], researched: false },
        "高效冶炼": { price: {科学: 450,铜: 200,铁: 200}, prereq: ["矿物学"], desc: "铜/铁冶炼厂产量+50%",
            effect: {铜冶炼厂: {prodFactor: 0.50}, 铁冶炼厂: {prodFactor: 0.50}}, researched: false },
        "金精炼": { price: {科学: 400,石头: 500}, prereq: ["矿物学"], desc: "解锁金矿", unlocks: ["金矿"], researched: false },
        "国际贸易学": { price: {科学: 600,金: 5}, prereq: ["金精炼"], desc: "解锁市场", unlocks: ["市场"], researched: false },
        "金融学": { price: {科学: 700,金: 20}, prereq: ["国际贸易学"], desc: "解锁经济观念政策", unlocksPolicies: ["经济观念"], researched: false },
        "炼钢技术": { price: {科学: 400,铁: 100}, prereq: ["化学"], desc: "解锁炼钢厂", unlocks: ["炼钢厂"], researched: false },
        "电解铝": { price: {科学: 420}, prereq: ["矿物学"], desc: "解锁电解铝厂", unlocks: ["电解铝厂"], researched: false },
        "金属加工": { price: {科学: 450}, prereq: ["电解铝"], desc: "解锁金属加工厂", unlocks: ["金属加工厂"], researched: false },
        "运筹学": { price: {科学: 600}, prereq: ["高等代数"], desc: "解锁工厂优化升级", unlocksUpgrades: ["工厂优化"], researched: false },
        "大宗存储技术": { price: {科学: 480}, prereq: ["金属加工"], desc: "解锁大型仓库", unlocks: ["大型仓库"], researched: false },
        "有机化学": { price: {科学: 500}, prereq: ["电解铝"], desc: "解锁油田", unlocks: ["油田"], researched: false },
        "材料化学": { price: {科学: 550}, prereq: ["有机化学"], desc: "解锁科学院", unlocks: ["科学院"], researched: false },
        "石油加工": { price: {科学: 550}, prereq: ["有机化学"], desc: "解锁塑料厂", unlocks: ["塑料厂"], researched: false },
        "太阳能": { price: {科学: 800}, prereq: ["石油加工"], desc: "解锁太阳能板", unlocks: ["太阳能板"], researched: false },
        "储能技术": { price: {科学: 700}, prereq: ["金属加工"], desc: "解锁电池", unlocks: ["电池"], researched: false },
        "原子结构模型": { price: {科学: 800}, prereq: ["储能技术"], desc: "原子物理", researched: false },
        "核物理": { price: {科学: 900}, prereq: ["原子结构模型"], desc: "解锁铀矿", unlocks: ["铀矿"], researched: false },
        "核裂变": { price: {科学: 1000,铀: 20}, prereq: ["核物理"], desc: "解锁裂变反应堆", unlocks: ["裂变反应堆"], researched: false },
        "浓缩铀": { price: {科学: 1050,铀: 50}, prereq: ["核裂变"], desc: "铀矿产量+50%",
            effect: {铀矿: {prodFactor: 0.50}}, researched: false },
        "碳纤维材料": { price: {科学: 1100}, prereq: ["有机化学"], desc: "解锁碳纤维厂", unlocks: ["碳纤维厂"], researched: false },
        "天体物理": { price: {科学: 1300,铀: 30}, prereq: ["核裂变"], desc: "天体物理", researched: false },
        "核燃料": { price: {科学: 1600,铀: 50}, prereq: ["天体物理"], desc: "解锁核燃料工厂", unlocks: ["核燃料工厂"], researched: false },
        "火箭动力学": { price: {科学: 1800,核燃料: 10}, prereq: ["核燃料"], desc: "火箭技术", researched: false },
        "探索月球": { price: {科学: 2000,核燃料: 30}, prereq: ["火箭动力学"], desc: "解锁月球基地", unlocks: ["月球基地"], researched: false },
        "基础月球采矿": { price: {科学: 2200,核燃料: 50}, prereq: ["探索月球"], desc: "解锁月球铁矿/铜矿", unlocks: ["月球铁矿","月球铜矿"], researched: false },
        "进阶月球采矿": { price: {科学: 2400,核燃料: 100}, prereq: ["探索月球"], desc: "解锁月球钛矿", unlocks: ["月球钛矿"], researched: false },
        "研究月球": { price: {科学: 2600,核燃料: 150}, prereq: ["探索月球"], desc: "解锁月球研究所", unlocks: ["月球研究所"], researched: false },
        "曼哈顿计划": { price: {科学: 1500,铀: 100}, prereq: ["核裂变"], desc: "解锁核弹重置", researched: false },
        "探索遗迹": { price: {科学: 500,遗物: 1}, prereq: ["矿物学"], desc: "解锁博物馆", unlocks: ["博物馆"], researched: false },
        "奇怪的石头":{price:{科学:500,石头: 1000},prereq:["采石技术"],desc:"人们在采集石头时发现一块奇怪的大石头，它表面十分光滑，还刻有神秘符号,没有人知道这是什么意思",researched:false},
        "熟悉的感觉":{price:{科学:5000},prereq:["奇怪的石头"],desc:"考古人员在研究石头时感觉似曾相识。石头吸引来很多人的兴趣，他们都有类似的感觉:他们曾经见过这块石头。",researched:false},
    };

    // ==================== 升级定义 ====================
    GameState.upgrades = {
        "伐木场优化": { basePrice: {木头:1500,科学:300}, price: {木头:1500,科学:300}, growth: 1.05,
            effect: {伐木场: 0.02}, level: 0, visible: false, desc: "伐木场效率+2%/级" },
        "采石场优化": { basePrice: {石头:1500,科学:300}, price: {石头:1500,科学:300}, growth: 1.05,
            effect: {采石场: 0.02}, level: 0, visible: false, desc: "采石场效率+2%/级" },
        "储存优化": { basePrice: {建材:50,科学:600}, price: {建材:50,科学:600}, growth: 1.05,
            effect: {仓库:0.02,集装箱:0.02,大型仓库:0.02}, level: 0, visible: false,
            desc: "仓库/集装箱/大型仓库效率+2%/级" },
        "工厂优化": { basePrice: {金属板:50,科学:600}, price: {金属板:50,科学:600}, growth: 1.05,
            effect: {建材工厂:0.02,金属加工厂:0.02,塑料厂:0.02}, level: 0, visible: false,
            desc: "建材/金属加工/塑料厂效率+2%/级" }
    };

    // ==================== 政策定义 ====================
    GameState.policies = {
        "基础资源政策": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视林业": { price: 20, prodFactor: {伐木场: 0.20,采石场: -0.15} },
                "重视矿业": { price: 20, prodFactor: {采石场: 0.20,伐木场: -0.15}}
            }
        },
        "冶炼方式": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视节能": { price: 40, prodFactor: {铜冶炼厂: -0.20, 铁冶炼厂: -0.20},
                            consFactor: {铜冶炼厂: -0.40, 铁冶炼厂: -0.40} },
                "重视速度": { price: 40, prodFactor: {铜冶炼厂: 0.50, 铁冶炼厂: 0.50},
                            consFactor: {铜冶炼厂: 0.80, 铁冶炼厂: 0.80} }
            }
        },
        "经济观念": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "科学至上": { price: 60, prodFactor: {图书馆:1.0, 大学:1.0, 科学院:1.0, 金矿:-0.30},
                            capFactor: {图书馆:0.05, 大学:0.05, 科学院:0.05} },
                "金钱至上": { price: 60, prodFactor: {图书馆:-0.80, 大学:-0.80, 科学院:-0.80, 金矿:0.30} }
            }
        }
    };

    // ==================== 永恒升级 ====================
    GameState.permanent = {
        "节约成本I": { price: {遗物: 10}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: null },
        "节约成本II": { price: {遗物: 30}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本I"] },
        "节约成本III": { price: {遗物: 100}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本II"] },
        "节约成本IV": { price: {遗物: 200}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本III"] },
        "节约成本V": { price: {遗物: 500}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本IV"] },
        "节约成本VI": { price: {遗物: 1000}, researched: false, desc: "成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本V"] },
        "高效生产I": { price: {遗物: 1}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: null },
        "高效生产II": { price: {遗物: 4}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产I"] },
        "高效生产III": { price: {遗物: 9}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产II"] },
        "高效生产IV": { price: {遗物: 16}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产III"] },
        "高效生产V": { price: {遗物: 25}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IV"] },
        "高效生产VI": { price: {遗物: 36}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产V"] },
        "高效生产VII": { price: {遗物: 49}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VI"] },
        "高效生产VIII": { price: {遗物: 64}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VII"] },
        "高效生产IX": { price: {遗物: 81}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VIII"] },
        "高效生产X": { price: {遗物: 100}, researched: false, desc: "产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IX"] },
        "高速生产I": { price: {遗物: 10}, researched: false, desc: "速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: null },
        "高速生产II": { price: {遗物: 20}, researched: false, desc: "速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产I"] },
        "高速生产III": { price: {遗物: 40}, researched: false, desc: "速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产II"] },
        "高速生产IV": { price: {遗物: 80}, researched: false, desc: "速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产III"] },
        "高速生产V": { price: {遗物: 160}, researched: false, desc: "速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产IV"] },
        "空间压缩I": { price: {遗物: 5}, researched: false, desc: "每遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: null },
        "空间压缩II": { price: {遗物: 10}, researched: false, desc: "每遗物提升储存建筑上限0.2%（科学除外）", effect: { capPerRelic: 0.002 }, prereq: ["空间压缩I"] },
        "空间压缩III": { price: {遗物: 20}, researched: false, desc: "每遗物提升储存建筑上限0.3%（科学除外）", effect: { capPerRelic: 0.003 }, prereq: ["空间压缩II"] },
        "空间压缩IV": { price: {遗物: 40}, researched: false, desc: "每遗物提升储存建筑上限0.4%（科学除外）", effect: { capPerRelic: 0.004 }, prereq: ["空间压缩III"] },
        "空间压缩V": { price: {遗物: 80}, researched: false, desc: "每遗物提升储存建筑上限0.5%（科学除外）", effect: { capPerRelic: 0.005 }, prereq: ["空间压缩IV"] },
        "技术爆炸": { price: {遗物: 50}, researched: false, desc: "根据遗物数量提升少量科学上限", effect: { sciCapPerRelicLog: 0.05 }, prereq: null }
    };

    // 初始化建筑价格及其他辅助字段
    for (let b in GameState.buildings) {
        let bd = GameState.buildings[b];
        bd.count = bd.count || 0;
        bd.active = bd.active || 0;
        bd.visible = bd.visible || false;
    }
    // 市场特殊标记
    GameState.buildings["市场"].tradeEnabled = true;
}