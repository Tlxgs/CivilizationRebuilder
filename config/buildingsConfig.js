BUILDINGS_CONFIG= {
        "伐木场": {
            type: "生产",
            basePrice: {木头: 10},costGrowth: 1.15,
            produces: {木头: 0.4}, 
            desc: "生产木材"
        },
        "采石场": {
            type: "生产",
            basePrice: {木头: 5,石头: 5}, costGrowth: 1.15,
            produces: {石头: 0.4},
            desc: "开采石头"
        },
        "仓库": {
            type: "存储",
            basePrice: {木头: 50,石头: 50}, costGrowth: 1.08,
            produces: {}, consumes: {}, caps: {木头: 50,石头: 50},
            desc: "提高木头和石头的储存上限"
        },
        "集装箱": {
            type: "存储",
            basePrice: {铁: 40,铜: 20}, costGrowth: 1.2,
            produces: {}, consumes: {},
            caps: {木头:500,石头:500,煤:200,铜:200,铁:200,钢:200,铝:200},
            desc: "储存更多资源"
        },
        "大型仓库": {
            type: "存储",
            basePrice: {金属板: 40,钢: 40}, costGrowth: 1.1,
            produces: {}, consumes: {电力: 0.1},
            caps: {木头:3000,石头:3000,煤:500,铜:500,铁:500,钢:200,铝:200,金:200,建材:200,塑料:200,金属板:200},
            desc: "消耗电力，大幅提升多种资源上限"
        },
        "煤矿": {
            type: "生产",
            basePrice: {石头: 100}, price: {石头: 100}, costGrowth: 1.20,
            produces: {煤: 0.2},
            desc: "生产少量煤"
        },
        "大型煤矿": {
            type: "生产", 
            basePrice: {建材: 20,木头: 200}, price: {建材: 20,木头: 200}, costGrowth: 1.15,
            consumes: {电力: 0.2}, 
            caps: {煤:100},
            desc: "提供煤储存，同时使煤矿产量+10%",
            modifiers: [
                { target: "煤矿", prodFactor: 0.10 } 
            ]
        },
        "工具加工站":{
            type: "生产", 
            basePrice: {铁: 500,石头: 500}, price: {铁: 500,石头: 500}, costGrowth: 1.15,
            consumes: {电力: 0.15}, 
            desc: "制造工具来提高伐木场和采石场产量",
            modifiers: [
                { target: "伐木场", prodFactor: 0.02 }, 
                { target: "采石场", prodFactor: 0.02 } 
            ]
        },
        "金矿": {
            type: "生产",
            basePrice: {铁: 80,木头: 500},  costGrowth: 1.20,
            produces: {金: 0.1},
            desc: "生产少量金"
        },
        "铜冶炼厂": {
            type: "工厂",
            happiness:-0.1,
            basePrice: {石头: 50}, costGrowth: 1.1,
            produces: {铜: 0.1}, consumes: {煤: 0.2, 石头: 0.5}, caps: {},
            desc: "消耗煤和石头，生产铜"
        },
        "铁冶炼厂": {
            type: "工厂",
            happiness:-0.1,
            basePrice: {石头: 30,铜: 5}, costGrowth: 1.1,
            produces: {铁: 0.1}, consumes: {煤: 0.4, 石头: 0.5}, caps: {},
            desc: "消耗煤和石头，生产铁"
        },
        "行政机关": {
            type: "其他",
            happiness:0.5,
            basePrice: {木头: 100,铁: 30},costGrowth: 2.0,
            produces: {政策点: 0.1}, consumes: {科学: 0.4}, caps: {政策点: 50},
            desc: "消耗科学，生产政策点"
        },
        "图书馆": {
            type: "科学",
            basePrice: {木头: 20},costGrowth: 1.2,
            produces: {科学: 0.15}, caps: {科学: 10},
            desc: "生产科学，增加科学上限"
        },
        "大学": {
            type: "科学",
            basePrice: {铜: 30,铁: 30}, costGrowth: 1.2,
            produces: {科学: 0.2}, consumes: {电力: 0.15}, caps: {科学: 40},
            desc: "消耗电力，生产科学"
        },
        "博物馆": {
            type: "科学",
            basePrice: {石头: 300, 铜: 100},
            costGrowth: 1.2,
            produces: {科学: 0.2, 金: 0.1},
            consumes: {},
            caps: {科学: 50},
            happiness: (state) => {
                const relic = state.resources["遗物"]?.amount || 0;
                return 0.1 * Math.log(Math.pow(Math.E, 5) + relic);
            },
            desc: "研究遗物，生产科学和金。幸福度取决于遗物数量。"
        },
        "科学院": {
            type: "科学", 
            basePrice: {塑料: 30,金属板: 30},  costGrowth: 1.15,
            consumes: {电力: 0.2}, 
            desc: "提供先进理论，使大学科学产出和上限+5%",
            modifiers: [
                { target: "大学", prodFactor: 0.05, capFactor: 0.05 } 
            ]
        },
        "暗物质研究所":{
            type:"太空",
            basePrice:{钛:5000,碳纤维:500,科学:500},costGrowth:1.10,
            produces:{电力:0.2,科学:0.2},
            consumes:{太空宜居度:0.1},
            desc:"从暗物质中提取永不枯竭的能量！这似乎是永动机？",
        },
        "蒸汽机": {
            type: "电力",
            basePrice: {石头: 100,铁: 20}, costGrowth: 1.12,
            produces: {电力: 0.4}, consumes: {煤: 0.25}, caps: {},
            desc: "消耗煤，产生电力"
        },
        "建材工厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {铁: 50,木头: 200},costGrowth: 1.10,
            produces: {建材: 0.2}, consumes: {木头: 5, 石头: 2, 铁: 0.2, 电力: 0.2},
            caps: {建材: 50},
            desc: "生产建材"
        },
        "炼钢厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {建材: 30,铜: 100}, costGrowth: 1.15,
            produces: {钢: 0.1}, consumes: {煤: 0.2, 铁: 0.4}, caps: {钢: 50},
            desc: "将铁冶炼成钢"
        },
        "电解铝厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {建材: 30,钢: 40}, costGrowth: 1.15,
            produces: {铝: 0.1}, consumes: {电力: 0.5, 石头: 0.8}, caps: {铝: 50},
            desc: "生产铝"
        },
        "金属加工厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {建材: 50,铁: 100},costGrowth: 1.10,
            produces: {金属板: 0.1}, consumes: {电力: 0.2, 铜: 0.8, 铝: 0.3},
            caps: {金属板: 50},
            desc: "生产金属板"
        },
        "塑料厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {金属板: 30,建材: 30}, costGrowth: 1.10,
            produces: {塑料: 0.2}, consumes: {电力: 0.2, 石油: 0.6}, caps: {塑料: 50},
            desc: "生产塑料"
        },
        "碳纤维厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {金属板: 200,塑料: 100},costGrowth: 1.08,
            produces: {碳纤维: 0.2}, consumes: {电力: 0.6, 煤: 0.2}, caps: {碳纤维: 50},
            desc: "生产碳纤维"
        },
        "核燃料工厂": {
            type: "工厂",
            happiness:-0.2,
            basePrice: {金属板: 150,铁: 400},  costGrowth: 1.08,
            produces: {核燃料: 0.2}, consumes: {电力: 1, 铀: 0.2}, caps: {核燃料: 50},
            desc: "生产核燃料"
        },
        "市场": {
            type: "其他",
            basePrice: {建材: 20,金: 20},  costGrowth: 1.05,caps:{金:100},
            desc: "提升单次交易数量。这不仅意味着你可以点击较少次，更意味着你可以在物品涨价到你无法承受之前买更多！"
        },
        "油田": {
            type: "生产",
            basePrice: {金属板: 10,钢: 30},costGrowth: 1.10,
            produces: {石油: 0.4}, consumes: {电力: 0.4}, caps: {石油: 20},
            desc: "开采石油"
        },
        "石油发电厂": {
            type: "电力",
            basePrice:{建材:50,钢:50}, price:{建材:50,钢:50}, costGrowth:1.2,
            produces:{电力:0.5}, consumes:{石油:0.2}, caps:{},
            count:0, active:0, visible:false, desc:"使用石油发电"
        },
        "太阳能板": {
            type: "电力",
            basePrice: {塑料: 30, 铜: 200},
            costGrowth: 1.04,
            produces: (state) => {
                const dayOfYear = state.gameDays % 360;
                let base = 0.2;
                if (dayOfYear >= 90 && dayOfYear < 180) base = 0.4;   // 夏
                else if (dayOfYear >= 270) base = 0.1;              // 冬
                return {电力: base};
            },
            consumes: {},
            caps: {},
            happiness: 0,
            desc: "清洁电力，夏天产量翻倍，冬天减半"
        },
        "电池": {
            type: "电力",
            basePrice: {铜: 300,铁: 300}, price: {铜: 300,铁: 300}, costGrowth: 1.2,
            caps: {电力: 200},
            desc: "储存电力"
        },
        "铀矿": {
            type: "生产",
            basePrice: {铁: 300,建材: 150}, price: {铁: 300,建材: 150}, costGrowth: 1.1,
            produces: {铀: 0.2}, caps: {铀: 50},
            desc: "开采铀"
        },
        "裂变反应堆": {
            type: "电力",
            basePrice: {金属板: 100,铀: 30}, price: {金属板: 100,铀: 30}, costGrowth: 1.15,
            produces: {电力: 1.0}, consumes: {核燃料: 0.04}, caps: {铀: 50},
            desc: "核能发电"
        },
        "粒子加速器": {
            type: "科学",
            basePrice:{金属板:500,建材:500,科学:500}, costGrowth:1.06,
            produces:{科学:0.3}, consumes:{电力:0.5}, caps:{},
            desc:"产出科学，同时每个粒子加速器（无论是否激活）增加2%遗物获取。"
        },
        "轨道电梯": {
            type: "太空",
            basePrice: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            price: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            costGrowth: 1.08,
            consumes: {电力: 0.4},
            desc: "提升月球建筑产量",
            modifiers: [
                { target: "月球铁矿", prodFactor: 0.02 },
                { target: "月球铜矿", prodFactor: 0.02 },
                { target: "月球钛矿", prodFactor: 0.02 }
            ]
        },
        "月球基地": {
            type: "太空",
            basePrice: {金属板: 50,碳纤维: 100},costGrowth: 1.06,
            produces: {太空宜居度: 0.4}, consumes: {电力: 0.6},
            caps: {铀:200,钛:200,碳纤维:200,核燃料:50,太空宜居度:50},
            desc: "月球殖民"
        },
        "气态行星基地": {
            type: "太空",
            basePrice: {钛: 10000,塑料: 5000},costGrowth: 1.10,
            produces: {太空宜居度: 0.2}, consumes: {电力: 0.6},
            caps: {氚:200,核燃料:200,太空宜居度:50},
            modifiers: [
                { target: "氚提取站", prodFactor: 0.02},
                {target:"氚燃料厂",prodFactor:0.02} ,

            ],
            desc: "这里环境远比月球恶劣，宜居度很差"
        },
        "月球铁矿": {
            type: "太空",
            basePrice: {钢: 50,碳纤维: 150}, costGrowth: 1.10,
            produces: {铁: 0.8}, consumes: {电力: 0.4, 太空宜居度: 0.4}, caps: {},
            desc: "月球铁矿"
        },
        "月球铜矿": {
            type: "太空",
            basePrice: {铝: 50,碳纤维: 150},costGrowth: 1.10,
            produces: {铜: 0.8}, consumes: {电力: 0.4, 太空宜居度: 0.4}, caps: {},
            desc: "月球铜矿"
        },
        "月球钛矿": {
            type: "太空",
            basePrice: {金属板: 100,碳纤维: 250},costGrowth: 1.12,
            produces: {钛: 0.3}, consumes: {电力: 0.5, 太空宜居度: 0.4}, caps: {钛: 50},
            desc: "月球钛矿"
        },
        "月球研究所": {
            type: "太空",
            basePrice: {钛: 250,钢: 400},costGrowth: 1.12,
            produces: {科学: 0.1}, consumes: {电力: 0.5, 太空宜居度: 0.3},
            caps: {科学: 100},
            desc: "月球科研建筑"
        },
        "月球工厂": {
            type: "太空", 
            basePrice: {钛: 300,碳纤维: 300},costGrowth: 1.15,
            consumes: {电力: 0.3,太空宜居度:0.2}, 
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
            basePrice: {建材: 20000,金属板: 10000}, costGrowth: 1.15,
            produces: {氚: 0.2}, consumes: {电力: 0.6, 太空宜居度: 0.5},
            caps: {氚: 100},
            desc: "从气态行星上提取氚"
        },
        "氚燃料厂": {
            type: "太空",
            basePrice: {钛: 10000,碳纤维: 20000}, 
            costGrowth: 1.12,
            produces: {核燃料: 0.4}, 
            consumes: {氚: 0.1, 电力: 0.3, 太空宜居度: 0.8},
            caps: {核燃料: 100},
            desc: "将氚加工成核燃料，用于更高效的聚变反应"
        },
        "聚变反应堆": {
            type: "电力",
            basePrice: {金属板: 10000,碳纤维: 5000,核燃料: 1000}, 
            costGrowth: 1.05,
            produces: {电力: 1.5}, 
            consumes: {核燃料: 0.30},
            desc: "通过核聚变产生大量清洁能源，是未来文明的基石"
        },

        "太空剧院": {
            type: "太空",
            basePrice: {金属板: 500, 塑料: 500},
            costGrowth: 1.20,
            produces: {},
            consumes: {电力: 0.2, 科学: 2},
            caps: {},
            happiness: (state) => {
                const darkEnergy = state.resources["暗能量"]?.amount || 0;
                return 0.2 * Math.log(Math.pow(2.718, 5) + darkEnergy);
            },
            desc: "使用暗能量表演魔术，提高幸福度。幸福度取决于暗能量数量。"
        },
        "戴森球":{
            type: "太空",
            basePrice: {钛: 500000,金属板: 500000},costGrowth: 1.2,
            produces: {电力:1.5}, 
            desc: "围绕太阳建造一个巨大的戴森球"
        },
        "星际交易站":{
            type: "太空",
            basePrice: {钢: 50000,金: 5000},  costGrowth: 1.1,
            consumes: {电力:0.1}, caps: {金:1000},
            desc: "交易效率远远高于市场"
        },
        "军营": {
            type: "军事",
            basePrice: {铁: 1000, 铜: 800},  costGrowth: 1.3,
            produces: {军备: 0.2}, consumes: {铁: 0.5, 铜: 0.3,政策点:0.1}, caps: {军备:10},
            desc: "训练士兵，生产军备。消耗金属和政策点。"
        },
        "军工厂": {
            type: "军事",
            basePrice: {金属板: 1000, 钢: 800}, costGrowth: 1.3,
            consumes: {钢:0.2,电力:0.2}, caps: {},
            modifiers: [
                {target: "军营",prodFactor: 0.05 },
                {target:"军营",capFactor:0.05} ,
            ],
            desc: "提高军营效率。"
        }
    };