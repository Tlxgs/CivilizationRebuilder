// config/permanentConfig.js
const PERMANENT_CONFIG = {
    "节约成本I": {
        name: "成本优化·初级",
        price: {遗物: 10},
        desc: "学习更高效的材料利用方法，所有建筑的成本增长率（有时也被叫做成本蠕变，不过这里是乘算而不是减算）降低5%。",
        effect: { costRatio: 0.95 },
        prereq: null
    },
    "节约成本II": {
        name: "成本优化·中级",
        price: {遗物: 30},
        desc: "进一步优化装配流程，成本增长率再降5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本I"]
    },
    "节约成本III": {
        name: "成本优化·高级",
        price: {遗物: 100},
        desc: "采用模块化设计，建筑扩建时材料浪费更少，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本II"]
    },
    "节约成本IV": {
        name: "成本优化·专家",
        price: {遗物: 200},
        desc: "供应链管理和批量采购，成本增长率额外降低5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本III"]
    },
    "节约成本V": {
        name: "黄金分割",
        price: {遗物: 618},
        desc: "利用黄金分割比建造建筑实现优化，同时这个名字也是对神作的致敬",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本IV"]
    },
    "节约成本VI": {
        name: "虚空铸造·初阶",
        price: {遗物: 1000, 暗能量: 10},
        desc: "利用暗能量扭曲局部时空，使建造所需物质减少，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本V"]
    },
    "节约成本VII": {
        name: "维度折叠·中阶",
        price: {遗物: 1500, 暗能量: 20},
        desc: "维度折叠技术，让原料体积压缩，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本VI"]
    },
    "节约成本VIII": {
        name: "反物质催化·高阶",
        price: {遗物: 2000, 暗能量: 40},
        desc: "反物质催化建造，原子级重组，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本VII"]
    },
    "节约成本IX": {
        name: "虚空造物·大师",
        price: {遗物: 2500, 暗能量: 80},
        desc: "虚空造物技术，从真空中借取能量，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本VIII"]
    },
    "节约成本X": {
        name: "因果重塑",
        price: {遗物: 3000, 暗能量: 160},
        desc: "因果律修改，让建筑所需资源在历史中就不存在，成本增长率-5%。",
        effect: { costRatio: 0.95 },
        prereq: ["节约成本IX"]
    },

    "高效生产I": {
        name: "精益思维·入门",
        price: {遗物: 10},
        desc: "改善生产线的润滑和维护，所有建筑产量（不增加消耗）提升5%。",
        effect: { globalProd: 0.05 },
        prereq: null
    },
    "高效生产II": {
        name: "泰勒管理法",
        price: {遗物: 20},
        desc: "学习泰勒科学管理法，产量再+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产I"]
    },
    "高效生产III": {
        name: "统计过程控制",
        price: {遗物: 40},
        desc: "引入统计过程控制，减少次品率，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产II"]
    },
    "高效生产IV": {
        name: "全自动生产线",
        price: {遗物: 60},
        desc: "全面自动化改造，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产III"]
    },
    "高效生产V": {
        name: "AI调度大师",
        price: {遗物: 80},
        desc: "开发专用AI调度软件，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产IV"]
    },
    "高效生产VI": {
        name: "纳米润滑涂层",
        price: {遗物: 100},
        desc: "纳米涂层降低摩擦，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产V"]
    },
    "高效生产VII": {
        name: "量子催化反应",
        price: {遗物: 150},
        desc: "利用量子隧穿效应优化化学反应，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产VI"]
    },
    "高效生产VIII": {
        name: "自修复材料",
        price: {遗物: 300},
        desc: "自修复材料让机器永不停机，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产VII"]
    },
    "高效生产IX": {
        name: "黑洞时间膨胀",
        price: {遗物: 6000},
        desc: "将工厂建在黑洞视界边缘，利用引力时间膨胀加速生产，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产VIII"]
    },
    "高效生产X": {
        name: "因果逆流装置",
        price: {遗物: 1000},
        desc: "因果逆流装置，让产品在制造之前就已存在，产量+5%。",
        effect: { globalProd: 0.05 },
        prereq: ["高效生产IX"]
    },

    "高速生产I": {
        name: "加速传动·初",
        price: {遗物: 5},
        desc: "提高传送带速度，所有建筑生产速度+10%（消耗同步增加）。",
        effect: { globalSpeed: 0.10 },
        prereq: null
    },
    "高速生产II": {
        name: "超频电机",
        price: {遗物: 10},
        desc: "超频电机，速度再+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产I"]
    },
    "高速生产III": {
        name: "多线程并行",
        price: {遗物: 15},
        desc: "多线程并行处理，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产II"]
    },
    "高速生产IV": {
        name: "光速数据总线",
        price: {遗物: 20},
        desc: "光速数据总线，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产III"]
    },
    "高速生产V": {
        name: "分子级装配",
        price: {遗物: 30},
        desc: "分子级装配，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产IV"]
    },
    "高速生产VI": {
        name: "时间感知场",
        price: {遗物: 50},
        desc: "时间感知加速场，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产V"]
    },
    "高速生产VII": {
        name: "超光速通信",
        price: {遗物: 80},
        desc: "超光速通信控制，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产VI"]
    },
    "高速生产VIII": {
        name: "量子并行加工",
        price: {遗物: 120},
        desc: "量子并行加工，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产VII"]
    },
    "高速生产IX": {
        name: "平行宇宙副本",
        price: {遗物: 200},
        desc: "建造平行宇宙副本同步生产，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产VIII"]
    },
    "高速生产X": {
        name: "时间领主",
        price: {遗物: 300},
        desc: "成为时间领主，直接让生产线进入时间循环，速度+10%。",
        effect: { globalSpeed: 0.10 },
        prereq: ["高速生产IX"]
    },

    "空间压缩I": {
        name: "空间折叠·入门",
        price: {遗物: 5},
        desc: "轻微扭曲存储区域的空间，每个遗物使储存类建筑上限提升0.1%（科学除外）。",
        effect: { capPerRelic: 0.001 },
        prereq: null
    },
    "空间压缩II": {
        name: "四维堆叠",
        price: {遗物: 20},
        desc: "采用四维堆叠，效果再+0.1%/遗物。",
        effect: { capPerRelic: 0.001 },
        prereq: ["空间压缩I"]
    },
    "空间压缩III": {
        name: "口袋空间",
        price: {遗物: 100},
        desc: "口袋空间技术，每个遗物提升0.1%储存上限。",
        effect: { capPerRelic: 0.001 },
        prereq: ["空间压缩II"]
    },
    "空间压缩IV": {
        name: "维度折叠仓库",
        price: {遗物: 200},
        desc: "维度折叠仓库，每遗物+0.1%。",
        effect: { capPerRelic: 0.001 },
        prereq: ["空间压缩III"]
    },
    "空间压缩V": {
        name: "微型奇点",
        price: {遗物: 400},
        desc: "将储存区转移到微型奇点中，每遗物+0.1%容量。",
        effect: { capPerRelic: 0.001 },
        prereq: ["空间压缩IV"]
    },

    "技术爆炸": {
        name: "遗物启示录",
        price: {遗物: 50},
        desc: "从遗物中解析出零散公式，每持有1个遗物都提升少量科学上限（收益递减）。",
        effect: { sciCapPerRelicLog: 0.04 },
        prereq: null
    },
    "宇宙学": {
        name: "暗能量译码",
        price: {遗物: 50, 暗能量: 1},
        desc: "研究暗能量与宇宙膨胀的关系，所有太空建筑产量+10%（不增消耗）。",
        effect: { globalSpaceProd: 0.10 },
        prereq: null
    },
    "宇宙起源": {
        name: "原初之火",
        price: {遗物: 500, 暗能量: 100},
        desc: "模拟宇宙大爆炸初期条件，太空建筑产量再+20%。",
        effect: { globalSpaceProd: 0.20 },
        prereq: null
    }
};

// 确保每个条目都有 name（兼容旧数据）
for (let key in PERMANENT_CONFIG) {
    if (!PERMANENT_CONFIG[key].name) {
        PERMANENT_CONFIG[key].name = key;
    }
}