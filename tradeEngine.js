// tradeEngine.js - 贸易系统，所有数量单位统一为资源数量

const TradeEngine = (function() {
    
    // 获取当前最大单次贸易量（资源数量），基于市场/星际交易站
    function getMaxTradeVolume(state) {
        const marketActive = state.buildings["市场"]?.count || 0;
        const starMarketActive = state.buildings["星际交易站"]?.count || 0;
        const aMarketActive = state.buildings["比邻星物流中心"]?.count || 0 ;
        let maxVolume=marketActive * 50 + starMarketActive * 10000 + aMarketActive*25000;
        if (state.permanent["贸易III"]?.researched){
            maxVolume=maxVolume*1.5;
        }
        return maxVolume;
    }
    
    function updateMaxTradeVolume(state) {
        const newMax = getMaxTradeVolume(state);
        state.maxTradeVolume = newMax;
        if (state.userTradeVolume === undefined || state.userTradeVolume > newMax) {
            state.userTradeVolume = newMax;
        }
        if (state.userTradeVolume <= 0) state.userTradeVolume = newMax;
        return newMax;
    }
    
    function getThroughputLimit(state) {
        let rate=0.01;
        if (state.permanent["贸易I"]?.researched){rate=0.015;}
        if (state.permanent["贸易II"]?.researched){rate=0.020;}
        return state.maxTradeVolume * rate;
    }
    
    function getTotalTradeRateAbs(state) {
        let total = 0;
        for (let r in state.tradeRates) {
            total += Math.abs(state.tradeRates[r] || 0);
        }
        return total;
    }
    
    function setTradeRate(state, resource, rate) {
        const limit = getThroughputLimit(state);
        const currentTotal = getTotalTradeRateAbs(state);
        const oldRate = state.tradeRates[resource] || 0;
        const currentWithoutOld = currentTotal - Math.abs(oldRate);
        
        let newRate = rate;
        let newAbs = Math.abs(newRate);
        let remainingCapacity = limit - currentWithoutOld;
        if (remainingCapacity < 0) remainingCapacity = 0;
        
        if (newAbs > remainingCapacity) {
            if (remainingCapacity === 0) {
                newRate = 0;
            } else {
                newRate = (newRate > 0 ? remainingCapacity : -remainingCapacity);
            }
        }
        state.tradeRates[resource] = newRate;
        return { success: true, actualRate: newRate, wasClipped: (Math.abs(newRate) !== Math.abs(rate)) };
    }
    
    function getPriceFactor(state, resource) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 1;
        const heat = res.tradeHeat || 0;
        return Math.exp(heat);
    }
    
    function getEffectivePrice(state, resource) {
        const res = state.resources[resource];
        return res.value * getPriceFactor(state, resource);
    }
    
    function getGoldFlowForResource(state, resource, rate) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 0;
        const effectivePrice = getEffectivePrice(state, resource);
        if (rate > 0) {
            return -rate * effectivePrice;
        } else {
            let taxRate = res.taxRate ?? 0.2;
            return -rate * effectivePrice * (1 - taxRate);
        }
    }
    
    function computeActualTradeRates(state) {
        const actualRates = {};
        const goldAmount = state.resources["金"]?.amount || 0;
        let expectedGoldFlow = 0;
        for (let r in state.tradeRates) {
            const rate = state.tradeRates[r];
            if (rate === 0) continue;
            expectedGoldFlow += getGoldFlowForResource(state, r, rate);
        }
        let importScale = 1.0;
        if (expectedGoldFlow < 0 && -expectedGoldFlow > goldAmount + 0.001) {
            importScale = (goldAmount + 0.001) / (-expectedGoldFlow);
            importScale = Math.min(1.0, Math.max(0, importScale));
        }
        for (let r in state.tradeRates) {
            let rate = state.tradeRates[r];
            if (rate === 0) {
                actualRates[r] = 0;
                continue;
            }
            let actualRate = rate;
            if (rate > 0) {
                actualRate = rate * importScale;
            } else if (rate < 0) {
                const amount = state.resources[r]?.amount || 0;
                const maxExport = Math.max(0, amount);
                if (-actualRate > maxExport + 0.001) actualRate = -maxExport;
            }
            actualRates[r] = actualRate;
        }
        return actualRates;
    }
    
    // ========== 市场深度积分函数（已修正出售公式） ==========
    // 购买价格随购买量指数上升：P(q) = basePrice * e^{k q}
    function computeBuyCost(state, resource, volume) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return Infinity;
        const basePrice = res.value;
        const H0 = res.tradeHeat || 0;
        const maxVol = state.maxTradeVolume;
        if (maxVol <= 0) return Infinity;
        const changeRate = res.changeRate ?? 0.1;
        const k = changeRate / maxVol;
        const priceFactor0 = Math.exp(H0);
        
        if (Math.abs(k) < 1e-8) {
            return basePrice * priceFactor0 * volume;
        } else {
            return basePrice * priceFactor0 * (Math.exp(k * volume) - 1) / k;
        }
    }
    
    // 出售价格随出售量指数下降：P(q) = basePrice * e^{-k q}
    function computeSellGain(state, resource, volume) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 0;
        const taxRate = res.taxRate ?? 0.2;
        const V = res.value;
        const H = res.tradeHeat || 0;
        const basePrice = V * Math.exp(H);
        const maxVol = state.maxTradeVolume;
        if (maxVol <= 0) return 0;
        const changeRate = res.changeRate ?? 0.1;
        const k = changeRate / maxVol;
        
        if (Math.abs(k) < 1e-9) {
            return basePrice * volume * (1 - taxRate);
        } else {
            const beforeTax = basePrice * (1 - Math.exp(-k * volume)) / k;
            return beforeTax * (1 - taxRate);
        }
    }
    
    // 解析法求最大购买量（受黄金、容量、上限、期望量限制）
    function getMaxBuyableVolume(state, resource, desiredVolume) {
        const res = state.resources[resource];
        const gold = state.resources["金"];
        if (!res || !gold) return 0;
        
        const maxVolLimit = state.maxTradeVolume;
        const remainingCap = Math.max(0, res.cap - res.amount);
        const goldAmount = gold.amount;
        
        const V = res.value;
        const H = res.tradeHeat || 0;
        const basePrice = V * Math.exp(H);
        const changeRate = res.changeRate ?? 0.1;
        const k = changeRate / state.maxTradeVolume;
        
        let Q_by_gold;
        if (Math.abs(k) < 1e-9) {
            Q_by_gold = goldAmount / basePrice;
        } else {
            const temp = goldAmount * k / basePrice;
            if (temp <= -1) {
                Q_by_gold = 0;
            } else {
                Q_by_gold = Math.log(1 + temp) / k;
            }
        }
        
        let actual = Math.min(desiredVolume, Q_by_gold, remainingCap, maxVolLimit);
        return Math.max(0, actual);
    }
    
    // 解析法求最大出售量（受资源存量、黄金容量、上限、期望量限制）
    function getMaxSellableVolume(state, resource, desiredVolume) {
        const res = state.resources[resource];
        const gold = state.resources["金"];
        if (!res || !gold) return 0;
        
        const maxVolLimit = state.maxTradeVolume;
        const resourceAmount = res.amount;
        const goldRemainingCap = Math.max(0, gold.cap - gold.amount);
        const taxRate = res.taxRate ?? 0.2;
        
        const V = res.value;
        const H = res.tradeHeat || 0;
        const basePrice = V * Math.exp(H);
        const changeRate = res.changeRate ?? 0.1;
        const k = changeRate / state.maxTradeVolume;
        
        let Q_by_goldCap;
        if (Math.abs(k) < 1e-9) {
            Q_by_goldCap = goldRemainingCap / (basePrice * (1 - taxRate));
        } else {
            // 税前收益公式：Gain_before_tax = basePrice * (1 - e^{-kQ}) / k
            // 反解：1 - e^{-kQ} = Gain * k / basePrice
            //   => e^{-kQ} = 1 - Gain * k / basePrice
            const temp = goldRemainingCap * k / (basePrice * (1 - taxRate));
            if (temp >= 1) {
                Q_by_goldCap = Infinity;  // 黄金容量无限制时，可无限卖（但受资源存量限制）
            } else if (temp <= -1e-9) {
                Q_by_goldCap = 0;
            } else {
                Q_by_goldCap = -Math.log(1 - temp) / k;
            }
        }
        
        let actual = Math.min(desiredVolume, Q_by_goldCap, resourceAmount, maxVolLimit);
        return Math.max(0, actual);
    }
    
    // 单次交易（自动确定实际交易量并采用积分结算）
    function performOneTimeTrade(state, resource, type, desiredVolume) {
        const res = state.resources[resource];
        const gold = state.resources["金"];
        if (!res || res.value === undefined) {
            return { success: false, reason: "不可交易资源" };
        }
        if (desiredVolume <= 0) {
            return { success: false, reason: "贸易量必须大于0" };
        }
        
        const maxVolume = state.maxTradeVolume;
        if (maxVolume <= 0) {
            return { success: false, reason: "建筑贸易量上限为0" };
        }
        
        let actualVolume;
        if (type === 'buy') {
            actualVolume = getMaxBuyableVolume(state, resource, desiredVolume);
            if (actualVolume <= 0) {
                return { success: false, reason: "黄金不足或资源容量已满" };
            }
            const costGold = computeBuyCost(state, resource, actualVolume);
            ResourcesManager.consume({"金":costGold});
            ResourcesManager.add({[resource]:actualVolume});
            
            // 热度上升（买入使价格变贵）
            const H0 = res.tradeHeat || 0;
            const deltaHeat = (actualVolume / maxVolume) * (res.changeRate || 0.1);
            res.tradeHeat = Math.min(10, Math.max(-10, H0 + deltaHeat));
            
            return { success: true, actualVolume, costGold };
            
        } else if (type === 'sell') {
            actualVolume = getMaxSellableVolume(state, resource, desiredVolume);
            if (actualVolume <= 0) {
                return { success: false, reason: `${resource} 不足或黄金容量不足` };
            }
            const gainGold = computeSellGain(state, resource, actualVolume);
            
            res.amount -= actualVolume;
            gold.amount += gainGold;
            if (gold.amount > 0) gold.visible = true;
            
            // 热度下降（卖出使价格变便宜）
            const H0 = res.tradeHeat || 0;
            const deltaHeat = (actualVolume / maxVolume) * (res.changeRate || 0.1);
            res.tradeHeat = Math.min(10, Math.max(-10, H0 - deltaHeat));
            
            return { success: true, actualVolume, gainGold };
        }
        
        return { success: false, reason: "无效操作类型" };
    }
    
    // 热度更新（每 tick 调用）
    function updateHeat(deltaSec, state) {
        if (deltaSec <= 0) return;
        const actualRates = computeActualTradeRates(state);
        const maxVolume = state.maxTradeVolume;
        if (maxVolume <= 0) return;
        
        for (let r in actualRates) {
            const rate = actualRates[r];
            if (rate === 0) continue;
            const res = state.resources[r];
            if (!res || res.value === undefined) continue;
            
            let changeRate = (res.changeRate || 0.1) * 0.8;
            let deltaHeatPerSec = (Math.abs(rate) / maxVolume) * changeRate;
            let deltaHeat = deltaHeatPerSec * deltaSec;
            let newHeat = (res.tradeHeat || 0);
            if (rate > 0) newHeat += deltaHeat;
            else newHeat -= deltaHeat;
            newHeat = Math.min(10, Math.max(-10, newHeat));
            res.tradeHeat = newHeat;
        }
        
        // 热度自然衰减
        for (let r in state.resources) {
            const res = state.resources[r];
            if (res.tradeHeat !== undefined && res.tradeHeat !== 0) {
                let decayRate = 0.005;
                if (res.decayRate !== undefined) {
                    decayRate = res.decayRate;
                }
                res.tradeHeat = res.tradeHeat * Math.pow(1 - decayRate / Math.sqrt(Math.abs(res.tradeHeat) + 1), deltaSec);
                if (Math.abs(res.tradeHeat) < 1e-8) res.tradeHeat = 0;
            }
        }
    }
    
    function resetTradeRates(state) {
        for (let r in state.tradeRates) {
            state.tradeRates[r] = 0;
        }
        state.userTradeVolume = state.maxTradeVolume;
        for (let r in state.resources) {
            if (state.resources[r].tradeHeat !== undefined) state.resources[r].tradeHeat = 0;
        }
    }
    /**
     * 计算持续贸易下的理论稳态价格（不考虑资源上限和黄金限制）
     * @param {Object} state - GameState
     * @param {string} resource - 资源名
     * @param {number} tradeRate - 用户设定的持续贸易速率（正=进口，负=出口）
     * @returns {number} 稳态价格（若 tradeRate=0 则返回基准价）
     */
    function computeSteadyPrice(state, resource, tradeRate) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 0;
        if (Math.abs(tradeRate) < 1e-9) return res.value;

        const M = state.maxTradeVolume;
        if (M <= 0) return res.value;

        const c = res.changeRate ?? 0.1;
        const d = res.decayRate ?? 0.005;
        const V = res.value;
        const qAbs = Math.abs(tradeRate);
        const a = (qAbs * c) / M;

        // 解方程 a = d * x / sqrt(x+1)  =>  d^2 x^2 - a^2 x - a^2 = 0
        const d2 = d * d;
        const a2 = a * a;
        const discriminant = a2 * a2 + 4 * d2 * a2;
        const x = (a2 + Math.sqrt(discriminant)) / (2 * d2);
        const H = (tradeRate > 0 ? x : -x);
        return V * Math.exp(H);
    }
    return {
        getMaxTradeVolume,
        updateMaxTradeVolume,
        getThroughputLimit,
        getTotalTradeRateAbs,
        setTradeRate,
        getPriceFactor,
        getEffectivePrice,
        getGoldFlowForResource,
        computeActualTradeRates,
        performOneTimeTrade,
        updateHeat,
        resetTradeRates,
        computeBuyCost,
        computeSellGain,
        getMaxBuyableVolume,
        getMaxSellableVolume,
        computeSteadyPrice
    };
})();

window.TradeEngine = TradeEngine;