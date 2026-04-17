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

// ==================== 加成聚合工具函数 ====================

// 获取某个建筑的综合加成因子（返回 prodFactor, consFactor, capFactor）
function getBuildingMultipliers(buildingKey) {
    const mult = getPermanentMultipliers(); // 永恒全局加成

    // 1. 科技加成（对特定建筑的乘算因子，累加）
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

    // 4. 最终因子 = (1 + 科技累加) * (1 + 升级累加) * (1 + 政策累加) * 永恒全局
    const prodFactor = (1 + techProdBonus) * (1 + upgradeBonus) * (1 + policyProdBonus) * mult.prodRatio;
    const consFactor = (1 + techConsBonus) * (1 + upgradeBonus) * (1 + policyConsBonus) * mult.speedRatio;
    const capFactor  = (1 + techCapBonus)  * (1 + upgradeBonus) * (1 + policyCapBonus)  * 1.0; // 上限暂不受永恒speed影响

    return { prodFactor, consFactor, capFactor };
}

// 重写 computeProductionAndCaps —— 采用新模型
function computeProductionAndCaps() {
    const res = GameState.resources;
    const blds = GameState.buildings;

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

        // 处理产出（正资源）
        for (let r in b.baseProduce) {
            const baseVal = b.baseProduce[r];
            const total = baseVal * activeCount * factors.prodFactor;
            res[r].production += total;
        }

        // 处理消耗（负资源）
        for (let r in b.baseConsume) {
            const baseVal = b.baseConsume[r];
            const total = baseVal * activeCount * factors.consFactor;
            res[r].production -= total;   // 消耗记为负产量
        }

        // 处理上限提供
        for (let r in b.capProvide) {
            const baseCap = b.capProvide[r];
            // 上限提供受效率因子影响（与产出因子相同逻辑）
            const totalCap = baseCap * activeCount * factors.capFactor;
            // 额外应用永恒的上限加成（针对科学有特殊处理）
            if (r === "科学") {
                res[r].cap += totalCap * getPermanentMultipliers().sciCapRatio;
            } else {
                res[r].cap += totalCap * getPermanentMultipliers().capRatio;
            }
        }
    }
}

// 重写 getBuildingStats —— 返回详细加成明细（用于 tooltip）
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
        eternalProd: getPermanentMultipliers().prodRatio - 1,
        eternalCons: getPermanentMultipliers().speedRatio - 1,
        eternalCap: 0
    };

    const details = [];
    // 产出项
    for (let r in b.baseProduce) {
        const base = b.baseProduce[r];
        const perBuilding = base * factors.prodFactor;
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
    // 上限项
    for (let r in b.capProvide) {
        const base = b.capProvide[r];
        const perBuilding = base * factors.capFactor;
        const total = perBuilding * activeCount;
        details.push({
            resource: r,
            type: 'cap',
            base,
            perBuilding,
            total,
            factor: factors.capFactor,
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
    const res = GameState.resources;
    for (let r in res) {
        let prod = res[r].production;
        let newAmount = res[r].amount + prod * deltaSec;
        res[r].amount = Math.min(res[r].cap, Math.max(0, newAmount));
        if (res[r].amount > 0.01) res[r].visible = true;
    }
    updateHeatDecay(deltaSec);
}