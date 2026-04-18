BUILDINGS_CONFIG= {
        "伐木场": {
            type: "生产",
            basePrice: {木头: 10},costGrowth: 1.15,
            baseProduce: {木头: 0.2}, 
            desc: "生产木材"
        },
        "采石场": {
            type: "生产",
            basePrice: {木头: 5,石头: 5}, costGrowth: 1.15,
            baseProduce: {石头: 0.2},
            desc: "开采石头"
        },
        "仓库": {
            type: "存储",
            basePrice: {木头: 50,石头: 50}, costGrowth: 1.08,
            baseProduce: {}, baseConsume: {}, capProvide: {木头: 50,石头: 50},
            desc: "提高木头和石头的储存上限"
        },
        "集装箱": {
            type: "存储",
            basePrice: {铁: 40,铜: 20}, costGrowth: 1.2,
            baseProduce: {}, baseConsume: {},
            capProvide: {木头:500,石头:500,煤:200,铜:200,铁:200,钢:200,铝:200},
            desc: "储存更多资源"
        },
        "大型仓库": {
            type: "存储",
            basePrice: {金属板: 40,钢: 40}, costGrowth: 1.1,
            baseProduce: {}, baseConsume: {电力: 0.05},
            capProvide: {木头:3000,石头:3000,煤:500,铜:500,铁:500,钢:200,铝:200,金:200,建材:200,塑料:200,金属板:200},
            desc: "消耗电力，大幅提升多种资源上限"
        },
        "煤矿": {
            type: "生产",
            basePrice: {石头: 100}, price: {石头: 100}, costGrowth: 1.20,
            baseProduce: {煤: 0.1},
            desc: "生产少量煤"
        },
        "大型煤矿": {
            type: "生产", 
            basePrice: {建材: 20,木头: 200}, price: {建材: 20,木头: 200}, costGrowth: 1.15,
            baseConsume: {电力: 0.15}, 
            capProvide: {煤:100},
            desc: "提供煤储存，同时使煤矿产量+10%",
            modifiers: [
                { target: "煤矿", prodFactor: 0.10 } 
            ]
        },
        "工具加工站":{
            type: "生产", 
            basePrice: {铁: 500,石头: 500}, price: {铁: 500,石头: 500}, costGrowth: 1.15,
            baseConsume: {电力: 0.10}, 
            desc: "制造工具来提高伐木场和采石场产量",
            modifiers: [
                { target: "伐木场", prodFactor: 0.02 }, 
                { target: "采石场", prodFactor: 0.02 } 
            ]
        },
        "金矿": {
            type: "生产",
            basePrice: {铁: 80,木头: 500},  costGrowth: 1.20,
            baseProduce: {金: 0.05},
            desc: "生产少量金"
        },
        "铜冶炼厂": {
            type: "工厂",
            happinessEffect:-0.1,
            basePrice: {石头: 50}, costGrowth: 1.1,
            baseProduce: {铜: 0.05}, baseConsume: {煤: 0.1, 石头: 0.5}, capProvide: {},
            desc: "消耗煤和石头，生产铜"
        },
        "铁冶炼厂": {
            type: "工厂",
            happinessEffect:-0.1,
            basePrice: {石头: 30,铜: 5}, costGrowth: 1.1,
            baseProduce: {铁: 0.05}, baseConsume: {煤: 0.2, 石头: 0.5}, capProvide: {},
            desc: "消耗煤和石头，生产铁"
        },
        "行政机关": {
            type: "其他",
            happinessEffect:0.5,
            basePrice: {木头: 100,铁: 30},costGrowth: 2.0,
            baseProduce: {政策点: 0.05}, baseConsume: {科学: 0.2}, capProvide: {政策点: 50},
            desc: "消耗科学，生产政策点"
        },
        "图书馆": {
            type: "科学",
            basePrice: {木头: 20},costGrowth: 1.2,
            baseProduce: {科学: 0.15}, capProvide: {科学: 10},
            desc: "生产科学，增加科学上限"
        },
        "大学": {
            type: "科学",
            basePrice: {铜: 30,铁: 30}, costGrowth: 1.2,
            baseProduce: {科学: 0.2}, baseConsume: {电力: 0.1}, capProvide: {科学: 40},
            desc: "消耗电力，生产科学"
        },
        "博物馆": {
            type: "科学",
            happinessEffect:0.5,
            basePrice: {石头: 300,铜: 100}, costGrowth: 1.2,
            baseProduce: {科学: 0.2, 金: 0.1}, capProvide: {科学: 50},
            desc: "研究遗物，生产科学和金。提供的幸福度加成取决于你当前拥有的遗物数量。",
            calc: function(state, buildingId, building, cfg, modData, happinessFactor, eventMultipliers) {
                const defaultEffects = ProductionEngine.defaultCalc(state, buildingId, building, cfg, modData, happinessFactor, eventMultipliers);
                const relic = state.resources["遗物"]?.amount || 0;
                const perMuseumBonus = 0.1 * Math.log(Math.pow(2.72, 5) + relic);
                const happiness = perMuseumBonus * building.active;
                return {
                    production: defaultEffects.production,
                    consumption: defaultEffects.consumption,
                    cap: defaultEffects.cap,
                    happiness: happiness
                };
            }
        },
        "科学院": {
            type: "科学", 
            basePrice: {塑料: 30,金属板: 30},  costGrowth: 1.15,
            baseConsume: {电力: 0.15}, 
            desc: "提供先进理论，使大学科学产出和上限+5%",
            modifiers: [
                { target: "大学", prodFactor: 0.05, capFactor: 0.05 } 
            ]
        },
        "暗物质研究所":{
            type:"太空",
            basePrice:{钛:5000,碳纤维:500,科学:500},costGrowth:1.10,
            baseProduce:{电力:0.1,科学:0.1},
            baseConsume:{太空宜居度:0.05},
            desc:"从暗物质中提取永不枯竭的能量！这似乎是永动机？",
        },
        "蒸汽机": {
            type: "电力",
            basePrice: {石头: 100,铁: 20}, costGrowth: 1.12,
            baseProduce: {电力: 0.2}, baseConsume: {煤: 0.2}, capProvide: {},
            desc: "消耗煤，产生电力"
        },
        "建材工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {铁: 50,木头: 200},costGrowth: 1.10,
            baseProduce: {建材: 0.1}, baseConsume: {木头: 5, 石头: 2, 铁: 0.1, 电力: 0.1},
            capProvide: {建材: 50},
            desc: "生产建材"
        },
        "炼钢厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 30,铜: 100}, costGrowth: 1.15,
            baseProduce: {钢: 0.05}, baseConsume: {煤: 0.1, 铁: 0.3}, capProvide: {钢: 50},
            desc: "将铁冶炼成钢"
        },
        "电解铝厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 30,钢: 40}, costGrowth: 1.15,
            baseProduce: {铝: 0.05}, baseConsume: {电力: 0.25, 石头: 0.5}, capProvide: {铝: 50},
            desc: "生产铝"
        },
        "金属加工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {建材: 50,铁: 100},costGrowth: 1.10,
            baseProduce: {金属板: 0.05}, baseConsume: {电力: 0.1, 铜: 0.5, 铝: 0.2},
            capProvide: {金属板: 50},
            desc: "生产金属板"
        },
        "塑料厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 30,建材: 30}, costGrowth: 1.10,
            baseProduce: {塑料: 0.1}, baseConsume: {电力: 0.1, 石油: 0.3}, capProvide: {塑料: 50},
            desc: "生产塑料"
        },
        "碳纤维厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 200,塑料: 100},costGrowth: 1.08,
            baseProduce: {碳纤维: 0.1}, baseConsume: {电力: 0.3, 煤: 0.1}, capProvide: {碳纤维: 50},
            desc: "生产碳纤维"
        },
        "核燃料工厂": {
            type: "工厂",
            happinessEffect:-0.2,
            basePrice: {金属板: 150,铁: 400},  costGrowth: 1.08,
            baseProduce: {核燃料: 0.1}, baseConsume: {电力: 0.5, 铀: 0.1}, capProvide: {核燃料: 50},
            desc: "生产核燃料"
        },
        "市场": {
            type: "其他",
            basePrice: {建材: 20,金: 20},  costGrowth: 1.05,
            desc: "提升单次交易数量。这不仅意味着你可以点击较少次，更意味着你可以在物品涨价到你无法承受之前买更多！"
        },
        "油田": {
            type: "生产",
            basePrice: {金属板: 10,钢: 30},costGrowth: 1.10,
            baseProduce: {石油: 0.2}, baseConsume: {电力: 0.2}, capProvide: {石油: 20},
            desc: "开采石油"
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
            baseProduce: {电力: 0.1},
            desc: "清洁电力,夏天产量翻倍，冬天产量减半",
            calc: function(state, buildingId, building, cfg, modData, happinessFactor, eventMultipliers) {
                const prodMult = ModifierSystem.calcProdMultiplier(modData, buildingId, cfg.type);
                const active = building.active;
                // 获取季节
                const dayOfYear = state.gameDays % 360;
                let basePower = 0.1;  // 春季基础
                if (dayOfYear < 90) {
                    // 春季 (0-89)
                    basePower = 0.1;
                } else if (dayOfYear < 180) {
                    // 夏季 (90-179)
                    basePower = 0.2;   // 产量翻倍
                } else if (dayOfYear < 270) {
                    // 秋季 (180-269)
                    basePower = 0.1;
                } else {
                    // 冬季 (270-359)
                    basePower = 0.05;  // 产量减半
                }
                const production = {
                    电力: basePower * active * prodMult * happinessFactor
                };
                return { production, consumption: {}, cap: {} };
            }
        },
        "电池": {
            type: "电力",
            basePrice: {铜: 300,铁: 300}, price: {铜: 300,铁: 300}, costGrowth: 1.2,
            capProvide: {电力: 200},
            desc: "储存电力"
        },
        "铀矿": {
            type: "生产",
            basePrice: {铁: 300,建材: 150}, price: {铁: 300,建材: 150}, costGrowth: 1.1,
            baseProduce: {铀: 0.1}, capProvide: {铀: 50},
            desc: "开采铀"
        },
        "裂变反应堆": {
            type: "电力",
            basePrice: {金属板: 100,铀: 30}, price: {金属板: 100,铀: 30}, costGrowth: 1.15,
            baseProduce: {电力: 0.5}, baseConsume: {核燃料: 0.02}, capProvide: {铀: 50},
            desc: "核能发电"
        },
        "粒子加速器": {
            type: "科学",
            basePrice:{金属板:500,建材:500,科学:500}, costGrowth:1.06,
            baseProduce:{科学:0.3}, baseConsume:{电力:0.3}, capProvide:{},
            desc:"产出科学，同时每个粒子加速器（无论是否激活）增加2%遗物获取。"
        },
        "轨道电梯": {
            type: "太空",
            basePrice: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            price: {碳纤维: 5000, 钛: 3000, 金属板: 8000},
            costGrowth: 1.08,
            baseConsume: {电力: 0.2},
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
            baseProduce: {太空宜居度: 0.2}, baseConsume: {电力: 0.3},
            capProvide: {铀:200,钛:200,碳纤维:200,核燃料:50,太空宜居度:50},
            desc: "月球殖民"
        },
        "气态行星基地": {
            type: "太空",
            basePrice: {钛: 10000,塑料: 5000},costGrowth: 1.10,
            baseProduce: {太空宜居度: 0.1}, baseConsume: {电力: 0.3},
            capProvide: {氚:200,核燃料:200,太空宜居度:50},
            modifiers: [
                { target: "氚提取站", prodFactor: 0.02},
                {target:"氚燃料厂",prodFactor:0.02} ,

            ],
            desc: "这里环境远比月球恶劣，宜居度很差"
        },
        "月球铁矿": {
            type: "太空",
            basePrice: {钢: 50,碳纤维: 150}, costGrowth: 1.10,
            baseProduce: {铁: 0.3}, baseConsume: {电力: 0.2, 太空宜居度: 0.2}, capProvide: {},
            desc: "月球铁矿"
        },
        "月球铜矿": {
            type: "太空",
            basePrice: {铝: 50,碳纤维: 150},costGrowth: 1.10,
            baseProduce: {铜: 0.3}, baseConsume: {电力: 0.2, 太空宜居度: 0.2}, capProvide: {},
            desc: "月球铜矿"
        },
        "月球钛矿": {
            type: "太空",
            basePrice: {金属板: 100,碳纤维: 250},costGrowth: 1.12,
            baseProduce: {钛: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.2}, capProvide: {钛: 50},
            desc: "月球钛矿"
        },
        "月球研究所": {
            type: "太空",
            basePrice: {钛: 250,钢: 400},costGrowth: 1.12,
            baseProduce: {科学: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.2},
            capProvide: {科学: 100},
            desc: "月球科研建筑"
        },
        "月球工厂": {
            type: "太空", 
            basePrice: {钛: 300,碳纤维: 300},costGrowth: 1.15,
            baseConsume: {电力: 0.15,太空宜居度:0.1}, 
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
            baseProduce: {氚: 0.1}, baseConsume: {电力: 0.4, 太空宜居度: 0.3},
            capProvide: {氚: 100},
            desc: "从气态行星上提取氚"
        },
        "氚燃料厂": {
            type: "太空",
            basePrice: {钛: 10000,碳纤维: 20000}, 
            costGrowth: 1.12,
            baseProduce: {核燃料: 0.2}, 
            baseConsume: {氚: 0.05, 电力: 0.2, 太空宜居度: 0.5},
            capProvide: {核燃料: 100},
            desc: "将氚加工成核燃料，用于更高效的聚变反应"
        },
        "聚变反应堆": {
            type: "电力",
            basePrice: {金属板: 10000,碳纤维: 5000,核燃料: 1000}, 
            costGrowth: 1.05,
            baseProduce: {电力: 1.0}, 
            baseConsume: {核燃料: 0.20},
            desc: "通过核聚变产生大量清洁能源，是未来文明的基石"
        },

        "太空剧院":{
            type:"太空",
            basePrice:{金属板:500,塑料:500},costGrowth:1.20,
            happinessEffect:2,
            baseConsume:{电力:0.1,科学:2},
            desc:"使用暗能量表演魔术，提高幸福度"
        },
        "戴森球":{
            type: "太空",
            basePrice: {钛: 500000,金属板: 500000},costGrowth: 1.2,
            baseProduce: {电力:1.0}, 
            desc: "围绕太阳建造一个巨大的戴森球"
        },
        "星际交易站":{
            type: "太空",
            basePrice: {钢: 50000,金: 5000},  costGrowth: 1.1,
            baseConsume: {电力:0.05}, capProvide: {金:1000},
            desc: "交易效率远远高于市场"
        },
        "军营": {
            type: "军事",
            basePrice: {铁: 1000, 铜: 800},  costGrowth: 1.3,
            baseProduce: {军备: 0.2}, baseConsume: {铁: 0.5, 铜: 0.3,政策点:0.1}, capProvide: {军备:10},
            desc: "训练士兵，生产军备。消耗金属和政策点。"
        },
        "军工厂": {
            type: "军事",
            basePrice: {金属板: 1000, 钢: 800}, costGrowth: 1.3,
            baseConsume: {钢:0.2,电力:0.2}, capProvide: {},
            modifiers: [
                {target: "军营",prodFactor: 0.05 },
                {target:"军营",capFactor:0.05} ,
            ],
            desc: "提高军营效率。"
        }
    };