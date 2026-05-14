// config/buildingsConfig.js
/**
 * 计算标准建筑成本（适用于成本随建造数量指数增长的建筑）
 *
 * @param {Object.<string, number>} baseCostMap - 基础成本字典，例如：{木头: 5, 石头: 3}
 * @param {number} growthRate - 成本增长倍率，例如 1.15 表示每次建造成本 ×1.15
 * @param {number} count - 当前已建造的数量（用于计算第 count+1 个的成本）
 * @param {number} [costMultiplier=1.0] - 外部成本增长率修正因子（如全局成本加成）
 * @returns {Object.<string, number>} 计算后的价格对象，键为资源名，值为最终所需数量
 */
function standardCost(baseCostMap, growthRate, count, costMultiplier = 1.0) {
    const effectiveGrowth = 1 + (growthRate - 1) * costMultiplier;
    /** @type {Object.<string, number>} */
    const price = {};
    for (const res in baseCostMap) {
        const base = baseCostMap[res];
        price[res] = Math.floor(base * Math.pow(effectiveGrowth, count));
    }
    return price;
}

/**
 * @callback BuildingCostCallback
 * @param {GameState} state
 * @param {number} count
 * @returns {Object.<string, number>}
 */

/**
 * @callback BuildingStateCallback
 * @param {GameState} state
 * @returns {Object.<string, number>}
 */

/**
 * @callback BuildingValueCallback
 * @param {GameState} state
 * @returns {number}
 */

/**
 * @callback BuildingDescCallback
 * @param {GameState} state
 * @returns {string}
 */

/**
 * @typedef {Object} BuildingConfig
 * @property {string} class
 * @property {string} type
 * @property {{tech: string}} unlockCondition
 * @property {BuildingCostCallback} cost
 * @property {Object.<string, number> | BuildingStateCallback} produces
 * @property {Object.<string, number> | BuildingStateCallback} [consumes]
 * @property {Object.<string, number> | BuildingStateCallback} [caps]
 * @property {number | BuildingValueCallback} [happiness]
 * @property {Object.<string, number> | BuildingStateCallback} [providesLocal]
 * @property {Object.<string, number> | BuildingStateCallback} [requiresLocal]
 * @property {string | BuildingDescCallback} [desc]
 * @property {Array<{target: string, prodFactor?: number, consFactor?: number, capFactor?: number}>} [modifiers]
 * @property {Array<{id: string, name: string, produces: Object.<string, number>, consumes: Object.<string, number>}>} [modes]
 */
/** @type {Object.<string, BuildingConfig>} */
const BUILDINGS_CONFIG = {
    // ========== 地面 - 住房 ==========
    "帐篷": {

        class: "ground", type: "住房",
        unlockCondition: { tech: "搭建帐篷" },
        cost: (s, c) => standardCost({木头: 5}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        happiness: (state)=>{
            if (state.techs["冰河时期"].researched){
                let warm=state.buildings["取暖炉"]?.active||0;
                warm+=1.5*state.buildings["煤炉"]?.active||0;
                return -3*0.98**warm;
            }
            else return 0;
        },
        providesLocal: (state) => {
            let pop = 2;
            if (state.techs["天花"]?.researched) {
                const disease = 1.5-1.5*Math.pow(0.99,Math.floor(GameState.gameDays/20))
                const sanitation = state.buildings["卫生所"]?.active || 0;
                const hospital = state.buildings["医院"]?.active || 0;
                const inhibitor = Math.pow(0.98, sanitation + 2 * hospital);
                pop = 2 - disease * inhibitor;
                pop = Math.max(0.0, pop);
            }
            return { population: pop };
        },
        requiresLocal: {},
        desc:(state)=>{
            let desc="几根木棍撑起的兽皮帐篷，能为2个人遮风挡雨。";
            if (state.techs["冰河时期"].researched){
                desc+="但由于寒冷会降低幸福度，你需要研究取暖技术来抵消这种惩罚。"
            }
            if (state.techs["天花"].researched){
                desc+="由于天花病毒传播，住房提供的人口会逐渐变少。"
            }
            return desc; 
        }
    },
    "小屋": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "初级建筑学" },
        
        cost: (s, c) => {
            let baseRate=0.2;
            if (s.techs["钢铁小屋"]?.researched) baseRate=baseRate-0.02;
            if (s.techs["碳纤维小屋"]?.researched) baseRate=baseRate-0.02;
            let cost=standardCost({石头: 100, 建材:10}, 1+baseRate, c, getGlobalCostMultiplier(s));
            return cost;
        },
         
        produces: {}, consumes: {}, caps: {},
        happiness: (state)=>{
            if (state.techs["冰河时期"].researched){
                let warm=state.buildings["取暖炉"]?.active||0;
                warm+=1.5*state.buildings["煤炉"]?.active||0;
                return -4*0.98**warm;
            }
            else return 0;
        },
        providesLocal: (state) => {
        let pop = 5;
            if (state.techs["天花"]?.researched) {
                const disease = 4-4*Math.pow(0.99,Math.floor(GameState.gameDays/50))
                const sanitation = state.buildings["卫生所"]?.active || 0;
                const hospital = state.buildings["医院"]?.active || 0;
                const inhibitor = Math.pow(0.99, sanitation + 2 * hospital);
                pop = 5 - disease * inhibitor;   // 最大损失 3 人口
                pop = Math.max(0, pop);
            }
            return { population: pop };
        },
        requiresLocal: {},
        desc: "石头地基、木梁和茅草屋顶，舒适的小屋可容纳5人。"
    },
    "公寓楼": {
        class: "ground", type: "住房",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 200, 钢: 150}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.08}, caps: {},
        happiness: (state)=>{
            if (state.techs["冰河时期"].researched){
                let warm=state.buildings["取暖炉"]?.active||0;
                warm+=1.5*state.buildings["煤炉"]?.active||0;
                return -5*0.98**warm;
            }
            else return 0.1;
        },
        providesLocal: (state) => {
            let pop = 2;
            if (state.techs["天花"]?.researched) {
                const disease = 2.0-2.0*Math.pow(0.99,Math.floor(GameState.gameDays/100))
                const sanitation = state.buildings["卫生所"]?.active || 0;
                const hospital = state.buildings["医院"]?.active || 0;
                const inhibitor = Math.pow(0.995, sanitation + 2 * hospital);
                pop = 2 - disease * inhibitor; 
                pop = Math.max(0.0, pop);
            }
            // 成就永久加成
            if (state.achievements && state.achievements["天花"]) {
                pop += 0.05;
            }
            return { population: pop };
        },
        requiresLocal: {},
        desc:(state)=>{
            let desc="高层公寓，豪华但消耗电力，只能提供 2 人口容量，真是太奢侈了！";
            if (state.techs["冰河时期"].researched){
                desc+="同时由于房间巨大因此取暖也更加困难。"
            }
            return desc; 
        }
    },
    "卫生所": {
        class: "ground", type: "医疗",
        unlockCondition: { tech: "隔离措施" },
        cost: (s, c) => standardCost({木头: 200, 科学: 10}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "基本的卫生设施，隔离病人、分发药品，降低天花传播风险。"
    },

    "医院": {
        class: "ground", type: "医疗",
        unlockCondition: { tech: "病毒学" },
        cost: (s, c) => standardCost({铁:100,建材: 100, 科学: 50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.2}, caps: {},
        providesLocal: {},
        requiresLocal: {population: 1},
        desc: "正规综合医院，配备专业医生和器械，抑制天花的效果比卫生所更好。"
    },

    // ========== 地面 - 生产 ==========
    "伐木场": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "伐木技术" },
        cost: (s, c) => standardCost({木头: 10}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {木头: 0.4},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "锯木机和运输带，将原木快速加工成标准木材。需要1名工人。",
        
    },
    "采石场": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "采石技术" },
        cost: (s, c) => standardCost({木头: 5, 石头: 5}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石头: 0.4},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "露天矿坑，用爆破和机械破碎采集石料。需要1名工人。"
    },
    "炭窑":{
        class: "ground", type: "生产",
        unlockCondition: { tech: "制炭技术" },
        cost: (s, c) => standardCost({木头: 150,石头:50}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {煤: 0.35},
        consumes: {木头:1.6}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将木头烧制成木炭，需要1名工人操作。"
    },
    "煤矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "煤矿生产" },
        cost: (s, c) => standardCost({木头:50,石头: 100}, 1.20, c, getGlobalCostMultiplier(s)),
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
        produces: {}, consumes: {电力: 0.3}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "大型露天综合采矿基地，消耗电力来提高邻近煤矿、金矿和铀矿的产量。",
        modifiers: [{ target: "煤矿", prodFactor: 0.15 },{target:"金矿",prodFactor:0.15},{target:"铀矿",prodFactor:0.05}]
    },
    "工具加工站": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "铁斧" },
        cost: (s, c) => standardCost({铁: 500, 石头: 500}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高精度数控机床，为伐木场和采石场制造耐磨刀具，提升二者效率。",
        modifiers: [{ target: "伐木场", prodFactor: 0.05 }, { target: "采石场", prodFactor: 0.05 }]
    },
    "金矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "金精炼" },
        cost: (s, c) => standardCost({铁: 80, 木头: 500}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {金: 0.25},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "淘洗砂金或开采脉金，产出微量黄金。需要1名淘金者。"
    },
    "银行": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "银行学" },
        cost: (s, c) => standardCost({建材: 200, 铁: 300}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {}, caps: {金:50},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers:[{target:"金矿",prodFactor:0.05}],
        desc: "提升金矿产出。"
    },
    "油田": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "有机化学" },
        cost: (s, c) => standardCost({金属板: 50, 钢: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {石油: 0.5}, consumes: {电力: 0.65}, caps: {石油: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "抽油机和分离罐，开采地下石油并暂存。需要1名操作员，消耗电力。"
    },
    "铀矿": {
        class: "ground", type: "生产",
        unlockCondition: { tech: "核物理" },
        cost: (s, c) => standardCost({铁: 300, 建材: 150}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铀: 0.25}, consumes: {}, caps: {铀: 50},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "地下开采铀矿石，经简单破碎后得到铀。"
    },

    // ========== 地面 - 工厂 ==========
    "铜冶炼厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "铜冶炼" },
        cost: (s, c) => standardCost({石头: 50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铜: 0.25}, consumes: {煤: 0.5, 石头: 0.8}, caps: {},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "鼓风炉将铜精矿熔炼成粗铜，消耗煤和石头，产出铜。由于工厂的污染严重，会降低幸福度。"
    },
    "铁冶炼厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "铁冶炼" },
        cost: (s, c) => standardCost({石头: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铁: 0.16}, consumes: {煤: 0.65, 石头: 1.0}, caps: {},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高炉流程，用焦炭还原铁矿石，产出铁。"
    },
    "建材工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "初级建筑学" },
        cost: (s, c) => standardCost({铁: 50, 木头: 200}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {建材: 0.2}, consumes: {木头: 5, 石头: 2.5, 铁: 0.4, 电力: 0.4}, caps: {建材: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "将木头、石头和铁加工成标准建筑模块（建材），消耗电力和大量原料。"
    },
    "炼钢厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "炼钢技术" },
        cost: (s, c) => standardCost({建材: 30, 铜: 100}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.16}, consumes: {煤: 0.3, 铁: 0.6}, caps: {钢: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "转炉或电弧炉将生铁炼成钢，消耗煤和铁。"
    },
    "电解铝厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "电解铝" },
        cost: (s, c) => standardCost({建材: 30, 钢: 40}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {铝: 0.16}, consumes: {电力: 0.8, 石头: 1.2}, caps: {铝: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "熔盐电解槽，将氧化铝还原为金属铝，耗电巨大。"
    },
    "金属加工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属加工" },
        cost: (s, c) => standardCost({建材: 50, 铁: 100}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {金属板: 0.16}, consumes: {电力: 0.4, 铜: 1.2, 铝: 0.4}, caps: {金属板: 100},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "冲压、铸造、切削，将铜和铝加工成金属板。"
    },
    "金属回收厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "金属回收" },
        cost: (s, c) => standardCost({建材: 50, 金属板: 100}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {钢: 0.3, 铁:0.6, 铜:1.2, 铝:0.8}, consumes: {电力: 0.6, 金属板: 0.3},
        happiness: -0.4,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "熔炼废金属板，重新得到钢、铁、铜、铝。"
    },
    "塑料厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "石油加工" },
        cost: (s, c) => standardCost({金属板: 30, 建材: 30}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {塑料: 0.25}, consumes: {电力: 0.4, 石油: 0.6}, caps: {塑料: 100},
        happiness: -0.6,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "聚合反应釜，将石油转化为塑料颗粒，污染十分严重。"
    },
    "碳纤维厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "碳纤维材料" },
        cost: (s, c) => standardCost({金属板: 200, 塑料: 100}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {碳纤维: 0.25}, consumes: {电力: 1.0, 煤: 0.4}, caps: {碳纤维: 100},
        happiness: -0.2,
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "高温碳化炉，把塑料纤维转化为高强度碳纤维。"
    },
    "核燃料工厂": {
        class: "ground", type: "工厂",
        unlockCondition: { tech: "核燃料" },
        cost: (s, c) => standardCost({金属板: 150, 铁: 400}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.25}, consumes: {电力: 1.2, 铀: 0.3}, caps: {核燃料: 100},
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
        produces: {电力: 0.5}, consumes: {煤: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "燃煤锅炉推动活塞曲柄，带动发电机。产出电力，消耗煤。"
    },
    "石油发电厂": {
        class: "ground", type: "电力",
        unlockCondition: { tech: "石油发电" },
        cost: (s, c) => standardCost({建材:50, 钢:50}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {电力:0.4}, consumes: {石油:0.16}, caps: {},
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
            let base = 0.25;
            if (dayOfYear >= 90 && dayOfYear < 180) base = 0.5;
            else if (dayOfYear >= 270) {
                base = 0.125;
                if (state.achievements && state.achievements["冰河时期"]){
                    base=0.167;
                }
            }
            if (state.techs["冰河时期"].researched){
                base=0.125;
            }
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
            { id: "nuclear_fuel", name: "核燃料模式", produces: {电力: 0.8}, consumes: {核燃料: 0.02} },
            { id: "uranium_fuel", name: "铀燃料模式", produces: {电力: 0.7}, consumes: {铀: 0.3} }
        ]
    },

    // ========== 地面 - 科学 ==========
    "图书馆": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "印刷术" },
        cost: (s, c) => standardCost({木头: 20,石头:20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.08}, consumes: {}, caps: {科学: 10},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "藏书室和阅读区，缓慢产生科学知识，同时增加科学上限。"
    },
    "大学": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "微积分" },
        cost: (s, c) => standardCost({石头:50,铜: 30, 铁: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.12}, consumes: {电力: 0.12}, caps: {科学: 40},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "教室和实验室，需要电力。"
    },
    "博物馆": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "公开展览遗物" },
        cost: (s, c) => standardCost({石头: 300,木头:200, 铜: 150}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {科学: 50},
        happiness: (state) => 0.5 * Math.log(Math.E + (state.resources["遗物"]?.amount || 0)/200),
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers:[{target:"金矿",prodFactor:0.05}],
        desc: "陈列远古遗物，提高金产出。幸福感加成随遗物持有数量增长。"
    },
    "遗物研究所": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "秘密研究遗物" },
        cost: (s, c) => standardCost({石头: 300,木头:200, 铜: 150}, 1.4, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {科学: 100},
        happiness: (state) => 0.4 * Math.log(Math.E + (state.resources["遗物"]?.amount || 0)/200),
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "研究远古遗物，提供科学上限。幸福感加成随遗物持有数量增长。"
    },
    "哲学院": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "哲学" },
        cost: (s, c) => {return {建材: 50*Math.pow(2,c)}},
        produces: {}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc:(state)=>{ 
            base=0.0002;
            base*=Math.sqrt(1+ResourcesManager.getAmount("智慧"));
            return `每个激活的哲学院降低所有建筑(除自己和金字塔等特殊建筑)和升级的成本增长率(乘算)${(base*100).toFixed(3)}%,该效果取决于你持有的智慧数量。`
        },
    },
    "科学院": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "材料化学" },
        cost: (s, c) => standardCost({塑料: 30, 金属板: 30}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "先进仪器和智库，提升相邻大学10%的科学产出与上限。",
        modifiers: [{ target: "大学", prodFactor: 0.1, capFactor: 0.1 }]
    },
    "粒子加速器": {
        class: "ground", type: "科学",
        unlockCondition: { tech: "量子力学" },
        cost: (s, c) => standardCost({金属板:500, 建材:500, 科学:500}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {科学:0.05}, consumes: {电力:0.3}, caps: {},modifiers:[{target: "大学", capFactor: 0.02}],
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "环形对撞机，产出科学，且每座（无论是否激活）提升2%遗物获取量。"
    },

    // ========== 地面 - 存储 ==========
    "仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "基础储存技术" },
        cost: (s, c) => standardCost({木头: 50, 石头: 50}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头: 100, 石头: 100},
        providesLocal: {},
        requiresLocal: (state)=>{
            let pop=0;
            if(state.techs["低效"]?.researched) pop=1;
            return {population:pop}
        },
        desc: "木结构棚库，增加木头和石头储存上限。"
    },
    "集装箱": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "进阶存储技术" },
        cost: (s, c) => standardCost({铁: 40, 铜: 20}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {木头:500, 石头:500, 煤:200, 铜:200, 铁:200, 钢:200, 铝:200},
        providesLocal: {},
        requiresLocal: (state)=>{
            let pop=0;
            if(state.techs["低效"]?.researched) pop=1;
            return {population:pop}
        },
        desc: "钢制标准箱堆场，大幅提高多种资源的上限。"
    },
    "大型仓库": {
        class: "ground", type: "存储",
        unlockCondition: { tech: "大宗存储技术" },
        cost: (s, c) => standardCost({金属板: 80, 钢: 80}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.16}, caps: {木头:5000, 石头:5000, 煤:1000, 铜:1000, 铁:1000, 钢:500, 铝:400, 金:400, 建材:400, 塑料:400, 金属板:400,碳纤维:200},
        providesLocal: {},
        requiresLocal: (state)=>{
            let pop=0;
            if(state.techs["低效"]?.researched) pop=1;
            return {population:pop}
        },
        desc: "自动化立体仓库，耗电运行，极度提升几乎所有资源的上限。"
    },

    // ========== 地面 - 军事 ==========
    "军营": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军事理论" },
        cost: (s, c) => standardCost({铁: 1000, 铜: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {军备: 0.15}, consumes: {铁: 0.4, 铜: 0.3, 政策点:0.05}, caps: {军备:20},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "训练场和武器库，消耗铁和铜生产军备，同时消耗政策点维持纪律。"
    },
    "军工厂": {
        class: "ground", type: "军事",
        unlockCondition: { tech: "军工技术" },
        cost: (s, c) => standardCost({金属板: 1000, 钢: 800}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {钢:0.15, 电力:0.15}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers: [{ target: "军营", prodFactor: 0.05, capFactor: 0.05 }],
        desc: "弹药生产线，提升军营的效率和容量。"
    },

    // ========== 地面 - 其他 ==========
    "取暖炉":{
        class: "ground", type: "其他",
        unlockCondition: { tech: "取暖技术" },
        cost: (s, c) => standardCost({木头: 50, 石头: 30}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {木头: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: {population:1},
        desc: "燃烧木头来取暖，稍稍降低住房的幸福度惩罚。"
    },
    "煤炉":{
        class: "ground", type: "其他",
        unlockCondition: { tech: "煤炭供暖" },
        cost: (s, c) => standardCost({建材: 50, 石头: 300}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {煤: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: {population:1},
        desc: "燃烧煤来取暖，效果比取暖炉稍好一些。"
    },
    "行政机关": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "管理学" },
        cost: (s, c) => standardCost({木头: 100, 铁: 30}, 2.0, c, getGlobalCostMultiplier(s)),
        produces: {政策点: 0.08}, consumes: {科学: 0.30}, caps: {政策点: 50},
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
        produces: {}, consumes: {核燃料:0.016}, caps: {},
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
        produces: {}, consumes: {电力: 0.4, 金: 0.8},
        caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "商业航天企业，通过竞争与创新，每激活一个航天公司可使每个发射井提供的太空承载提升5%。"
    },
    "金字塔": {
        class: "ground", type: "其他",
        unlockCondition: { tech: "奇观" },
        cost: (s, c) => ({石头: 30000*(2**Math.floor(c/100)), 建材: 1500*(2**Math.floor(c/100))}),
        produces: {}, consumes: {}, caps: {},
        happiness: (state) => 0.1*(state.buildings["金字塔"].active>99?1:0),
        providesLocal: {},
        requiresLocal: {},
        desc: "宏伟的金字塔，由100个部件组成（前99次建造无任何作用），建成后，提供幸福度加成。"
    },
    // ========== 太空==========
    "轨道电梯": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "轨道电梯" },
        cost: (s, c) => standardCost({碳纤维: 5000, 钛: 3000, 金属板: 8000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.7}, caps: {},
        providesLocal: {space_habitat:1},
        requiresLocal: { population: 1 },
        modifiers: [
            { target: "月球铁矿", prodFactor: 0.03 },
            { target: "月球铜矿", prodFactor: 0.03 },
            { target: "月球钛矿", prodFactor: 0.03 }
        ],
        desc:"从地面延伸至地球同步轨道的碳纳米管缆绳，大幅提高月球矿物产出，同时每个轨道电梯降低月球基地价格2%。"
    },
    "月球基地": {
        class: "space", type: "月球",
        unlockCondition: { tech: "探索月球" },
        cost: (s, c) => {
            /**@type {Object.<string,number>} */
            const baseCost = {金属板: 50, 碳纤维: 100};
            const growth = 1.15;
            const mult = getGlobalCostMultiplier(s);
            const eff = 1 + (growth - 1) * mult;
            const elevator = s.buildings["轨道电梯"]?.active || 0;
            const discount = Math.pow(0.98, elevator);
            /**@type {Object.<string,number>} */
            const price = {};
            for (let r in baseCost) price[r] = Math.floor(baseCost[r] * Math.pow(eff, c) * discount);
            return price;
        },
        produces: {}, consumes: {电力: 1.6},
        caps: {铀:500, 钛:500, 碳纤维:500, 核燃料:200},
        providesLocal: (state)=>{
            let habitat=1;
            if(state.techs["地月轨道运输"].researched)
            {
                habitat+=0.01*(state.buildings["轨道电梯"]?.active||0);
            }
            return {moon_habitat:habitat} 
        },
        requiresLocal: { space_habitat:1,population: 1 },
        desc: "密闭穹顶和生命维持系统，提供1点月球宜居度，价格随轨道电梯数量降低。"
    },
    "月球铁矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({钢: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铁: 1.2}, consumes: {电力: 0.8}, caps: {铁:100},
        providesLocal: {},
        requiresLocal: {  moon_habitat: 0.5, population: 1 },
        desc: "月壤中的富铁玄武岩，经电磁分离得到铁。"
    },
    "月球铜矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "基础月球采矿" },
        cost: (s, c) => standardCost({铝: 50, 碳纤维: 150}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {铜: 1.6}, consumes: {电力: 0.6}, caps: {铜:100},
        providesLocal: {},
        requiresLocal: {  moon_habitat: 0.5, population: 1 },
        desc: "月球高地的铜矿脉，产出铜。"
    },
    "月球钛矿": {
        class: "space", type: "月球",
        unlockCondition: { tech: "进阶月球采矿" },
        cost: (s, c) => standardCost({金属板: 100, 碳纤维: 250}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {钛: 0.4}, consumes: {电力: 1.0}, caps: {钛: 100},
        providesLocal: {},
        requiresLocal: { moon_habitat: 0.5, population: 1 },
        desc:"从月海钛铁矿中提取钛。"
    },
    "月球研究所": {
        class: "space", type: "月球",
        unlockCondition: { tech: "研究月球" },
        cost: (s, c) => standardCost({钛: 250, 钢: 400,铝:100}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {科学: 0.05}, consumes: {电力: 0.8}, caps: {科学: 200},
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
            { target: "建材工厂", prodFactor: 0.1 },
            { target: "炼钢厂", prodFactor: 0.1 },
            { target: "电解铝厂", prodFactor: 0.1 },
            { target: "金属加工厂", prodFactor: 0.1 },
            { target: "塑料厂", prodFactor: 0.1 },
            { target: "碳纤维厂", prodFactor: 0.1 },
            { target: "核燃料工厂", prodFactor: 0.1 }
        ],
        desc:"利用月球真空环境精炼材料，提升地面多种工厂产量。"
    },

    "木星基地": {
        class: "space", type: "木星",
        unlockCondition: { tech: "探索木星" },
        cost: (s, c) => standardCost({钛: 10000, 塑料: 5000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.6},
        caps: {氚:300, 核燃料:300},
        providesLocal: (state) => {
            const stabilizers = state.buildings["悬浮稳定器"]?.active || 0;
            return { gas_habitat: 1 + stabilizers * 0.2 };
        },
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
        produces: {氚: 0.15}, consumes: {电力: 0.5}, caps: {氚: 100},
        providesLocal: {},
        requiresLocal: { gas_habitat: 1.0, population: 1 },
        desc:"从大气深处捕获氚同位素。"
    },
    "氚燃料厂": {
        class: "space", type: "木星",
        unlockCondition: { tech: "氚处理" },
        cost: (s, c) => standardCost({钛: 10000, 碳纤维: 20000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {核燃料: 0.3}, consumes: {氚: 0.4, 电力: 0.25}, caps: {核燃料: 100},
        providesLocal: {},
        requiresLocal: {  gas_habitat: 1.0, population: 1 },
        desc: "将氚与锂反应生成氦和大量核燃料"
    },
    "气象卫星": {
        class: "space", type: "木星",
        unlockCondition: { tech: "气象观测" },
        cost: (s, c) => standardCost({钛: 25000, 建材: 40000,核燃料:3000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.3,核燃料:4}, 
        caps: (s)=>{
            let scibase=500;
            const people=s.buildings["浮空居民区"]?.active || 0;
            let sci = scibase*(1+0.1*people)
            return {科学:sci}
        },
        providesLocal: {},
        requiresLocal: { gas_habitat: 0.5, population: 1 },
        desc:"观测木星大气的气象卫星，需要大量核燃料来克服木星的巨大引力。\n每个浮空居民区会增加其10%上限。"
    },
    "浮空居民区": {
        class: "space",
        type: "木星",
        unlockCondition: { tech: "木星殖民" },
        cost: (s, c) => standardCost({钢: 5000, 金属板: 5000, 核燃料: 2000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力: 0.4},
        caps: {},
        happiness: 0.1,
        providesLocal: (state) => {
            const centers = state.buildings["居住扩展中心"]?.active || 0;
            return { population: 3 + centers * 0.2 };
        },
        requiresLocal: { gas_habitat: 1},
        desc: "悬浮在木星云顶的居住舱，利用磁场维持稳定，窗外有波澜壮阔的气态风暴非常美丽。每座可容纳3位殖民者。"
    },
    "悬浮稳定器": {
        class: "space", type: "木星",
        unlockCondition: { tech: "悬浮稳定技术" },
        cost: (s, c) => standardCost({建材:5000, 钛: 6000, 核燃料: 5000}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc: "利用反重力装置稳定木星云顶浮空城，每座可使木星基地的宜居度提升0.2。"
    },
    "居住扩展中心": {
        class: "space", type: "木星",
        unlockCondition: { tech: "太空居住规划" },
        cost: (s, c) => standardCost({钢: 800, 塑料: 10000, 核燃料: 6000}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.4}, caps: {},
        providesLocal: {},
        requiresLocal: { gas_habitat: 0.5},
        desc: "高效空间利用与生命维持系统，每座可使浮空居民区的人口容量增加0.2。"
    },
    "孢子烟花": {
        class: "space", type: "木星",
        unlockCondition: { tech: "孢子烟花" },
        cost: (s, c) => standardCost({金属板: 5000, 钛: 5000}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.15}, caps: {},
        happiness: (state) => 1.0 * Math.log(Math.E + (state.resources["孢子"]?.amount || 0)/200),
        providesLocal: {},
        requiresLocal: { gas_habitat: 0.5 },
        desc:"利用孢子和木星大气制造规模前所未有的烟花，愉悦殖民者。幸福感加成随孢子持有数量增长。"
    },
    "燃料库": {
        class: "space",
        type: "木星",
        unlockCondition: { tech: "燃料储存" },
        cost: (s, c) => standardCost({碳纤维:20000,金属板:10000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {},
        caps: {铀:2000,氚:2000,核燃料:2000},
        providesLocal: {},
        requiresLocal: {gas_habitat:0.5 },
        desc: "建造巨大的燃料库，安全存储大量高能燃料"
    },
    "核燃料转化炉": {
        class: "space",
        type: "木星",
        unlockCondition: { tech: "核素转化" },
        cost: (s, c) => standardCost({金属板: 8000, 钢: 6000,}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {煤: 1.6},
        consumes: {核燃料: 0.04},
        caps: {},
        happiness: -0.5,
        providesLocal: {},
        requiresLocal: { population: 1,gas_habitat:0.5 },
        desc: "通过核反应逆向裂变将核燃料转变为普通煤炭，可以依靠核燃料本身能量因而不需要额外电力，但是过程中会产生大量污染。"
    },
    "木卫二前哨": {
        class: "space",
        type: "木卫二",
        unlockCondition: { tech: "探索木卫二" },
        cost: (s, c) => standardCost({钛:20000,钢:10000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力:0.8},
        caps: {},
        providesLocal: {europa_habitat:2},
        requiresLocal: {gas_habitat:1},
        desc: "在木卫二上建立前哨，探索这颗冰封的星球"
    },
    "冰层钻井": {
        class: "space",
        type: "木卫二",
        unlockCondition: { tech: "外星生物学" },
        cost: (s, c) => standardCost({钛:50000,碳纤维:40000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {生物质:0.03},
        consumes: {电力:8},
        caps: {生物质:200},
        providesLocal: {},
        requiresLocal: {europa_habitat:1,population:1},
        desc: "使用钻井捕获冰层下方的微生物"
    },
    "生物实验室": {
        class: "space",
        type: "木卫二",
        unlockCondition: { tech: "外星生物学" },
        cost: (s, c) => standardCost({钢:50000,建材:50000,金属板:30000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {科学:0.05},
        consumes: {生物质:0.04,电力:8},
        caps: {科学:2000,生物质:500},
        providesLocal: {},
        requiresLocal: {europa_habitat:1,population:1},
        desc: "研究外星微生物的具体构造"
    },
    "生物合金厂": {
        class: "space",
        type: "木卫二",
        unlockCondition: { tech: "生物合金" },
        cost: (s, c) => standardCost({钛:60000,碳纤维:60000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {生物合金:0.04},
        consumes: {生物质:0.4,铜:25,铁:15,电力:30},
        caps: {生物合金:500},
        providesLocal: {},
        requiresLocal: {europa_habitat:1,population:1},
        desc: "将生物质融入金属中，制作稀有的生物合金。"
    },
    "暗能量融合仪": {
        class: "space",
        type: "木卫二",
        unlockCondition: { tech: "暗能量融合" },
        cost: (s, c) => standardCost({生物合金:250,钢:30000,塑料:40000,铁:60000,铜:60000}, 1.3, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力:1.6},
        caps: {},
        providesLocal: {},
        requiresLocal: {population:1},
        desc: "一台极其复杂的机器，可以让外星微生物和暗能量交互。每个提高1%太空剧院幸福度加成，同时在共生重置中，每个（不论是否激活）将使你额外获得相当于孢子获取数5%的暗能量。"
    },
    "休眠舱": {
        class: "ground",
        type: "住房",
        unlockCondition: { tech: "休眠技术" },
        cost: (s, c) => standardCost({生物合金:1000,金属板:60000}, 1.03, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力:4},
        caps: {},
        providesLocal: {population:1},
        requiresLocal: {},
        desc: "利用生物合金技术让人安全地进入长时间休眠状态。"
    },
    "聚变反应堆": {
        class: "space", type: "月球",
        unlockCondition: { tech: "可控核聚变" },
        cost: (s, c) => standardCost({金属板: 10000, 碳纤维: 5000, 核燃料: 1000}, 1.12, c, getGlobalCostMultiplier(s)),
        produces: {电力: 2.4}, consumes: {核燃料: 0.40}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc:"托卡马克装置，用核燃料实现可控聚变，产生海量电力。"
    },
    "太空剧院": {
        class: "space", type: "近地轨道",
        unlockCondition: { tech: "太空剧院" },
        cost: (s, c) => standardCost({金属板: 500, 塑料: 500}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 0.3, 科学: 1.5}, caps: {},
        happiness: (state) => {return 1.0 * Math.log(Math.E + (state.resources["暗能量"]?.amount || 0)/200)*(1+0.01*(state.buildings["暗能量融合仪"]?.active||0))},
        providesLocal: {},
        requiresLocal: { space_habitat: 0.5, population: 1 },
        desc:"利用暗能量制造全息幻象，愉悦殖民者。幸福感加成随暗能量持有数量增长。"
    },
    "空间仓库": {
        class: "space", type: "柯伊伯带",
        unlockCondition: { tech: "深空存储技术" },
        cost: (s, c) => standardCost({金属板: 20000, 钢: 20000,钛:20000,生物合金:200}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 1.5}, caps: {木头:20000, 石头:20000, 煤:5000, 铜:5000, 铁:5000, 钢:5000, 铝:5000,钛:5000, 金:5000, 建材:5000, 塑料:5000, 金属板:5000,碳纤维:5000,生物质:5000,生物合金:5000,核燃料:5000},
        providesLocal: {},
        requiresLocal: {},
        desc: "在遥远的柯伊伯带存放大量物资。"
    },
    "旅行者号":{
        class: "space", type: "柯伊伯带",
        unlockCondition: { tech: "旅行者" },
        cost: (s, c) => standardCost({科学: 20000, 金属板: 50000,钛:25000,核燃料:10000,生物合金:500}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 1.5}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        modifiers: [{ target: "月球研究所", capFactor: 0.1 }],
        desc: "飞向太阳系之外的探测器,提升10%月球研究所科学上限。"
    },
    "寰宇巨环":{
        class: "galaxy", type: "深空",
        unlockCondition: { tech: "寰宇巨环" },
        cost: (s, c) => ({
            铁: 200000 * (2 ** Math.floor(c / 100)),
            钛: 200000 * (2 ** Math.floor(c / 100)),
            金刚石: 50000 * (2 ** Math.floor(c / 100))
        }),
        produces: (state) => {
            // 需要 100 个部件（激活）才算建成，此后每个部件提供 2 电力
            if (state.buildings["寰宇巨环"].active >= 100) return {电力: 2};
            return {};
        },
        consumes: {},
        caps: {},
        happiness: 0,
        providesLocal: (state) => {
            // 建成后每个部件提供 1 比邻星宜居度、1 人口容量
            if (state.buildings["寰宇巨环"].active >= 100) return { 
                proxima_centauri_habitat: 1, 
                population: 1 
            };
            return {};
        },
        requiresLocal: {},
        desc: "环绕比邻星的巨大环世界，需要100个部件才能起作用。"
    },
    "比邻星空间站":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "比邻星计划" },
        cost: (s, c) => standardCost({科学: 25000, 金属板: 100000,钢:50000,核燃料:25000,生物合金:2000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {核燃料:4}, caps: {},
        providesLocal: {proxima_centauri_habitat:2},
        requiresLocal: {space_habitat:1},
        desc: "在比邻星周围建立空间站，为探索比邻星周围做准备。"
    },
    "深空矿船":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "深空采矿" },
        cost: (s, c) => standardCost({金属板: 100000,钛:50000,核燃料:30000,生物合金:3000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {铜:4,铁:4,钛:1.6}, consumes: {电力:4}, caps: {},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1,population:1},
        desc: "在比邻星周围的小行星上采集各种矿物。"
    },
    "金属综合加工厂":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "综合金属加工" },
        cost: (s, c) => standardCost({金属板: 100000,钛:50000,核燃料:30000,生物合金:3000}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {钢:8,金属板:4}, consumes: {电力:16,石头:80,铜:60,铁:35,铝:8}, caps: {},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1,population:2},
        desc: "通过复杂的反应产出多种重要建筑材料。"
    },
    "燃料综合加工厂":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "综合燃料加工" },
        cost: (s, c) => standardCost({钢: 100000,碳纤维:50000,核燃料:30000,生物合金:3000}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {核燃料:4,石油:4}, consumes: {电力:15,铀:15,氚:4}, caps: {},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1,population:2},
        desc: "通过复杂的反应产出多种重要燃料。"
    },
    "豪华公寓":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "豪华公寓" },
        cost: (s, c) => standardCost({钢: 100000,生物合金:5000,金刚石:2000}, 1.10, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:4}, caps: {},
        providesLocal: {population:2},
        happiness:0.3,
        requiresLocal: {proxima_centauri_habitat:1},
        desc: "使用金刚石制造的豪华公寓。"
    },
    "有机物加工厂":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "综合有机物加工" },
        cost: (s, c) => standardCost({塑料: 200000,碳纤维:200000,生物合金:10000,金刚石:1000}, 1.20, c, getGlobalCostMultiplier(s)),
        produces: {塑料:4,碳纤维:4}, consumes: {电力:15,石油:15,煤:4}, caps: {},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1,population:2},
        desc: "通过复杂的反应加工多种有机物。"
    },
    "生物加工厂":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "综合生物加工" },
        cost: (s, c) => standardCost({金属板: 200000,铝:200000,镍:1000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {生物合金:0.8},
        consumes: {生物质:0.8,铜:40,铁:30,电力:80,核燃料:8},
        caps: {},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1,population:2},
        desc: "核燃料的引入和规模化的生产大大提高了生物质转化成合金的效率。"
    },
    "军事基地":{
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "太空驻军" },
        cost: (s, c) => standardCost({铁: 200000,钛:50000,核燃料:500000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {军备:0.15}, consumes: {铁:4,钛:0.8,电力:4}, caps: {军备:1000},
        providesLocal: {},
        requiresLocal: {proxima_centauri_habitat:1},
        desc: "在比邻星周围建立军事基地"
    },
    "奇点炸弹": {
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "奇点炸弹" },
        cost: (s, c) => standardCost({铝:200000,钛:100000,生物合金: 5000, 金刚石: 5000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 4, 科学: 8}, caps: {},
        happiness: (state) => {return 2.0 * Math.log(Math.E + (state.resources["奇点"]?.amount || 0)/200)},
        providesLocal: {},
        requiresLocal: { proxima_centauri_habitat: 1, population: 1 },
        desc:"利用奇点炸弹赢得幸福度，艺术就是爆炸。幸福感加成随奇点持有数量增长。"
    },
    "比邻星物流中心": {
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "比邻星物流" }, 
        cost: (s, c) => standardCost({钢: 100000, 金属板: 80000,金刚石:5000, 镍: 2000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力: 16},
        caps: {
            木头: 40000, 石头: 40000, 煤: 20000, 铜: 20000, 铁: 20000,
            钢: 20000, 铝: 20000, 钛: 20000, 金: 20000, 建材: 20000,
            塑料: 20000, 金属板: 20000, 碳纤维: 20000, 生物质:20000,生物合金: 20000,
            核燃料: 20000, 石油: 20000, 铀: 20000, 氚: 20000, 金刚石: 20000,镍:20000
        },
        providesLocal: {},
        requiresLocal: {},
        desc: "利用外星物流技术大幅扩展各类物资的储存上限，同时也提高交易上限。"
    },
    "质能转换机": {
        class: "galaxy", type: "比邻星",
        unlockCondition: { tech: "质能转换" },
        cost: (s, c) => standardCost({钢: 500000, 生物合金: 50000, 金刚石: 30000,镍:30000}, 1.2, c, getGlobalCostMultiplier(s)),
        produces: {金: 8},
        consumes: {电力: 40},
        caps: {},
        providesLocal: {},
        requiresLocal: { proxima_centauri_habitat: 1, population: 1 },
        desc: "一台真正疯狂的机器，质能方程的工业应用。尽管目前效率不高，但随着技术发展会越来越高效。"
    },
    "类星体卫星":{
        class: "galaxy", type: "类星体",
        unlockCondition: { tech: "类星体探索" },
        cost: (s, c) => standardCost({科学: 5000, 金刚石: 100000,镍:50000,核燃料:250000}, 1.01, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:4}, caps: {},
        providesLocal: {quasar_habitat:1},
        requiresLocal: {population:1},
        desc: "在巨大的类星体周围布置卫星，由于类星体很大，因此需要大量卫星。"
    },
    "离子收集卫星":{
        class: "galaxy", type: "类星体",
        unlockCondition: { tech: "等离子体采矿" },
        cost: (s, c) => standardCost({科学: 5000, 金刚石: 200000,钢:500000,核燃料:300000}, 1.01, c, getGlobalCostMultiplier(s)),
        produces: {等离子体:0.008}, consumes: {电力:15}, caps: {等离子体:2000},
        providesLocal: {},
        requiresLocal: {population:1,quasar_habitat:1},
        desc: "一个收集等离子体的卫星"
    },
    "离子实验室":{
        class: "galaxy", type: "类星体",
        unlockCondition: { tech: "等离子体实验" },
        cost: (s, c) => standardCost({科学: 5000, 镍: 100000,钛:500000,核燃料:350000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:8,等离子体:0.008}, caps: {科学:2000,等离子体:10000},
        providesLocal: {},
        requiresLocal: {population:2,quasar_habitat:5},
        desc: "研究等离子体的实验室。"
    },
    "等离子体钻":{
        class: "galaxy", type: "类星体",
        unlockCondition: { tech: "等离子体钻" },
        cost: (s, c) => standardCost({科学: 5000, 等离子体: 10000,金属板:500000,核燃料:400000}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:8,等离子体:0.008}, caps: {},
        providesLocal: {},
        requiresLocal: {population:2,quasar_habitat:1},
        modifiers:[{target:"深空矿船",prodFactor:0.02}],
        desc: "使用等离子体的能量加快采矿。"
    },
    "离子反应堆":{
        class: "galaxy", type: "类星体",
        unlockCondition: { tech: "离子反应堆" },
        cost: (s, c) => standardCost({科学: 5000, 等离子体: 50000,金属板:500000,钢:500000,钛:500000}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {等离子体:0.015}, caps: {},
        providesLocal: {},
        requiresLocal: {population:2,quasar_habitat:2},
        modifiers:[{target:"聚变反应堆",prodFactor:0.02}],
        desc: "使用等离子体的能量加快聚变反应堆效率。"
    },



    "戴森球": {
        class: "space", type: "太阳",
        unlockCondition: { tech: "戴森球计划" },
        cost: (s, c) => standardCost({钛: 500000, 金属板: 500000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {电力:1.2}, consumes: {}, caps: {},
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
        produces: {电力:0.2, 科学:0.2}, consumes: {},modifiers:[{target: "月球研究所", capFactor: 0.05}],
        requiresLocal: { population: 1 },
        desc:"探测并转化暗能量为电力和科学，堪称‘永动机’。"
    },
    "深钻井": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "落日计划" },
        cost: (s, c) => {
            const base = standardCost({钛:50000, 钢:50000, 核燃料:100000}, 1.02, c, getGlobalCostMultiplier(s));
            const elevatorCount = s.buildings["地心电梯"]?.active || 0;
            const discount = Math.pow(0.95, elevatorCount);
            const price = {};
            for (let r in base) {
                price[r] = Math.floor(base[r] * discount);
            }
            return price;
        },
        produces: {}, consumes: {},caps:{科学:1},
        requiresLocal: {},
        providesLocal:{core_depth:1},
        desc:"向地球中心挖1公里,挖到足够深也许会解锁新技术。在此之前它可以给科学上限提供高达1点的惊人提升。"
    },
    "地心电梯": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "地心电梯" },
        cost: (s, c) => {
            const base = standardCost({钢: 80000,金属板:50000,塑料:20000}, 1.15, c, getGlobalCostMultiplier(s));
            const elevatorCount = s.buildings["等离子电梯"]?.active || 0;
            const discount = Math.pow(0.90, elevatorCount);
            const price = {};
            for (let r in base) {
                price[r] = Math.floor(base[r] * discount);
            }
            return price;
        },
        produces: {}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc: "深入地球的电梯系统，每座可降低深钻井建造成本 5%"
    },
    "地质实验室": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "地壳矿物学" },
        cost: (s, c) => standardCost({金属板:50000, 钛:50000,碳纤维:60000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {科学:0.05,石头:4,铜:0.15,铁:0.08}, consumes: {电力:1.6},caps:{科学:100},
        requiresLocal: {core_depth:2,population:1},
        providesLocal:{},
        modifiers: [{ target: "深钻井", capFactor: 0.12 }],
        desc:"在地壳中的一个实验室，可以产出少量矿物，提高深钻井科学上限。"
    },
    "金刚石压机": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "金刚石压缩" },
        cost: (s, c) => standardCost({塑料:20000, 钛:50000,钢:50000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {金刚石:0.15}, consumes: {电力:4,煤:16},caps:{金刚石:200},
        requiresLocal: {core_depth:2,population:1},
        providesLocal:{},
        desc:"用高压将碳压缩成金刚石。"
    },
    "金刚钻": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "金刚石压缩" },
        cost: (s, c) => standardCost({金刚石:300, 金属板:100000,钢:100000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {铜:1.5,铁:1.5,铝:0.8,铀:2.5}, consumes: {电力:4,核燃料:4,金刚石:0.16},caps:{},
        requiresLocal: {core_depth:1,population:1},
        providesLocal:{},
        desc:"用金刚钻钻探稀有矿物。"
    },
    "地热发电站": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "地热发电" },
        cost: (s, c) => standardCost({金刚石:1000, 铝:250000,钢:250000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {电力:4}, consumes: {金刚石:0.08,铝:4,钢:4},caps:{},
        requiresLocal: {core_depth:1,population:1},
        providesLocal:{},
        desc:"使用地热发电，需要频繁更换部件以维持耐热材料的耐久度。"
    },
    "岩石生物提取器": {
        class: "earth_core", type: "地壳",
        unlockCondition: { tech: "岩石生物" },
        cost: (s, c) => standardCost({金刚石:2000, 钢:250000,碳纤维:250000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {生物质:0.16}, consumes: {石头:16,电力:16},caps:{},
        requiresLocal: {core_depth:1,population:1},
        providesLocal:{},
        desc:"在地壳岩层中提取生物质。"
    },
    "地幔冷却机": {
        class: "earth_core", type: "地幔",
        unlockCondition: { tech: "地幔冷却技术" },   
        cost: (s, c) => standardCost({金刚石: 5000, 生物合金: 3000, 金属板: 20000}, 1.03, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力: 8},  
        caps: {},
        providesLocal: { thermal_capacity: 1 },   
        requiresLocal: { population: 3}, 
        desc: "巨型热交换器阵列，为其他地幔设备提供安全的热环境，同时由于结构复杂，需要多人维护。"
    },
    "地幔熔炼厂": {
        class: "earth_core", type: "地幔",
        unlockCondition: { tech: "高压冶金" },
        cost: (s, c) => standardCost({金刚石: 8000, 钢: 200000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {铝: 1.6, 铁: 0.8, 镍: 0.4}, 
        consumes: {电力: 20},
        caps: {镍: 2000},
        providesLocal: {},
        requiresLocal: { population: 2, core_depth: 1, thermal_capacity:4},
        desc: "悬浮在岩浆中的熔炼舱，直接提取地幔高速矿物汤中的金属。"
    },
    "地幔实验室": {
        class: "earth_core", type: "地幔",
        unlockCondition: { tech: "地幔实验" },
        cost: (s, c) => standardCost({镍:50000, 金刚石:50000,金属板:600000}, 1.15, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {电力:16},caps:{},
        requiresLocal: {population:2,core_depth:1,thermal_capacity:2},
        providesLocal:{},
        modifiers: [{ target: "深钻井", capFactor: 0.25 }],
        desc:"地幔中的一个实验室，能够进一步提升深钻井的科学上限。"
    },
    "等离子电梯": {
        class: "earth_core", type: "地幔",
        unlockCondition: { tech: "等离子电梯" },
        cost: (s, c) => standardCost({等离子体:5000,生物合金: 100000,钢:500000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        desc: "深入地球的等离子电梯系统，每座可降低地心电梯建造成本 10%"
    },
    "镜像帐篷": {
        class: "wormhole", type: "虫洞入口",
        unlockCondition: { tech: "进入虫洞" },
        cost: (s, c) => standardCost({等离子体: 5000}, 1.25, c, getGlobalCostMultiplier(s)),
        produces: {}, consumes: {}, caps: {},
        happiness: (state)=>{
            return 0;
        },
        providesLocal: (state) => {
            let pop = 2;
            return { population: pop };
        },
        requiresLocal: {},
        desc:(state)=>{
            let desc="虫洞中的人的住所，似乎和原版没有什么区别，除了是由等离子体组成的——住在里面稍微热了点。";
            return desc; 
        }
    },
    "镜像伐木场": {
        class: "wormhole", type: "虫洞入口",
        unlockCondition: { tech: "进入虫洞" },
        cost: (s, c) => standardCost({等离子体: 1000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers:[{target:"伐木场",prodFactor:0.03}],
        desc: "几乎完全一样的伐木场。",
        
    },
    "镜像采石场": {
        class: "wormhole", type: "虫洞入口",
        unlockCondition: { tech: "进入虫洞" },
        cost: (s, c) => standardCost({等离子体: 1000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers:[{target:"采石场",prodFactor:0.03}],
        desc: "几乎完全一样的采石场。"
    },
    "镜像图书馆": {
        class: "wormhole", type: "虫洞入口",
        unlockCondition: { tech: "进入虫洞" },
        cost: (s, c) => standardCost({等离子体: 1000}, 1.1, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        modifiers:[{target:"图书馆",capFactor:0.30}],
        desc: "镜像的图书馆，你也许需要一面镜子才能看懂书上的字。"
    },
    "等离子贸易所":{
        class: "wormhole", type: "镜像大陆",
        unlockCondition: { tech: "虫洞贸易" },
        cost: (s, c) => standardCost({金刚石: 100000,镍:100000,生物合金:100000,金:1000000}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {等离子体:0.15},
        consumes: (state)=>{
            selfN=state.buildings["等离子贸易所"]?.active||0;
            return {金:400*(1+0.2*selfN)};
        }, caps: {},
        providesLocal: {},
        requiresLocal: { population: 1 },
        desc: "从虫洞人那里购买等离子体。你同时开启的等离子贸易所越多，单价越贵。"
    },
    "等离子工厂": {
        class: "wormhole", type: "镜像大陆",
        unlockCondition: { tech: "虫洞工厂" },
        cost: (s, c) => standardCost({金属板: 1000000,铝:1000000,建材:1000000,金:1000000}, 1.05, c, getGlobalCostMultiplier(s)),
        produces: {等离子体:0.03},
        consumes: {电力:40,核燃料:15,氚:4}, caps: {},
        providesLocal: {},
        requiresLocal: { population: 2 },
        desc: "你用值钱的地球货说服了虫洞人帮你建立工厂,将廉价的常规能源转换成等离子体。"
    },
    "微型仓库": {
        class: "wormhole", type: "镜像大陆",
        unlockCondition: { tech: "微型存储" },
        cost: (s, c) => standardCost({木头: 2000000,石头:2000000,建材:1000000,铁:1000000,铜:1000000,等离子体:1000}, 1.04, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力:5}, caps: {},
        providesLocal: {},
        requiresLocal: {},
        modifiers:[{target:"比邻星物流中心",capFactor:0.05},{target:"离子收集卫星",capFactor:0.1}],
        desc: "利用高维空间存储货物，这使得仓库三维空间中几乎不占据体积。"
    },
    "高维计算机": {
        class: "wormhole", type: "镜像大陆",
        unlockCondition: { tech: "高维计算" },
        cost: (s, c) => standardCost({钢:1000000,金属板:1000000,金刚石:1000000,镍:1000000,等离子体:100000}, 1.02, c, getGlobalCostMultiplier(s)),
        produces: {},
        consumes: {电力:5}, caps: {科学:10000},
        providesLocal: {},
        requiresLocal: {},
        desc: "在高维空间中进行计算，再将计算结果返回到三维空间。"
    },
};