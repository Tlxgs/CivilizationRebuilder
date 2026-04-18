// 格式化数字
function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return "0";
    if (n === Infinity) return "∞";
    if (n < 1e3) return n.toFixed(2);
    if (n < 1e6) return (n/1e3).toFixed(2) + "K";
    if (n < 1e9) return (n/1e6).toFixed(2) + "M";
    if (n < 1e12) return (n/1e9).toFixed(2) + "B";
    return (n/1e12).toFixed(2) + "T";
}

// 获取永久科技加成系数
function getPermanentMultipliers() {
    const perm = GameState.permanent;
    const relic = GameState.resources["遗物"]?.amount || 0;
    let costRatio = 1.0;
    let globalProd = 0;
    let globalSpeed = 0;
    let globalSpaceProd = 0; 
    let capPerRelic = 0;
    let sciCapPerRelicLog = 0;

    for (let key in perm) {
        const p = perm[key];
        if (!p.researched) continue;
        const eff = p.effect || {};
        if (eff.costRatio) costRatio *= eff.costRatio;
        if (eff.globalProd) globalProd += eff.globalProd;
        if (eff.globalSpeed) globalSpeed += eff.globalSpeed;
        if (eff.globalSpaceProd) globalSpaceProd += eff.globalSpaceProd;
        if (eff.capPerRelic) capPerRelic += eff.capPerRelic;
        if (eff.sciCapPerRelicLog) sciCapPerRelicLog += eff.sciCapPerRelicLog;
    }
    return {
        costRatio: costRatio,
        prodRatio: 1 + globalProd,
        speedRatio: 1 + globalSpeed,
        spaceProdRatio: 1 + globalSpaceProd,
        capRatio: 1 + relic * capPerRelic,
        sciCapRatio: 1 + Math.log(1 + relic) * sciCapPerRelicLog,
        prodPercent: globalProd * 100,
        speedPercent: globalSpeed * 100
    };
}


// 更新升级价格
function updateUpgradePrices() {
    const mult = getPermanentMultipliers().costRatio;
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        up.price = {};
        for (let r in up.basePrice) {
            const growth = 1 + (up.growth - 1) * mult;
            up.price[r] = Math.floor(up.basePrice[r] * Math.pow(growth, up.level));
        }
    }
}

// 获取科技对建筑产出的绝对数值加成
function getTechProdBonusForBuilding(buildingKey) {
    let bonus = {};
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (!tech.researched || !tech.effect) continue;
        const eff = tech.effect[buildingKey];
        if (eff && eff.prod) {
            for (let r in eff.prod) {
                bonus[r] = (bonus[r] || 0) + eff.prod[r];
            }
        }
    }
    return bonus;
}

// 获取科技对建筑上限的绝对数值加成
function getTechCapBonusForBuilding(buildingKey) {
    let bonus = {};
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (!tech.researched || !tech.effect) continue;
        const eff = tech.effect[buildingKey];
        if (eff && eff.cap) {
            for (let r in eff.cap) {
                bonus[r] = (bonus[r] || 0) + eff.cap[r];
            }
        }
    }
    return bonus;
}

// ==================== 加成聚合工具函数（重构版） ====================
// 获取某个建筑的综合加成因子
// 返回：prodFactor, consFactor, 以及一个根据资源名返回最终上限因子的函数
function getBuildingMultipliers(buildingKey) {
    const mult = getPermanentMultipliers(); // 永恒全局加成（产量、消耗等，不包含上限）
    const relicAmount = GameState.resources["遗物"]?.amount || 0;

    // 1. 科技加成（累加）
    let techProdBonus = 0;
    let techConsBonus = 0;
    let techCapBonus = 0;
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (!tech.researched || !tech.effect) continue;
        const eff = tech.effect[buildingKey];
        if (eff) {
            if (eff.prodFactor) techProdBonus += eff.prodFactor;
            if (eff.consFactor) techConsBonus += eff.consFactor;
            if (eff.capFactor) techCapBonus += eff.capFactor;
        }
    }

    // 2. 升级加成（累加）
    let upgradeBonus = 0;
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (up.level > 0 && up.effect[buildingKey]) {
            upgradeBonus += up.effect[buildingKey] * up.level;
        }
    }

    // 3. 政策加成（累加）
    let policyProdBonus = 0;
    let policyConsBonus = 0;
    let policyCapBonus = 0;
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        if (!pol.visible) continue;
        const opt = pol.options[pol.activePolicy];
        if (opt.prodFactor && opt.prodFactor[buildingKey]) policyProdBonus += opt.prodFactor[buildingKey];
        if (opt.consFactor && opt.consFactor[buildingKey]) policyConsBonus += opt.consFactor[buildingKey];
        if (opt.capFactor && opt.capFactor[buildingKey]) policyCapBonus += opt.capFactor[buildingKey];
    }

    // 4. 建筑加成（累加）
    let buildingProdBonus = 0;
    let buildingConsBonus = 0;
    let buildingCapBonus = 0;
    for (let b in GameState.buildings) {
        const bld = GameState.buildings[b];
        if (!bld.modifiers || bld.active === 0) continue;
        for (let mod of bld.modifiers) {
            if (mod.target === buildingKey) {
                if (mod.prodFactor) buildingProdBonus += mod.prodFactor * bld.active;
                if (mod.consFactor) buildingConsBonus += mod.consFactor * bld.active;
                if (mod.capFactor) buildingCapBonus += mod.capFactor * bld.active;
            }
        }
    }

    // 5. 各乘区独立相乘（产量、消耗）
    let prodFactor = (1 + techProdBonus)
                     * (1 + upgradeBonus)
                     * (1 + policyProdBonus)
                     * (1 + buildingProdBonus)
                     * mult.prodRatio;

    const consFactor = (1 + techConsBonus)
                     * (1 + upgradeBonus)      // 升级同时影响消耗
                     * (1 + policyConsBonus)
                     * (1 + buildingConsBonus)
                     * mult.speedRatio;

    // 6. 基础上限乘区（不包括永久上限，永久上限在 getCapFactor 中根据资源类型动态乘）
    const baseCapFactor = (1 + techCapBonus)
                        * (1 + upgradeBonus)
                        * (1 + policyCapBonus)
                        * (1 + buildingCapBonus);

    // 太空建筑额外产量乘区（仅产量）
    const buildingType = GameState.buildings[buildingKey]?.type;
    if (buildingType === "太空") {
        prodFactor *= mult.spaceProdRatio;
    }

    // 返回一个包含 getCapFactor 函数的对象
    return {
        prodFactor,
        consFactor,
        getCapFactor: (resourceName) => {
            // 根据资源类型获取永久上限加成
            let permanentCapFactor = 1;
            if (resourceName === "科学") {
                permanentCapFactor = mult.sciCapRatio;
            } else {
                permanentCapFactor = mult.capRatio;
            }
            // 最终上限因子 = 基础上限乘区 × 永久上限加成
            return baseCapFactor * permanentCapFactor;
        }
    };
}

// 计算所有资源的产量和上限
function computeProductionAndCaps() {
    const res = GameState.resources;
    const blds = GameState.buildings;
    // 计算幸福度（累加所有建筑的 happinessEffect * 激活数量，博物馆动态计算）
    let totalHappiness = 100; // 基础100%
    const relicAmount = GameState.resources["遗物"]?.amount || 0;   // 获取当前遗物数量
    
    for (let bKey in blds) {
        const b = blds[bKey];
        if (b.active <= 0) continue;
        
        // 博物馆特殊处理：动态加成
        if (bKey === "博物馆") {
            const perMuseumBonus =  0.1 * Math.log(2.72**5 + relicAmount);
            totalHappiness += perMuseumBonus * b.active;
        } 
        // 其他建筑使用固定的 happinessEffect
        else if (b.happinessEffect && b.happinessEffect !== 0) {
            totalHappiness += b.happinessEffect * b.active;
        }
    }
    GameState.happiness = Math.max(0, totalHappiness); // 不低于0
    // 1. 重置所有资源的生产和上限
    for (let r in res) {
        res[r].production = 0;
        res[r].cap = res[r].baseCap;
    }

    // 2. 遍历所有建筑
    for (let bKey in blds) {
        const b = blds[bKey];
        if (b.count === 0) continue;

        const factors = getBuildingMultipliers(bKey);
        const activeCount = b.active;

        // 处理产出：乘入幸福度因子
        const happinessFactor = GameState.happiness / 100;
        const activeEvent = GameState.activeRandomEvent;
        for (let r in b.baseProduce) {
            const baseVal = b.baseProduce[r];
            let eventMul = (activeEvent && activeEvent.effects[r]) ? activeEvent.effects[r] : 1;
            const total = baseVal * activeCount * factors.prodFactor * happinessFactor * eventMul;
            res[r].production += total;
        }

        // 处理消耗（负资源）
        for (let r in b.baseConsume) {
            const baseVal = b.baseConsume[r];
            const total = baseVal * activeCount * factors.consFactor;
            res[r].production -= total;
        }

        // 处理上限提供（现在完全使用 factors.getCapFactor）
        for (let r in b.capProvide) {
            const baseCap = b.capProvide[r];
            const totalCap = baseCap * activeCount * factors.getCapFactor(r);
            res[r].cap += totalCap;
        }
    }
}

// 获取建筑详细统计（用于悬浮提示）
function getBuildingStats(buildingKey) {
    const b = GameState.buildings[buildingKey];
    if (!b) return null;

    const factors = getBuildingMultipliers(buildingKey);
    const activeCount = b.active;

    // 收集各来源加成（用于展示）
    const breakdown = {
        techProd: 0, techCons: 0, techCap: 0,
        upgrade: 0,
        policyProd: 0, policyCons: 0, policyCap: 0,
        buildingProd: 0, buildingCons: 0, buildingCap: 0,
        eternalProd: getPermanentMultipliers().prodRatio - 1,
        eternalCons: getPermanentMultipliers().speedRatio - 1,
        eternalCap: 0
    };

    // 计算建筑加成的具体数值（用于 breakdown）
    for (let bld in GameState.buildings) {
        const srcBld = GameState.buildings[bld];
        if (!srcBld.modifiers || srcBld.active === 0) continue;
        for (let mod of srcBld.modifiers) {
            if (mod.target === buildingKey) {
                if (mod.prodFactor) breakdown.buildingProd += mod.prodFactor * srcBld.active;
                if (mod.consFactor) breakdown.buildingCons += mod.consFactor * srcBld.active;
                if (mod.capFactor) breakdown.buildingCap += mod.capFactor * srcBld.active;
            }
        }
    }

    const details = [];
    // 产出项
    const happinessFactor = GameState.happiness/100
    for (let r in b.baseProduce) {
        const base = b.baseProduce[r];
        const perBuilding = base * factors.prodFactor*happinessFactor;
        const total = perBuilding * activeCount;
        details.push({
            resource: r,
            type: 'prod',
            base,
            perBuilding,
            total,
            factor: factors.prodFactor,
            breakdown: { ...breakdown }
        });
    }
    // 消耗项
    for (let r in b.baseConsume) {
        const base = b.baseConsume[r];
        const perBuilding = base * factors.consFactor;
        const total = perBuilding * activeCount;
        details.push({
            resource: r,
            type: 'cons',
            base,
            perBuilding,
            total,
            factor: factors.consFactor,
            breakdown: { ...breakdown }
        });
    }
    for (let r in b.capProvide) {
        const base = b.capProvide[r];
        const capFactor = factors.getCapFactor(r);
        const perBuilding = base * capFactor;
        const total = perBuilding * activeCount;
        details.push({
            resource: r,
            type: 'cap',
            base,
            perBuilding,
            total,
            factor: capFactor,
            breakdown: { ...breakdown }
        });
    }

    return { details, activeCount };
}

function updateBuildingPrices() {
    const mult = getPermanentMultipliers().costRatio;
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        bd.price = {};
        for (let r in bd.basePrice) {
            const growth = 1 + (bd.costGrowth - 1) * mult;
            bd.price[r] = Math.floor(bd.basePrice[r] * Math.pow(growth, bd.count));
        }
    }
}
// 热度衰减
function updateHeatDecay(deltaSec) {
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (res.hasOwnProperty('heat') && res.heat !== undefined) {
            let decay = res.heat * 0.001 * deltaSec;
            if (res.heat > 1) {
                res.heat = Math.max(1, res.heat - decay);
            } else if (res.heat < 1) {
                res.heat = Math.min(1, res.heat + decay);
            }
            res.heat = Math.min(100, Math.max(0.01, res.heat));
        }
    }
}
function tickResources(deltaSec = 0.2) {
    computeProductionAndCaps();
    
    // 检查资源枯竭并停用相关建筑
    let needRecompute = false;
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        // 数量为0（或接近0）且净产量为负
        if (res.amount <= 0.00001 && res.production < -0.00001) {
            // 停用所有消耗该资源的建筑
            for (let bKey in GameState.buildings) {
                const b = GameState.buildings[bKey];
                if (b.active > 0 && b.baseConsume && b.baseConsume[r] && b.baseConsume[r] > 0) {
                    b.active = 0;
                    needRecompute = true;
                }
            }

        }
    }
    if (needRecompute) {
        computeProductionAndCaps(); // 重新计算产量
        // 刷新界面，让玩家看到建筑激活数量变为0
        if (typeof window.renderAll === 'function') {
            window.renderAll();
        }
    }
    
    // 更新资源数量
    for (let r in GameState.resources) {
        let prod = GameState.resources[r].production;
        let newAmount = GameState.resources[r].amount + prod * deltaSec;
        GameState.resources[r].amount = Math.min(GameState.resources[r].cap, Math.max(0, newAmount));
        if (GameState.resources[r].amount > 0.01) GameState.resources[r].visible = true;
    }
    
    updateHeatDecay(deltaSec);
}
// 获取当前核弹重置可获得的遗物数量（考虑粒子加速器加成）
function getRelicGain() {
    const scienceCap = GameState.resources["科学"].cap;
    let baseGain = Math.floor(Math.log(scienceCap) ** 2);
    // 粒子加速器：每个（无论激活）增加2%遗物获取
    const accelerator = GameState.buildings["粒子加速器"];
    const acceleratorCount = accelerator ? accelerator.count : 0;
    const multiplier = 1 + acceleratorCount * 0.02;
    return Math.floor(baseGain * multiplier);
}