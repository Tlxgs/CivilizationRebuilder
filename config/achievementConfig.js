// config/achievementConfig.js
const ACHIEVEMENTS_CONFIG = [
  {
    id: "不道德的巅峰",
    name: "不道德的巅峰",
    desc: "打开开发者工具获取。",
    unlockCondition: { type: "none" },  // 无自动条件，手动触发
    effect: {},
    effectText: "你在做什么？",
  },
  {
    id: "低效",
    name: "低效",
    desc: "完成「低效」挑战获取。",
    unlockCondition: { type: "reset", resetType: "any", requireTech: "低效" },
    effect: {},
    effectText: "开局提供初始资源。",
  },
  {
    id: "技术封锁",
    name: "技术封锁",
    desc: "完成「技术封锁」挑战获取。",
    unlockCondition: { type: "reset", resetType: "vacuum", requireTech: "技术封锁" },
    effect: { globalScienceProd: 0.20 },
    effectText: "科学产量+20%",
  },
  {
    id: "资源匮乏",
    name: "资源匮乏",
    desc: "完成「资源匮乏」挑战获取。",
    unlockCondition: { type: "reset", resetType: "any", requireTech: "资源匮乏" },
    effect: { globalCost: -0.02 },
    effectText: "成本增长率-2%",
  },
  {
    id: "冰河时期",
    name: "冰河时期",
    desc: "完成「冰河时期」挑战获取。",
    unlockCondition: { type: "reset", resetType: "vacuum", requireTech: "冰河时期" },
    effect: {},
    effectText: "太阳能板冬天惩罚从-50%变成-33%",
  },
  {
    id: "天花",
    name: "天花",
    desc: "完成「天花」挑战获取。",
    unlockCondition: { type: "reset", resetType: "any", requireTech: "天花" },
    effect: {},
    effectText: "公寓提供人口+0.05"
  },
  {
      id: "五星挑战",
      name: "五星挑战",
      desc: "同时激活至少5个挑战星级并完成重置。",
      unlockCondition: { type: "reset", resetType: "any", minStars: 5 },
      effect: {},                  // 根据需要添加效果
      effectText: "毫不费力",
  }
];
