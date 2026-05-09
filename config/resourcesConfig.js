const RESOURCES_CONFIG = {
    "电力":       { baseCap: 50 },
    "金":         { baseCap: 50 },
    "科学":       { baseCap: 100 },
    "木头":       { baseCap: 100, value: 1,decayRate:0.005,changeRate:0.1 ,taxRate:0.2},
    "石头":       { baseCap: 100, value: 1,decayRate:0.005 ,changeRate:0.1,taxRate:0.2},
    
    
    "煤":         { baseCap: 100, value: 1.5,decayRate:0.004 ,changeRate:0.1 ,taxRate:0.2},
    "铜":         { baseCap: 50,  value: 3,decayRate:0.003 ,changeRate:0.2,taxRate:0.2},
    "铁":         { baseCap: 50,  value: 3,decayRate:0.003 ,changeRate:0.2 ,taxRate:0.2},
    "铝":         { baseCap: 50,  value: 4,decayRate:0.003 ,changeRate:0.2 ,taxRate:0.2},
    
    "钢":         { baseCap: 50,  value: 8, decayRate:0.003 ,changeRate:0.4  ,taxRate:0.2},
    "钛":         { baseCap: 50,  value: 10, decayRate:0.003 ,changeRate:0.4 ,taxRate:0.2 },
    "建材":       { baseCap: 50,  value: 5, decayRate:0.003 ,changeRate:0.4,taxRate:0.2 },
    "石油":       { baseCap: 50,  value: 4, decayRate:0.003 ,changeRate:0.4 ,taxRate:0.2 },
    "塑料":       { baseCap: 50,  value: 6, decayRate:0.003 ,changeRate:0.4 ,taxRate:0.2 },
    "金属板":     { baseCap: 50,  value: 8,decayRate:0.003  ,changeRate:0.4,taxRate:0.2 },
    "碳纤维":     { baseCap: 50,  value: 12, decayRate:0.002 ,changeRate:1.5 ,taxRate:0.2 },
    "铀":         { baseCap: 50,  value: 10, decayRate:0.002 ,changeRate:1.5,taxRate:0.2},
    "氚":         { baseCap: 50 , value:15,decayRate:0.002,changeRate:1.5,taxRate:0.2},
    "核燃料":     { baseCap: 50,  value: 20, decayRate:0.002 ,changeRate:2.0,taxRate:0.2},
    "生物质":     { baseCap: 100,  value: 100,decayRate:0.001 ,changeRate:10,taxRate:0.2},
    "生物合金":    { baseCap: 100,  value:300,decayRate:0.001,changeRate:20,taxRate:0.2},
    "金刚石":        { baseCap: 100,  value: 500, decayRate:0.001 ,changeRate:30 ,taxRate:0.2 },
    "镍": { baseCap: 100,  value: 50, decayRate:0.0001 ,changeRate:8 ,taxRate:0.2 },
    "政策点":     { baseCap: 100 },
    "军备":       { baseCap: 100 },
    "遗物":       { baseCap: 1000000 },
    "暗能量":     { baseCap: 1000000 },
    "孢子":       { baseCap: 1000000 }, 
    "奇点":       { baseCap: 1000000 }, 
    "时间晶体":   { baseCap: 36000 }
};
window.RESOURCES_CONFIG=RESOURCES_CONFIG;