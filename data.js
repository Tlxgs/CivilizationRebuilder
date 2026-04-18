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
    GameState.happiness = 100; 
    GameState.resources = {
        "电力": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false },
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
        "建材": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 5, heat: 1 },
        "石油": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 4, heat: 1 },
        "塑料": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 6, heat: 1 },
        "金属板": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 7, heat: 1 },
        "碳纤维": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 12, heat: 1 },
        "铀": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 15, heat: 1 },
        "氚": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false},
        "核燃料": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false, value: 20, heat: 1 },
        "太空宜居度": { baseCap: 50, cap: 50, amount: 0, production: 0, visible: false },
        "遗物": { baseCap: 1000000, cap: 1000000, amount: 0, production: 0, visible: false },
        "暗能量":{baseCap:1000000,cap:1000000,amount:0,production:0,visible:false},
        "时间晶体":{baseCap:1000000,cap:1000000,amount:0,production:0,visible:false}
    };

    // ==================== 建筑定义 ====================
    // baseProduce: 正产出数值 (单位/秒)   baseConsume: 消耗数值 (正数)   capProvide: 提供的基础上限
    GameState.buildings = {
        "伐木场": {
            type: "生产",
            basePrice: {木头: 10}, price: {木头: 10}, costGrowth: 1.15,
            baseProduce: {木头: 0.2}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产木材"
        },
        "采石场": {
            type: "生产",
            basePrice: {木头: 5,石头: 5}, price: {木头: 5,石头: 5}, costGrowth: 1.15,
            baseProduce: {石头: 0.2}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "开采石头"
        },
        "仓库": {
            type: "存储",
            basePrice: {木头: 50,石头: 50}, price: {木头: 50,石头: 50}, costGrowth: 1.08,
            baseProduce: {}, baseConsume: {}, capProvide: {木头: 50,石头: 50},
            count: 0, active: 0, visible: false, desc: "提高木头和石头的储存上限"
        },
        "集装箱": {
            type: "存储",
            basePrice: {铁: 40,铜: 20}, price: {铁: 40,铜: 20}, costGrowth: 1.2,
            baseProduce: {}, baseConsume: {},
            capProvide: {木头:500,石头:500,煤:200,铜:200,铁:200,钢:200,铝:200},
            count: 0, active: 0, visible: false, desc: "储存更多资源"
        },
        "大型仓库": {
            type: "存储",
            basePrice: {金属板: 40,钢: 40}, price: {金属板: 40,钢: 40}, costGrowth: 1.1,
            baseProduce: {}, baseConsume: {电力: 0.05},
            capProvide: {木头:3000,石头:3000,煤:500,铜:500,铁:500,钢:200,铝:200,金:200,建材:200,塑料:200,金属板:200},
            count: 0, active: 0, visible: false, desc: "消耗电力，大幅提升多种资源上限"
        },
        "煤矿": {
            type: "生产",
            basePrice: {石头: 100}, price: {石头: 100}, costGrowth: 1.20,
            baseProduce: {煤: 0.1}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产少量煤"
        },
        "大型煤矿": {
            type: "生产", 
            basePrice: {建材: 20,木头: 200}, price: {建材: 20,木头: 200}, costGrowth: 1.15,
            baseProduce: {},
            baseConsume: {电力: 0.15}, 
            capProvide: {煤:100},
            count: 0, active: 0, visible: false, 
            desc: "提供煤储存，同时使煤矿产量+10%",
            modifiers: [
                { target: "煤矿", prodFactor: 0.10 } 
            ]
        },
        "工具加工站":{
            type: "生产", 
            basePrice: {铁: 500,石头: 500}, price: {铁: 500,石头: 500}, costGrowth: 1.15,
            baseProduce: {},
            baseConsume: {电力: 0.10}, 
            capProvide: {},
            count: 0, active: 0, visible: false, 
            desc: "制造工具来提高伐木场和采石场产量",
            modifiers: [
                { target: "伐木场", prodFactor: 0.02 }, 
                { target: "采石场", prodFactor: 0.02 } 
            ]

        },
        "金矿": {
            type: "生产",
            basePrice: {铁: 80,木头: 500}, price: {铁: 80,木头: 500}, costGrowth: 1.20,
            baseProduce: {金: 0.05}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "生产少量金"
        },
        "铜冶炼厂": {
            type: "工厂",
            happinessEffect:-0.1,
            basePrice: {石头: 50}, price: {石头: 50}, costGrowth: 1.1,
            baseProduce: {铜: 0.05}, baseConsume: {煤: 0.1, 石头: 0.5}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤和石头，生产铜"
        },
        "铁冶炼厂": {
            type: "工厂",
            happinessEffect:-0.1,
            basePrice: {石头: 30,铜: 5}, price: {石头: 30,铜: 5}, costGrowth: 1.1,
            baseProduce: {铁: 0.05}, baseConsume: {煤: 0.2, 石头: 0.5}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤和石头，生产铁"
        },
        "行政机关": {
            type: "其他",
            happinessEffect:0.5,
            basePrice: {木头: 100,铁: 30}, price: {木头: 100,铁: 30}, costGrowth: 2.0,
            baseProduce: {政策点: 0.05}, baseConsume: {科学: 0.2}, capProvide: {政策点: 50},
            count: 0, active: 0, visible: false, desc: "消耗科学，生产政策点"
        },
        "图书馆": {
            type: "科学",
            basePrice: {木头: 20}, price: {木头: 20}, costGrowth: 1.2,
            baseProduce: {科学: 0.15}, baseConsume: {}, capProvide: {科学: 10},
            count: 0, active: 0, visible: false, desc: "生产科学，增加科学上限"
        },
        "大学": {
            type: "科学",
            basePrice: {铜: 30,铁: 30}, price: {铜: 30,铁: 30}, costGrowth: 1.2,
            baseProduce: {科学: 0.2}, baseConsume: {电力: 0.1}, capProvide: {科学: 40},
            count: 0, active: 0, visible: false, desc: "消耗电力，生产科学"
        },
        "博物馆": {
            type: "科学",
            happinessEffect:0.5,
            basePrice: {石头: 300,铜: 100}, price: {石头: 300,铜: 100}, costGrowth: 1.2,
            baseProduce: {科学: 0.2, 金: 0.1}, baseConsume: {}, capProvide: {科学: 50},
            count: 0, active: 0, visible: false, desc: "研究遗物，生产科学和金"
        },
        "科学院": {
            type: "科学", 
            basePrice: {塑料: 30,金属板: 30}, price: {塑料: 30,金属板: 30}, costGrowth: 1.15,
            baseProduce: {}, 
            baseConsume: {电力: 0.15}, 
            capProvide: {}, 
            count: 0, active: 0, visible: false,
            desc: "提供先进理论，使大学科学产出和上限+5%",
            modifiers: [
                { target: "大学", prodFactor: 0.05, capFactor: 0.05 } 
            ]
        },
        "暗物质研究所":{
            type:"太空",
            basePrice:{钛:5000,碳纤维:500,科学:500},price:{钛:5000,碳纤维:500},costGrowth:1.10,
            baseProduce:{电力:0.1,科学:0.1},
            baseConsume:{太空宜居度:0.05},
            capProvide:{},
            count:0,active:0,visible:false,
            desc:"从暗物质中提取永不枯竭的能量！这似乎是永动机？",
        },
        "蒸汽机": {
            type: "电力",
            basePrice: {石头: 100,铁: 20}, price: {石头: 100,铁: 20}, costGrowth: 1.12,
            baseProduce: {电力: 0.2}, baseConsume: {煤: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "消耗煤，产生电力"
        },
        "建材工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {铁: 50,木头: 200}, price: {铁: 50,木头: 200}, costGrowth: 1.10,
            baseProduce: {建材: 0.1}, baseConsume: {木头: 5, 石头: 2, 铁: 0.1, 电力: 0.1},
            capProvide: {建材: 50},
            count: 0, active: 0, visible: false, desc: "生产建材"
        },
        "炼钢厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 30,铜: 100}, price: {建材: 30,铜: 100}, costGrowth: 1.15,
            baseProduce: {钢: 0.05}, baseConsume: {煤: 0.1, 铁: 0.3}, capProvide: {钢: 50},
            count: 0, active: 0, visible: false, desc: "将铁冶炼成钢"
        },
        "电解铝厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 30,钢: 40}, price: {建材: 30,钢: 40}, costGrowth: 1.15,
            baseProduce: {铝: 0.05}, baseConsume: {电力: 0.25, 石头: 0.5}, capProvide: {铝: 50},
            count: 0, active: 0, visible: false, desc: "生产铝"
        },
        "金属加工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 50,铁: 100}, price: {建材: 50,铁: 100}, costGrowth: 1.10,
            baseProduce: {金属板: 0.05}, baseConsume: {电力: 0.1, 铜: 0.5, 铝: 0.2},
            capProvide: {金属板: 50},
            count: 0, active: 0, visible: false, desc: "生产金属板"
        },
        "塑料厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 30,建材: 30}, price: {金属板: 30,建材: 30}, costGrowth: 1.10,
            baseProduce: {塑料: 0.1}, baseConsume: {电力: 0.1, 石油: 0.3}, capProvide: {塑料: 50},
            count: 0, active: 0, visible: false, desc: "生产塑料"
        },
        "碳纤维厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 200,塑料: 100}, price: {金属板: 200,塑料: 100}, costGrowth: 1.08,
            baseProduce: {碳纤维: 0.1}, baseConsume: {电力: 0.3, 煤: 0.1}, capProvide: {碳纤维: 50},
            count: 0, active: 0, visible: false, desc: "生产碳纤维"
        },
        "核燃料工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 150,铁: 400}, price: {金属板: 150,铁: 400}, costGrowth: 1.08,
            baseProduce: {核燃料: 0.1}, baseConsume: {电力: 0.5, 铀: 0.1}, capProvide: {核燃料: 50},
            count: 0, active: 0, visible: false, desc: "生产核燃料"
        },
        "市场": {
            type: "其他",
            basePrice: {建材: 20,金: 20}, price: {建材: 20,金: 20}, costGrowth: 1.05,
            baseProduce: {}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "提升单次交易数量。这不仅意味着你可以点击较少次，更意味着你可以在物品涨价到你无法承受之前买更多！"
        },
        "油田": {
            type: "生产",
            basePrice: {金属板: 10,钢: 30}, price: {金属板: 10,钢: 30}, costGrowth: 1.10,
            baseProduce: {石油: 0.2}, baseConsume: {电力: 0.2}, capProvide: {石油: 20},
            count: 0, active: 0, visible: false, desc: "开采石油"
        },
        "石油发电厂": {
            type: "电力",
            basePrice:{建材:50,钢:50}, price:{建材:50,钢:50}, costGrowth:1.2,
            baseProduce:{电力:0.25}, baseConsume:{石油:0.1}, capProvide:{},
            count:0, active:0, visible:false, desc:"使用石油发电"
        },
        "太阳能板": {
            type: "电力",
            basePrice: {塑料: 30,铜: 200}, price: {塑料: 30,铜: 200}, costGrowth: 1.04,
            baseProduce: {电力: 0.1}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "清洁电力"
        },
        "电池": {
            type: "电力",
            basePrice: {铜: 300,铁: 300}, price: {铜: 300,铁: 300}, costGrowth: 1.2,
            baseProduce: {}, baseConsume: {}, capProvide: {电力: 200},
            count: 0, active: 0, visible: false, desc: "储存电力"
        },
        "铀矿": {
            type: "生产",
            basePrice: {铁: 300,建材: 150}, price: {铁: 300,建材: 150}, costGrowth: 1.1,
            baseProduce: {铀: 0.1}, baseConsume: {}, capProvide: {铀: 50},
            count: 0, active: 0, visible: false, desc: "开采铀"
        },
        "裂变反应堆": {
            type: "电力",
            basePrice: {金属板: 100,铀: 30}, price: {金属板: 100,铀: 30}, costGrowth: 1.15,
            baseProduce: {电力: 0.5}, baseConsume: {核燃料: 0.02}, capProvide: {铀: 50},
            count: 0, active: 0, visible: false, desc: "核能发电"
        },
        "粒子加速器": {
            type: "科学",
            basePrice:{金属板:500,建材:500,科学:500}, price:{金属板:500,建材:500,科学:500}, costGrowth:1.06,
            baseProduce:{科学:0.3}, baseConsume:{电力:0.3}, capProvide:{},
            count:0, active:0, visible:false, desc:"产出科学，同时每个粒子加速器（无论是否激活）增加2%遗物获取。"
        },
        "轨道电梯": {
            type: "太空",
            basePrice: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            price: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            costGrowth: 1.08,
            baseProduce: {},
            baseConsume: {电力: 0.2},
            capProvide: {},
            count: 0, active: 0, visible: false,
            desc: "提升月球建筑产量",
            modifiers: [
                { target: "月球铁矿", prodFactor: 0.02 },
                { target: "月球铜矿", prodFactor: 0.02 },
                { target: "月球钛矿", prodFactor: 0.02 }
            ]
        },
        "月球基地": {
            type: "太空",
            basePrice: {金属板: 50,碳纤维: 100}, price: {金属板: 50,碳纤维: 100}, costGrowth: 1.06,
            baseProduce: {太空宜居度: 0.2}, baseConsume: {电力: 0.3},
            capProvide: {铀:200,钛:200,碳纤维:200,核燃料:50,太空宜居度:50},
            count: 0, active: 0, visible: false, desc: "月球殖民"
        },
        "气态行星基地": {
            type: "太空",
            basePrice: {钛: 10000,塑料: 5000}, price: {钛: 10000,塑料: 5000}, costGrowth: 1.10,
            baseProduce: {太空宜居度: 0.1}, baseConsume: {电力: 0.3},
            capProvide: {氚:200,核燃料:200,太空宜居度:50},
            modifiers: [
                { target: "氚提取站", prodFactor: 0.02},
                {target:"氚燃料厂",prodFactor:0.02} ,

            ],
            count: 0, active: 0, visible: false, desc: "这里环境远比月球恶劣，宜居度很差"
        },
        "月球铁矿": {
            type: "太空",
            basePrice: {钢: 50,碳纤维: 150}, price: {钢: 50,碳纤维: 150}, costGrowth: 1.10,
            baseProduce: {铁: 0.3}, baseConsume: {电力: 0.2, 太空宜居度: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "月球铁矿"
        },
        "月球铜矿": {
            type: "太空",
            basePrice: {铝: 50,碳纤维: 150}, price: {铝: 50,碳纤维: 150}, costGrowth: 1.10,
            baseProduce: {铜: 0.3}, baseConsume: {电力: 0.2, 太空宜居度: 0.2}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "月球铜矿"
        },
        "月球钛矿": {
            type: "太空",
            basePrice: {金属板: 100,碳纤维: 250}, price: {金属板: 100,碳纤维: 250}, costGrowth: 1.12,
            baseProduce: {钛: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.2}, capProvide: {钛: 50},
            count: 0, active: 0, visible: false, desc: "月球钛矿"
        },
        "月球研究所": {
            type: "太空",
            basePrice: {钛: 250,钢: 400}, price: {钛: 250,钢: 400}, costGrowth: 1.12,
            baseProduce: {科学: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.2},
            capProvide: {科学: 100},
            count: 0, active: 0, visible: false, desc: "月球科研建筑"
        },
        "月球工厂": {
            type: "太空", 
            basePrice: {钛: 300,碳纤维: 300}, price:{钛: 300,碳纤维: 300}, costGrowth: 1.15,
            baseProduce: {},
            baseConsume: {电力: 0.15,太空宜居度:0.1}, 
            capProvide: {},
            count: 0, active: 0, visible: false, 
            desc: "提高各个工厂产出",
            modifiers: [
                { target: "建材工厂", prodFactor: 0.05 },
                {target:"炼钢厂",prodFactor:0.05} ,
                {target:"电解铝厂",prodFactor:0.05},
                {target:"金属加工厂",prodFactor:0.05},
                {target:"塑料厂",prodFactor:0.05},
                {target:"碳纤维厂",prodFactor:0.05},
                {target:"核燃料工厂",prodFactor:0.05},

            ]
        },
        "氚提取站":{
            type:"太空",
            basePrice: {建材: 20000,金属板: 10000}, price: {建材: 20000,金属板: 10000}, costGrowth: 1.15,
            baseProduce: {氚: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.3},
            capProvide: {氚: 100},
            count: 0, active: 0, visible: false, desc: "从气态行星上提取氚"
        },
        "氚燃料厂": {
            type: "太空",
            basePrice: {钛: 10000,碳纤维: 20000}, 
            price: {钛: 10000,碳纤维: 20000}, 
            costGrowth: 1.12,
            baseProduce: {核燃料: 0.2}, 
            baseConsume: {氚: 0.05, 电力: 0.2, 太空宜居度: 0.5},
            capProvide: {核燃料: 100},
            count: 0, active: 0, visible: false, 
            desc: "将氚加工成核燃料，用于更高效的聚变反应"
        },
        "聚变反应堆": {
            type: "电力",
            basePrice: {金属板: 10000,碳纤维: 5000,核燃料: 1000}, 
            price: {金属板: 10000,碳纤维: 5000,核燃料: 1000}, 
            costGrowth: 1.05,
            baseProduce: {电力: 1.0}, 
            baseConsume: {核燃料: 0.20},
            capProvide: {},
            count: 0, active: 0, visible: false, 
            desc: "通过核聚变产生大量清洁能源，是未来文明的基石"
        },

        "太空剧院":{
            type:"太空",
            basePrice:{金属板:500,塑料:500},price:{金属板:500,塑料:50},costGrowth:1.20,
            happinessEffect:2,
            baseProduce:{},
            baseConsume:{电力:0.1,科学:2},
            capProvide:{},
            count:0,active:0,visible:false,
            desc:"使用暗能量表演魔术，提高幸福度"
        },
        "戴森球":{
            type: "太空",
            basePrice: {钛: 500000,金属板: 500000}, price: {钛: 500000,金属板: 500000}, costGrowth: 1.2,
            baseProduce: {电力:1.0}, baseConsume: {}, capProvide: {},
            count: 0, active: 0, visible: false, desc: "围绕太阳建造一个巨大的戴森球"
        },
        "星际交易站":{
            type: "太空",
            basePrice: {钢: 50000,金: 5000}, price: {钢: 50000,金: 5000}, costGrowth: 1.1,
            baseProduce: {}, baseConsume: {电力:0.05}, capProvide: {金:1000},
            count: 0, active: 0, visible: false, desc: "交易效率远远高于市场"
        }
    };

    // ==================== 科技定义 ====================
    // effect 中使用 prodFactor / consFactor / capFactor 表示百分比加成 (例如 0.05 = +5%)
    GameState.techs = {
        "伐木技术": { price: {科学: 5}, prereq: null, desc: "要致富，先撸树！", unlocks: ["伐木场"], researched: false },
        "采石技术": { price: {科学: 5}, prereq: ["伐木技术"], desc: "徒手挖石头", unlocks: ["采石场"], researched: false },
        "印刷术": { price: {科学: 10}, prereq: ["伐木技术"], desc: "印刷术是人类近代文明的先导，为知识的广泛传播、交流创造了条件。", unlocks: ["图书馆"], researched: false },
        "高效采石": { price: {科学: 400}, prereq: ["矿物学"], desc: "尝试优化开采石头的效率，解锁新的升级。", unlocksUpgrades: ["采石场优化"], researched: false },
        "基础储存技术": { price: {科学: 10}, prereq: ["采石技术"], desc: "解锁仓库，让你可以储存少量资源。", unlocks: ["仓库"], researched: false },
        "木制工具": { price: {科学: 20,木头: 150}, prereq: ["伐木技术"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "石制工具": { price: {科学: 30,石头: 150}, prereq: ["木制工具"], desc: "伐木场/采石场速度+20%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.20}}, researched: false },
        "铁制工具": { price: {科学: 200,铁: 50}, prereq: ["铁冶炼"], desc: "伐木场/采石场速度+30%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.30}},unlocks:["工具加工站"], researched: false },
        "钢制工具": { price: {科学: 500,钢: 50}, prereq: ["炼钢技术"], desc: "伐木场/采石场速度+30%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.30}}, researched: false },
        "碳纤维工具": { price: {科学: 1200,碳纤维: 150}, prereq: ["碳纤维材料"], desc: "伐木场/采石场速度+50%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.50}}, researched: false },
        "钛制工具": { price: {科学: 2500,钛: 150}, prereq: ["进阶月球采矿"], desc: "伐木场/采石场速度+50%",
            effect: {伐木场: {prodFactor: 0.20}, 采石场: {prodFactor: 0.50}}, researched: false },
        "杜威分类法": { price: {科学: 150}, prereq: ["印刷术"], desc: "图书馆科学上限+100%",
            effect: {图书馆: {capFactor: 1.00}}, researched: false },
        "煤矿生产": { price: {科学: 60}, prereq: ["石制工具"], desc: "解锁煤矿", unlocks: ["煤矿"], researched: false },
        "化学": { price: {科学: 120,石头: 200}, prereq: ["印刷术"], desc: "化学是一门在微观层面洞悉物质奥秘的自然科学", researched: false },
        "铜冶炼": { price: {科学: 150,煤: 10}, prereq: ["化学"], desc: "以黄铜矿等硫化铜精矿为原料，通过焙烧、熔炼、吹炼、精炼等工序提取金属铜", unlocks: ["铜冶炼厂"], researched: false },
        "铁冶炼": { price: {科学: 180,煤: 20}, prereq: ["煤矿生产"], desc: "在高温下，用还原剂将铁矿石还原得到生铁", unlocks: ["铁冶炼厂"], researched: false },
        "管理学": { price: {科学: 200}, prereq: ["铁冶炼"], desc: "管理学是研究管理规律、方法与模式，以提升组织效益的综合性交叉学科。", unlocks: ["行政机关"], unlocksPolicies: ["基础资源政策"], researched: false },
        "冶炼管理": { price: {科学: 300,铁: 20}, prereq: ["管理学"], desc: "解锁冶炼方式政策", unlocksPolicies: ["冶炼方式"], researched: false },
        "初等数学": { price: {科学: 200}, prereq: ["印刷术"], desc: "初等数学涵盖算术、代数、几何、三角学及概率统计等基础内容", researched: false },
        "微积分": { price: {科学: 220}, prereq: ["初等数学"], desc: "微积分是研究函数变化率和累积变化的数学分支，主要包括微分学、积分学及其应用。", unlocks: ["大学"], researched: false },
        "高等代数": { price: {科学: 450}, prereq: ["微积分"], desc: "高等代数是代数学发展到高级阶段的总称，主要包括线性代数和多项式代数两大分支。大学科学上限+20%",
            effect: {大学: {capFactor: 0.20}}, researched: false },
        "牛顿力学": { price: {科学: 250}, prereq: ["初等数学"], desc: "研究低速宏观弱引力下的物体运动规律。", researched: false },
        "相对论":{price:{科学:500},prereq:["牛顿力学"],desc:"时空是一个整体，也许我们有办法穿越时间。",researched:false},
        //"时间穿越":{price:{科学:2000,暗能量:0.1},prereq:["相对论"],desc:"利用宇宙中的暗能量，产生时间晶体。",unlocks:["时间晶体机"],researched:false},
        "电磁感应": { price: {科学: 300}, prereq: ["牛顿力学"], desc: "解锁蒸汽机，准确来说是蒸汽发电机。", unlocks: ["蒸汽机"], researched: false },
        "热学": { price: {科学: 300}, prereq: ["牛顿力学"], desc: "研究如何更好利用热量", researched: false },
        "改良蒸汽机": { price: {科学: 320,煤: 30}, prereq: ["热学"], desc: "蒸汽机电力+20%",
            effect: {蒸汽机: {prodFactor: 0.2}}, researched: false },
        "进阶存储技术": { price: {科学: 350,铁: 30}, prereq: ["基础储存技术"], desc: "解锁集装箱", unlocks: ["集装箱"], researched: false },
        "压缩存储技术": { price: {科学: 500,建材: 20}, prereq: ["进阶存储技术"], desc: "解锁储存优化升级", unlocksUpgrades: ["储存优化"], researched: false },
        "初级建筑学": { price: {科学: 300,铁: 30}, prereq: ["基础储存技术"], desc: "解锁建材工厂", unlocks: ["建材工厂"], researched: false },
        "高级建筑学": { price: {科学: 400,建材: 60}, prereq: ["初级建筑学"], desc: "建材工厂建材产量+100%",
            effect: {建材工厂: {prodFactor: 1.00}}, researched: false },
        "林业工程": { price: {科学: 500}, prereq: ["初级建筑学"], desc: "林业工程，是指以森林资源的高效利用和可持续发展为原则，将各种工程技术应用于森林资源培育、开发利用及林产品加工的活动", unlocksUpgrades: ["伐木场优化"], researched: false },
        "矿物学": { price: {科学: 400,石头: 300}, prereq: ["化学"], desc: "解锁大型煤矿", unlocks: ["大型煤矿"], researched: false },
        "高效冶炼": { price: {科学: 450,铜: 200,铁: 200}, prereq: ["矿物学"], desc: "铜/铁冶炼厂产量+50%",
            effect: {铜冶炼厂: {prodFactor: 0.50}, 铁冶炼厂: {prodFactor: 0.50}}, researched: false },
        "金精炼": { price: {科学: 400,石头: 500}, prereq: ["矿物学"], desc: "解锁金矿", unlocks: ["金矿"], researched: false },
        "国际贸易学": { price: {科学: 600,金: 5}, prereq: ["金精炼"], desc: "解锁市场", unlocks: ["市场"], researched: false },
        "金融学": { price: {科学: 700,金: 20}, prereq: ["国际贸易学"], desc: "解锁经济观念政策", unlocksPolicies: ["经济观念"], researched: false },
        "炼钢技术": { price: {科学: 400,铁: 100}, prereq: ["化学"], desc: "炼钢技术是将生铁熔炼成钢，通过控制碳含量、去除有害元素并调整合金成分以获得所需性能的工艺", unlocks: ["炼钢厂"], researched: false },
        "电解铝": { price: {科学: 420}, prereq: ["矿物学"], desc: "电解铝是通过电解氧化铝获得金属铝的工业生产方法，是现代铝工业的核心工艺。", unlocks: ["电解铝厂"], researched: false },
        "拜耳法":{price:{科学:500},prereq:["电解铝"],desc:"拜耳法是一种工业上广泛使用的从铝土矿生产氧化铝的化工过程,电解铝厂的产出+50%",
            effect:{电解铝厂:{prodFactor:0.50}},researched:false},
        "金属加工": { price: {科学: 450}, prereq: ["电解铝"], desc: "解锁金属加工厂金属加工是以金属材料进行加工的生产活动，涵盖从大型工业零件到精密组件的制造工艺", unlocks: ["金属加工厂"], researched: false },
        "运筹学": { price: {科学: 600}, prereq: ["高等代数"], desc: "运筹学主要目的是在决策时为管理人员提供科学依据，是实现有效管理、正确决策和现代化管理的重要方法之一", unlocksUpgrades: ["工厂优化"], researched: false },
        "大宗存储技术": { price: {科学: 480}, prereq: ["金属加工"], desc: "解锁大型仓库", unlocks: ["大型仓库"], researched: false },
        "有机化学": { price: {科学: 500}, prereq: ["电解铝"], desc: "有机化学是研究有机化合物的组成、结构、性质、制备方法与应用的科学", unlocks: ["油田"], researched: false },
        "生物学":{price:{科学:1000},prereq:["有机化学"],desc:"研究生物的科学",researched: false},
        "基因编辑":{price:{科学:10000},prereq:["生物学"],desc:"人们开始尝试编辑自己的基因，科学家警告这可能造成严重后果",researched:false},
        "碳纤维亲和":{
            price:{科学:15000},prereq:["基因编辑"],desc:"⚠️这是一种使人更加适应碳纤维的基因，但是副作用是人们变得更笨了，且目前没有任何手段消除该副作用。碳纤维厂产出+100%，大学科学上限-10%",effect:{碳纤维厂:{prodFactor:1.0},大学:{capFactor:-0.1}},researched:false
        },
        "保守基因":{
            price:{科学:15000},prereq:["基因编辑"],desc:"⚠️这是一种使人更加保守和不愿探索的基因，且目前没有任何手段消除该副作用。月球基地产出-10%，蒸汽机和石油发电厂产出+20%",effect:{石油发电厂:{prodFactor:0.2},蒸汽机:{prodFactor:0.2},月球基地:{prodFactor:-0.2}}
        },
        "材料化学": { price: {科学: 550}, prereq: ["有机化学"], desc: "材料化学是一门从化学角度研究和设计材料的学科，强调材料的组成、结构与性能之间的关系，并结合实验与应用开发新材料", unlocks: ["科学院"], researched: false },
        "石油加工": { price: {科学: 550}, prereq: ["有机化学"], desc: "石油加工是将原油通过物理分离和化学转化加工成燃料油及化工原料的工业体系，包括预处理、蒸馏、催化裂化、加氢处理、精制及化工延伸等多个环节", unlocks: ["塑料厂"], researched: false },
        "石油发电":{price:{科学:600,石油:50},prereq:["石油加工"],desc:"石油发电主要通过燃烧原油或石油制品产生高温蒸汽或直接驱动内燃机，推动发电机发电",unlocks:["石油发电厂"],researched:false},
        "太阳能": { price: {科学: 800}, prereq: ["石油加工"], desc: "太阳能是由太阳内部氢原子发生氢氦聚变释放出巨大核能而产生的，来自太阳的辐射能量", unlocks: ["太阳能板"], researched: false },
        "能源规划":{price:{科学:900},prereq:["太阳能"],desc:"更好地规划能源设施的建造",unlocksPolicies:["能源政策"],researched:false},
        "储能技术": { price: {科学: 700}, prereq: ["金属加工"], desc: "储能是通过介质或设备将能量存储起来，并在需要时释放的技术体系，是电力系统高效运行的核心支撑", unlocks: ["电池"], researched: false },
        "原子结构模型": { price: {科学: 800}, prereq: ["储能技术"], desc: "通过α粒子散射实验建立原子核式模型", researched: false },
        "核物理": { price: {科学: 900}, prereq: ["原子结构模型"], desc: "核物理是研究原子核结构、性质及其相互作用规律的物理学分支，同时为核能、核技术及相关应用提供理论和技术基础", unlocks: ["铀矿"], researched: false },
        "核裂变": { price: {科学: 1000,铀: 20}, prereq: ["核物理"], desc: "尝试从原子核中提取能量", unlocks: ["裂变反应堆"], researched: false },
        "核裂变改进":{price:{科学:2000,铀:500},prereq:["核燃料"],desc:"确保安全的前提下提高核裂变的速度",unlocksUpgrades:["高速反应堆"],researched:false},
        "浓缩铀": { price: {科学: 1050,铀: 50}, prereq: ["核裂变"], desc: "铀矿产量+50%",
            effect: {铀矿: {prodFactor: 0.50}}, researched: false },
        "量子力学":{price:{科学:1200},prereq:["核裂变"],desc:"量子力学是现代物理学的基础，描述了微观世界的行为，涵盖了从原子到亚原子粒子的各种现象",unlocks:["粒子加速器"],researched:false},
        "碳纤维材料": { price: {科学: 1100}, prereq: ["有机化学"], desc: "解锁碳纤维厂", unlocks: ["碳纤维厂"], researched: false },
        "天体物理": { price: {科学: 1300,铀: 30}, prereq: ["核裂变"], desc: "天体物理学是研究天体物理性质、化学组成及演化规律的科学，是天文学与物理学的交叉学科", researched: false },
        "核燃料": { price: {科学: 1600,铀: 50}, prereq: ["天体物理"], desc: "解锁核燃料工厂", unlocks: ["核燃料工厂"], researched: false },
        "火箭动力学": { price: {科学: 1800,核燃料: 10}, prereq: ["核燃料"], desc: "火箭技术", researched: false },
        "探索月球": { price: {科学: 2000,核燃料: 30}, prereq: ["火箭动力学"], desc: "解锁月球基地", unlocks: ["月球基地"], researched: false },
        "宜居化改造":{price:{科学:3000},prereq:["探索月球"],desc:"提高人们对太空环境的适应能力",unlocksUpgrades:["宜居化改造"],researched:false},
        "太空剧院":{price:{科学:5000,暗能量:1},prereq:["宜居化改造"],desc:"利用暗能量来表演精彩的魔术",unlocks:["太空剧院"],researched:false},
        "基础月球采矿": { price: {科学: 2500,核燃料: 50}, prereq: ["探索月球"], desc: "解锁月球铁矿/铜矿", unlocks: ["月球铁矿","月球铜矿"], researched: false },
        "进阶月球采矿": { price: {科学: 3000,核燃料: 100}, prereq: ["基础月球采矿"], desc: "解锁月球钛矿", unlocks: ["月球钛矿"], researched: false },
        "研究月球": { price: {科学: 3500,核燃料: 150}, prereq: ["探索月球"], desc: "解锁月球研究所", unlocks: ["月球研究所"], researched: false },
        "月球工厂":{price:{科学:4000,铜:2000,铁:2000},prereq:["研究月球"],desc:"解锁提升工厂效率的月球工厂",unlocks:["月球工厂"],researched:false},
        "轨道电梯": {
            price: {科学: 8000, 碳纤维: 1000, 钛: 800},
            prereq: ["月球工厂"],
            desc: "解锁轨道电梯，提升月球生产效率",
            unlocks: ["轨道电梯"],
            researched: false
        },
        "星际航行":{
            price:{科学:15000,核燃料:10000},prereq:["月球工厂"],desc:"探索更加遥远的宇宙空间",researched:false
        },
        "星际交易":{
            price:{科学:16000,金:10000},prereq:["星际航行"],unlocks:["星际交易站"],desc:"建立星际交易站，大幅提高交易效率",researched:false
        },
        "探索气态行星":{price:{科学:18000,核燃料:20000},prereq:["星际航行"],desc:"探索一颗巨大的气态行星，也许能找到新的燃料来源",unlocks:["气态行星基地"],researched:false},
        "氚提取":{price:{科学:20000},prereq:["探索气态行星"],desc:"在气态行星上提取氚",unlocks:["氚提取站"],researched:false},
        "氚处理":{price:{科学:22000},prereq:["氚提取"],desc:"建立氚工厂生成核燃料",unlocks:["氚燃料厂"],researched:false},
        "可控核聚变":{price:{科学:25000},prereq:["氚处理"],desc:"建立聚变反应堆来生产电力",unlocks:["聚变反应堆"],researched:false},
        "聚变规模化":{price:{科学:40000},prereq:["可控核聚变"],desc:"扩大聚变反应堆的规模",unlocksUpgrades:["聚变规模化"],researched:false},
        "戴森球计划":{price:{科学:100000},prereq:["月球工厂"],desc:"使用一个巨大的球体来提取恒星的能量，需要大量资源",unlocks:["戴森球"],researched:false},
        "暗物质探测":{price:{科学:6000},prereq:["研究月球"],desc:"在太空中探测暗物质的踪迹，它真的存在吗?",researched:false},
        "暗物质利用":{price:{科学:10000},prereq:["暗物质探测"],desc:"我们也许可以从暗物质中提取能量，但是代价是什么?",unlocks:["暗物质研究所"],researched:false},
        "真空衰变":{price:{科学:20000},prereq:["暗物质利用"],desc:"科学家警告利用暗物质能量可能造成灾难性的结果，我们应该放弃吗?",researched:false},
        "曼哈顿计划": { price: {科学: 1500,铀: 100}, prereq: ["核裂变"], desc: "解锁核弹", researched: false },
        "探索遗迹": { price: {科学: 500,遗物: 1}, prereq: ["矿物学"], desc: "研究奇怪的遗物，解锁博物馆", unlocks: ["博物馆"], researched: false },
        "奇怪的石头":{price:{科学:500,石头: 1000},prereq:["采石技术"],desc:"人们在采集石头时发现一块奇怪的大石头，它表面十分光滑，还刻有神秘符号,没有人知道这是什么意思",researched:false},
        "既视感":{price:{科学:5000},prereq:["奇怪的石头"],desc:"考古人员在研究这个奇怪的石头时感觉似曾相识。石头吸引来很多人的兴趣，他们都有类似的感觉:他们曾经见过这块石头",researched:false},
        "石头的低语":{price:{科学:40000,暗能量:1},prereq:["既视感"],desc:"科学家发现这个奇怪的石头似乎能够影响暗物质的分布。暗物质研究所产量增加50%",
            effect:{暗物质研究所:{prodFactor:0.50}},researched:false},
        "尝试破解石头":{price:{科学:400000},prereq:["石头的低语"],desc:"使用超级量子计算机破译石头上的文字",researched:false}
    };

    // ==================== 升级定义 ====================
    GameState.upgrades = {
        "伐木场优化": { basePrice: {木头:1500,科学:300}, price: {木头:1500,科学:300}, growth: 1.05,
            effect: {伐木场: 0.03}, level: 0, visible: false, desc: "伐木场效率+3%/级" },
        "采石场优化": { basePrice: {石头:1500,科学:300}, price: {石头:1500,科学:300}, growth: 1.05,
            effect: {采石场: 0.03}, level: 0, visible: false, desc: "采石场效率+3%/级" },
        "储存优化": { basePrice: {建材:50,科学:600}, price: {建材:50,科学:600}, growth: 1.05,
            effect: {仓库:0.01,集装箱:0.01,大型仓库:0.01}, level: 0, visible: false,
            desc: "仓库/集装箱/大型仓库效率+1%/级" },
        "工厂优化": { basePrice: {金属板:50,科学:600}, price: {金属板:50,科学:600}, growth: 1.05,
            effect: {建材工厂:0.02,金属加工厂:0.02,塑料厂:0.02}, level: 0, visible: false,
            desc: "建材/金属加工/塑料厂效率+2%/级" },
        "高速反应堆":{basePrice:{核燃料:50,科学:1500},price:{核燃料:50,科学:1500},growth:1.05,
            effect:{裂变反应堆:0.01},level:0,visible:false,
            desc: "裂变反应堆效率+1%/级"},
        "聚变规模化":{basePrice:{氚:2000,科学:20000},price:{氚:2000,科学:20000},growth:1.05,
            effect:{聚变反应堆:0.01},level:0,visible:false,
            desc:"聚变反应堆效率+1%/级"},
        "宜居化改造":{basePrice:{钛:500,科学:3000},price:{钛:500,科学:3000},growth:1.05,
            effect:{月球基地:0.01},level:0,visible:false,
            desc:"月球基地效率+1%/级"}
    };

    // ==================== 政策定义 ====================
    GameState.policies = {
        "基础资源政策": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视林业": { price: 20, prodFactor: {伐木场: 0.80,采石场: -0.5} },
                "重视矿业": { price: 20, prodFactor: {采石场: 0.80,伐木场: -0.5}}
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
                "科学至上": { price: 60, prodFactor: {图书馆:1.0, 大学:1.0, 金矿:-0.30},
                            capFactor: {图书馆:0.05, 大学:0.05} },
                "金钱至上": { price: 60, prodFactor: {图书馆:-0.80, 大学:-0.80, 金矿:0.30} }
            }
        },
        "能源政策": {
            activePolicy: "默认", visible: false,
            options: {
                "默认": { price: 0, prodFactor: {}, consFactor: {}, capFactor: {} },
                "重视清洁能源": { price: 200, prodFactor: {太阳能板:1.0, 裂变反应堆:0.2, 聚变反应堆:0.1,石油发电厂:-0.6,蒸汽机:-0.6}, },
                "发展传统能源": { price: 200, prodFactor: {石油发电厂:0.30, 蒸汽机:0.30, 太阳能板:-0.80} }
            }
        }
    };

    // ==================== 永恒升级 ====================
    GameState.permanent = {
        "节约成本I": { price: {遗物: 10}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: null },
        "节约成本II": { price: {遗物: 30}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本I"] },
        "节约成本III": { price: {遗物: 100}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本II"] },
        "节约成本IV": { price: {遗物: 200}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本III"] },
        "节约成本V": { price: {遗物: 500}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本IV"] },
        "节约成本VI": { price: {遗物: 1000,暗能量:10}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本V"] },
        "节约成本VII": { price: {遗物: 1500,暗能量:20}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VI"] },
        "节约成本VIII": { price: {遗物: 2000,暗能量:40}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VII"] },
        "节约成本IX": { price: {遗物: 2500,暗能量:80}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本VIII"] },
        "节约成本X": { price: {遗物: 3000,暗能量:160}, researched: false, desc: "所有建筑成本增长率-5%（乘算）", effect: { costRatio: 0.95 }, prereq: ["节约成本IX"] },
        "高效生产I": { price: {遗物: 1}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: null },
        "高效生产II": { price: {遗物: 5}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产I"] },
        "高效生产III": { price: {遗物: 10}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产II"] },
        "高效生产IV": { price: {遗物: 20}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产III"] },
        "高效生产V": { price: {遗物: 30}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IV"] },
        "高效生产VI": { price: {遗物: 40}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产V"] },
        "高效生产VII": { price: {遗物: 50}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VI"] },
        "高效生产VIII": { price: {遗物: 60}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VII"] },
        "高效生产IX": { price: {遗物: 80}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产VIII"] },
        "高效生产X": { price: {遗物: 100}, researched: false, desc: "所有建筑产量+5%（消耗不变）", effect: { globalProd: 0.05 }, prereq: ["高效生产IX"] },
        "高速生产I": { price: {遗物: 10}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: null },
        "高速生产II": { price: {遗物: 20}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产I"] },
        "高速生产III": { price: {遗物: 40}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产II"] },
        "高速生产IV": { price: {遗物: 80}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产III"] },
        "高速生产V": { price: {遗物: 160}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产IV"] },
        "高速生产VI": { price: {遗物: 240}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产V"] },
        "高速生产VII": { price: {遗物: 360}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VI"] },
        "高速生产VIII": { price: {遗物: 480}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VII"] },
        "高速生产IX": { price: {遗物: 600}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产VIII"] },
        "高速生产X": { price: {遗物: 800}, researched: false, desc: "所有建筑速度+10%（消耗同步增加）", effect: { globalSpeed: 0.10 }, prereq: ["高速生产IX"] },
        "空间压缩I": { price: {遗物: 5}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: null },
        "空间压缩II": { price: {遗物: 20}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩I"] },
        "空间压缩III": { price: {遗物: 100}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩II"] },
        "空间压缩IV": { price: {遗物: 200}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩III"] },
        "空间压缩V": { price: {遗物: 400}, researched: false, desc: "每持有遗物提升储存建筑上限0.1%（科学除外）", effect: { capPerRelic: 0.001 }, prereq: ["空间压缩IV"] },
        "技术爆炸": { price: {遗物: 50}, researched: false, desc: "根据遗物数量提升少量科学上限", effect: { sciCapPerRelicLog: 0.05 }, prereq: null },
        "宇宙学": { price: {遗物: 50,暗能量:1}, researched: false, desc: "研究宇宙的奥秘，提高太空建筑产量10%(消耗不变)", effect: {globalSpaceProd:0.10}, prereq: null },
        "宇宙起源": { price: {遗物: 500,暗能量:100}, researched: false, desc: "研究宇宙起源的学科，提高太空建筑产量20%(消耗不变)", effect: {globalSpaceProd:0.20}, prereq: null },
        
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
    GameState.gameDays = 0;               // 总天数（0年1日 = 0）
    GameState.activeRandomEvent = null;
    GameState.activeEventEndDay = 0;
    GameState.eventLogs = [];              // 日志数组，每项 { dateStr, text }

}
// 随机事件定义
const RANDOM_EVENTS = [
    { id: "meteor_shower", name: "流星雨", desc: "流星雨激发了研究灵感", effects: { 科学: 2.0 }, durationDays: 365 },
    { id: "iron_discovery", name: "发现铁矿", desc: "大型铁矿脉被发现了", effects: { 铁: 3.0 }, durationDays: 365 },
    { id: "copper_discovery", name: "发现铜矿", desc: "富铜矿脉带来惊喜", effects: { 铜: 3.0 }, durationDays: 365 },
    { id: "gold_rush", name: "淘金热", desc: "人们狂热地寻找黄金", effects: { 金: 2.5 }, durationDays: 365 },
    { id: "solar_flare", name: "太阳耀斑", desc: "太阳活动增强，电力产量下降", effects: { 电力: 0.6 }, durationDays: 365 },
    { id: "oil_discovery",name:"发现油田",desc:"发现了一片巨大油田",effects:{石油:3.0},durationDays:365}
];
const ChangelogData = {
    version: "v0.1",
    logs: [
        { version: "v0.1", date: "2026-04-18", changes: [
            "游戏初始版本发布",
            "包含建筑、科技、升级、政策、贸易、永恒系统",
        ]}
    ]
};