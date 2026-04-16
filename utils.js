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
    let capPerRelic = 0;
    let sciCapPerRelicLog = 0;

    for (let key in perm) {
        const p = perm[key];
        if (!p.researched) continue;
        const eff = p.effect || {};
        if (eff.costRatio) costRatio *= eff.costRatio;
        if (eff.globalProd) globalProd += eff.globalProd;
        if (eff.globalSpeed) globalSpeed += eff.globalSpeed;
        if (eff.capPerRelic) capPerRelic += eff.capPerRelic;
        if (eff.sciCapPerRelicLog) sciCapPerRelicLog += eff.sciCapPerRelicLog;
    }
    return {
        costRatio: costRatio,
        prodRatio: 1 + globalProd,
        speedRatio: 1 + globalSpeed,
        capRatio: 1 + relic * capPerRelic,
        sciCapRatio: 1 + Math.log(1 + relic) * sciCapPerRelicLog,
        prodPercent: globalProd * 100,
        speedPercent: globalSpeed * 100
    };
}

// 更新建筑价格
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
// 获取某个建筑的详细加成（用于UI显示）
function getBuildingStats(buildingKey) {
    const bd = GameState.buildings[buildingKey];
    if (!bd) return null;
    
    const mult = getPermanentMultipliers();
    
    let upgradePercent = (bd.efficiency - 1) * 100;
    let permProdPercent = mult.prodPercent + mult.speedPercent;
    let permConsPercent = mult.speedPercent;
    
    let policyProdPercent = 0;
    let policyConsPercent = 0;
    for (let polName in GameState.policies) {
        const pol = GameState.policies[polName];
        if (!pol.visible) continue;
        const opt = pol.options[pol.activePolicy];
        if (opt.prod && opt.prod[buildingKey]) {
            policyProdPercent += (opt.prod[buildingKey] - 1) * 100;
        }
        if (opt.cons && opt.cons[buildingKey]) {
            policyConsPercent += (opt.cons[buildingKey] - 1) * 100;
        }
    }
    
    let prodMultiplier = (1 + upgradePercent/100)
        * (1 + permProdPercent/100)
        * (1 + policyProdPercent/100);
    let consMultiplier = (1 + upgradePercent/100)
        * (1 + permConsPercent/100)
        * (1 + policyConsPercent/100);
    
    // 获取科技绝对数值加成
    const techProdBonus = getTechProdBonusForBuilding(buildingKey);
    
    const details = [];
    for (let r in bd.produce) {
        let baseVal = bd.produce[r];
        let isPositive = baseVal > 0;
        
        // 先加法：基础值 + 科技绝对加成
        let adjustedBase = baseVal;
        let techBonusValue = 0;
        if (isPositive && techProdBonus[r]) {
            techBonusValue = techProdBonus[r];
            adjustedBase += techBonusValue;
        }
        
        // 再乘法：乘以各种倍率
        let multiplier = isPositive ? prodMultiplier : consMultiplier;
        let finalPerBuilding = adjustedBase * multiplier;
        let total = finalPerBuilding * bd.active;
        
        // 构建提示文本：按照 加法 → 乘法 顺序
        let tooltipLines = [];
        tooltipLines.push(`基础值: ${formatNumber(baseVal)}/秒`);
        if (techBonusValue !== 0) {
            tooltipLines.push(`科技绝对加成: +${formatNumber(techBonusValue)}/秒 → 小计 ${formatNumber(adjustedBase)}/秒`);
        }
        // 乘法因子列表
        let multipliersList = [];
        if (upgradePercent !== 0) multipliersList.push(`升级 ×${(1 + upgradePercent/100).toFixed(2)} (${upgradePercent > 0 ? '+' : ''}${upgradePercent.toFixed(0)}%)`);
        if (isPositive && permProdPercent !== 0) multipliersList.push(`永久科技(产量) ×${(1 + permProdPercent/100).toFixed(2)} (${permProdPercent > 0 ? '+' : ''}${permProdPercent.toFixed(0)}%)`);
        if (!isPositive && permConsPercent !== 0) multipliersList.push(`永久科技(消耗) ×${(1 + permConsPercent/100).toFixed(2)} (${permConsPercent > 0 ? '+' : ''}${permConsPercent.toFixed(0)}%)`);
        if (isPositive && policyProdPercent !== 0) multipliersList.push(`政策 ×${(1 + policyProdPercent/100).toFixed(2)} (${policyProdPercent > 0 ? '+' : ''}${policyProdPercent.toFixed(0)}%)`);
        if (!isPositive && policyConsPercent !== 0) multipliersList.push(`政策 ×${(1 + policyConsPercent/100).toFixed(2)} (${policyConsPercent > 0 ? '+' : ''}${policyConsPercent.toFixed(0)}%)`);
        
        if (multipliersList.length > 0) {
            tooltipLines.push(`倍率组合: ${multipliersList.join(' × ')}`);
        }
        tooltipLines.push(`单个建筑净产量: ${formatNumber(finalPerBuilding)}/秒`);
        tooltipLines.push(`总计 (${bd.active}个): ${formatNumber(total)}/秒`);
        
        details.push({
            resource: r,
            base: baseVal,
            adjustedBase: adjustedBase,
            finalPerBuilding: finalPerBuilding,
            total: total,
            isPositive: isPositive,
            bonusText: tooltipLines.join('\n')
        });
    }
    
    return {
        desc: bd.desc,
        details: details,
        activeCount: bd.active
    };
}

// 计算资源产量和上限（效率影响capProvide）
function computeProductionAndCaps() {
    const res = GameState.resources;
    const blds = GameState.buildings;
    const mult = getPermanentMultipliers();

    for (let r in res) {
        res[r].production = 0;
        res[r].cap = res[r].baseCap;
    }

    const policyProds = {}, policyCons = {};
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        if (pol.visible && pol.options[pol.activePolicy]) {
            const opt = pol.options[pol.activePolicy];
            if (opt.prod) Object.assign(policyProds, opt.prod);
            if (opt.cons) Object.assign(policyCons, opt.cons);
        }
    }

    for (let b in blds) {
        const bd = blds[b];
        if (bd.count === 0) continue;
        
        const techProdBonus = getTechProdBonusForBuilding(b);
        const techCapBonus = getTechCapBonusForBuilding(b);
        
        const prodMult = bd.efficiency * mult.prodRatio * mult.speedRatio * (policyProds[b] || 1);
        const consMult = bd.efficiency * mult.speedRatio * (policyCons[b] || 1);

        // 处理产出/消耗：先加科技绝对加成，再乘以倍率
        for (let r in bd.produce) {
            let baseVal = bd.produce[r];
            let isPositive = baseVal > 0;
            
            let adjustedBase = baseVal;
            if (isPositive && techProdBonus[r]) {
                adjustedBase += techProdBonus[r];
            }
            
            let final = isPositive ? adjustedBase * prodMult : adjustedBase * consMult;
            res[r].production += final * bd.active;
        }
        
        // 处理上限提供（乘以建筑效率）
        for (let r in bd.capProvide) {
            let val = bd.capProvide[r];
            // 加上科技绝对加成（如杜威分类法）
            if (techCapBonus[r]) {
                val += techCapBonus[r];
            }
            // 效率影响上限提供
            let finalVal = val * bd.efficiency;
            let totalVal = finalVal * bd.active;
            // 遗物加成（全局）
            if (r === "科学") totalVal *= mult.sciCapRatio;
            else totalVal *= mult.capRatio;
            res[r].cap += totalVal;
        }
    }
}

// 热度衰减
function updateHeatDecay(deltaSec) {
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (res.hasOwnProperty('heat') && res.heat !== undefined) {
            // 每秒衰减 0.05% 向 1 靠近，deltaSec 为秒数
            let decay = res.heat * 0.0005 * deltaSec;
            if (res.heat > 1) {
                res.heat = Math.max(1, res.heat - decay);
            } else if (res.heat < 1) {
                res.heat = Math.min(1, res.heat + decay);
            }
            // 限制范围 0.5 ~ 20
            res.heat = Math.min(20, Math.max(0.5, res.heat));
        }
    }
}

function tickResources(deltaSec = 0.2) {
    computeProductionAndCaps();
    const res = GameState.resources;
    for (let r in res) {
        let prod = res[r].production;
        let newAmount = res[r].amount + prod * deltaSec;
        res[r].amount = Math.min(res[r].cap, Math.max(0, newAmount));
        if (res[r].amount > 0.01) res[r].visible = true;
    }
    updateHeatDecay(deltaSec);
}