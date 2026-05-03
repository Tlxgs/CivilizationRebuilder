// tradeEngine.js - 贸易系统，所有数量单位统一为资源数量

const TradeEngine = (function() {
    
    // 获取当前最大单次贸易量（资源数量），基于市场/星际交易站
    function getMaxTradeVolume(state) {
        const marketActive = state.buildings["市场"]?.active || 0;
        const starMarketActive = state.buildings["星际交易站"]?.active || 0;
        // 每个市场提供 50 资源量，每个星际交易站提供 10000 资源量
        return marketActive * 50 + starMarketActive * 10000;
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
    
    // 持续贸易吞吐量上限（资源数量/秒）= 单次贸易量上限的 1%
    function getThroughputLimit(state) {
        return state.maxTradeVolume * 0.01;
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
    
    // 获取资源当前的实际价格系数（含热度）
    function getPriceFactor(state, resource) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 1;
        const heat = res.tradeHeat || 0;
        return Math.exp(heat);
    }
    
    // 获取资源当前的实际价格（黄金/单位资源）
    function getEffectivePrice(state, resource) {
        const res = state.resources[resource];
        return res.value * getPriceFactor(state, resource);
    }
    
    // 计算持续贸易对黄金的流量速率（黄金/秒）
    function getGoldFlowForResource(state, resource, rate) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return 0;
        const effectivePrice = getEffectivePrice(state, resource);
        if (rate > 0) {
            // 进口：消耗黄金
            return -rate * effectivePrice;
        } else {
            // 出口：获得黄金，税率20%
            return -rate * effectivePrice * 0.8;
        }
    }
    
    // 计算受资源/黄金限制后的实际贸易速率（资源数量/秒）
    function computeActualTradeRates(state) {
        const actualRates = {};
        const goldAmount = state.resources["金"]?.amount || 0;
        let expectedGoldFlow = 0;
        for (let r in state.tradeRates) {
            const rate = state.tradeRates[r];
            if (rate === 0) continue;
            expectedGoldFlow += getGoldFlowForResource(state, r, rate);
        }
        // 进口消耗黄金的缩减因子
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
    
    // 单次买卖，volume 为资源数量（正数）
    function performOneTimeTrade(state, resource, type, volume) {
        const res = state.resources[resource];
        if (!res || res.value === undefined) return { success: false, reason: "不可交易" };
        if (volume <= 0) return { success: false, reason: "贸易量必须大于0" };
        
        const maxVolume = state.maxTradeVolume;
        if (maxVolume <= 0) return { success: false, reason: "建筑贸易量上限为0" };
        
        const effectivePrice = getEffectivePrice(state, resource);
        
        if (type === 'buy') {
            const costGold = volume * effectivePrice;
            if ((state.resources["金"]?.amount || 0) < costGold) {
                return { success: false, reason: "黄金不足" };
            }
            state.resources["金"].amount -= costGold;
            res.amount = Math.min(res.cap, res.amount + volume);
            if (res.amount > 0) res.visible = true;
            
            // 热度变化
            let deltaHeat = (volume / maxVolume) * 0.1;
            let newHeat = (res.tradeHeat || 0) + deltaHeat;
            newHeat = Math.min(5, Math.max(-5, newHeat));
            res.tradeHeat = newHeat;
            
            return { success: true, actualVolume: volume, costGold };
            
        } else if (type === 'sell') {
            if (res.amount < volume) {
                return { success: false, reason: `${resource} 不足` };
            }
            const gainGold = volume * effectivePrice * 0.8;
            res.amount -= volume;
            state.resources["金"].amount += gainGold;
            if (state.resources["金"].amount > 0) state.resources["金"].visible = true;
            
            // 热度变化
            let deltaHeat = (volume / maxVolume) * 0.1;
            let newHeat = (res.tradeHeat || 0) - deltaHeat;
            newHeat = Math.min(5, Math.max(-5, newHeat));
            res.tradeHeat = newHeat;
            
            return { success: true, actualVolume: volume, gainGold };
        }
        return { success: false, reason: "无效操作" };
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
            
            const effectivePrice = getEffectivePrice(state, r);
            const tradeValueRate = Math.abs(rate) * effectivePrice * (rate > 0 ? 1 : 0.8);
            let deltaHeatPerSec = (tradeValueRate / maxVolume) * 0.05;
            let deltaHeat = deltaHeatPerSec * deltaSec;
            let newHeat = (res.tradeHeat || 0);
            if (rate > 0) newHeat += deltaHeat;
            else newHeat -= deltaHeat;
            newHeat = Math.min(5, Math.max(-5, newHeat));
            res.tradeHeat = newHeat;
        }
        
        // 热度指数衰减向0
        for (let r in state.resources) {
            const res = state.resources[r];
            if (res.tradeHeat !== undefined && res.tradeHeat !== 0) {
                let decayRate=0.005;
                if (res.decayRate!==undefined){
                    decayRate = res.decayRate;
                }
                res.tradeHeat = res.tradeHeat * Math.pow(1 - decayRate/Math.sqrt(Math.abs(res.tradeHeat)+1), deltaSec);
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
        resetTradeRates
    };
})();

window.TradeEngine = TradeEngine;