// production.js - 基于原始正确逻辑的生产计算引擎
const ProductionEngine = (function() {
    // ----- 从原始 utils.js 移植的正确函数 -----
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
            costRatio,
            prodRatio: 1 + globalProd,
            speedRatio: 1 + globalSpeed,
            spaceProdRatio: 1 + globalSpaceProd,
            capRatio: 1 + relic * capPerRelic,
            sciCapRatio: 1 + Math.log(1 + relic) * sciCapPerRelicLog
        };
    }

    function getBuildingMultipliers(buildingKey) {
        const mult = getPermanentMultipliers();
        const relicAmount = GameState.resources["遗物"]?.amount || 0;

        // 科技加成
        let techProdBonus = 0, techConsBonus = 0, techCapBonus = 0;
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

        // 升级加成
        let upgradeBonus = 0;
        for (let u in GameState.upgrades) {
            const up = GameState.upgrades[u];
            if (up.level > 0 && up.effect[buildingKey]) {
                upgradeBonus += up.effect[buildingKey] * up.level;
            }
        }

        // 政策加成
        let policyProdBonus = 0, policyConsBonus = 0, policyCapBonus = 0;
        for (let p in GameState.policies) {
            const pol = GameState.policies[p];
            if (!pol.visible) continue;
            const opt = pol.options[pol.activePolicy];
            if (opt.prodFactor && opt.prodFactor[buildingKey]) policyProdBonus += opt.prodFactor[buildingKey];
            if (opt.consFactor && opt.consFactor[buildingKey]) policyConsBonus += opt.consFactor[buildingKey];
            if (opt.capFactor && opt.capFactor[buildingKey]) policyCapBonus += opt.capFactor[buildingKey];
        }

        // 建筑间加成
        let buildingProdBonus = 0, buildingConsBonus = 0, buildingCapBonus = 0;
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

        // 晶体加成
        let crystalProdBonus = 0, crystalConsBonus = 0, crystalCapBonus = 0;
        for (let crystal of GameState.crystals.equipped) {
            if (!crystal) continue;
            for (let eff of crystal.effects) {
                if (eff.type === 'prod' && (eff.target === buildingKey || eff.target === 'global')) {
                    crystalProdBonus += eff.value;
                }
                if (eff.type === 'cons' && (eff.target === buildingKey || eff.target === 'global')) {
                    crystalConsBonus += eff.value;
                }
                if (eff.type === 'cap' && (eff.target === buildingKey || eff.target === 'global')) {
                    crystalCapBonus += eff.value;
                }
            }
        }

        let prodFactor = (1 + techProdBonus) * (1 + upgradeBonus) * (1 + policyProdBonus)
                       * (1 + buildingProdBonus) * mult.prodRatio * (1 + crystalProdBonus);
        const consFactor = (1 + techConsBonus) * (1 + upgradeBonus) * (1 + policyConsBonus)
                         * (1 + buildingConsBonus) * mult.speedRatio * (1 + crystalConsBonus);
        const baseCapFactor = (1 + techCapBonus) * (1 + upgradeBonus) * (1 + policyCapBonus)
                            * (1 + buildingCapBonus) * (1 + crystalCapBonus);

        const buildingType = GameState.buildings[buildingKey]?.type;
        if (buildingType === "太空") {
            prodFactor *= mult.spaceProdRatio;
        }

        function getCapFactor(resourceName) {
            let permanentCapFactor = 1;
            if (resourceName === "科学") {
                permanentCapFactor = mult.sciCapRatio;
            } else {
                permanentCapFactor = mult.capRatio;
            }
            return baseCapFactor * permanentCapFactor;
        }

        return { prodFactor, consFactor, getCapFactor };
    }

    // ----- 核心计算 -----
    function computeProductionAndCaps() {
        const res = GameState.resources;
        const blds = GameState.buildings;

        // 幸福度
        let totalHappiness = 100;
        const relicAmount = GameState.resources["遗物"]?.amount || 0;
        for (let bKey in blds) {
            const b = blds[bKey];
            if (b.active <= 0) continue;
            if (bKey === "博物馆") {
                const perMuseumBonus = 0.1 * Math.log(Math.pow(2.72, 5) + relicAmount);
                totalHappiness += perMuseumBonus * b.active;
            } else if (b.happinessEffect) {
                totalHappiness += b.happinessEffect * b.active;
            }
        }
        let crystalHappiness = 0;
        for (let crystal of GameState.crystals.equipped) {
            if (!crystal) continue;
            for (let eff of crystal.effects) {
                if (eff.type === 'happiness') crystalHappiness += eff.value * 100;
            }
        }
        totalHappiness += crystalHappiness;
        GameState.happiness = Math.max(0, totalHappiness);
        const happinessFactor = GameState.happiness / 100;

        // 重置产量上限
        for (let r in res) {
            res[r].production = 0;
            res[r].cap = res[r].baseCap;
        }

        const activeEvent = GameState.activeRandomEvent;

        for (let bKey in blds) {
            const b = blds[bKey];
            if (b.count === 0) continue;

            const factors = getBuildingMultipliers(bKey);
            const activeCount = b.active;

            // 产出
            for (let r in b.baseProduce) {
                const baseVal = b.baseProduce[r];
                const eventMul = (activeEvent && activeEvent.effects[r]) ? activeEvent.effects[r] : 1;
                const total = baseVal * activeCount * factors.prodFactor * happinessFactor * eventMul;
                res[r].production += total;
            }

            // 消耗
            for (let r in b.baseConsume) {
                const baseVal = b.baseConsume[r];
                const total = baseVal * activeCount * factors.consFactor;
                res[r].production -= total;
            }

            // 上限
            for (let r in b.capProvide) {
                const baseCap = b.capProvide[r];
                const totalCap = baseCap * activeCount * factors.getCapFactor(r);
                res[r].cap += totalCap;
            }
        }
    }

    function getBuildingStats(buildingKey) {
        const b = GameState.buildings[buildingKey];
        if (!b) return null;
        const factors = getBuildingMultipliers(buildingKey);
        const activeCount = b.active;
        const happinessFactor = GameState.happiness / 100;

        const details = [];
        for (let r in b.baseProduce) {
            const base = b.baseProduce[r];
            const perBuilding = base * factors.prodFactor * happinessFactor;
            details.push({ resource: r, type: 'prod', base, perBuilding, total: perBuilding * activeCount });
        }
        for (let r in b.baseConsume) {
            const base = b.baseConsume[r];
            const perBuilding = base * factors.consFactor;
            details.push({ resource: r, type: 'cons', base, perBuilding, total: perBuilding * activeCount });
        }
        for (let r in b.capProvide) {
            const base = b.capProvide[r];
            const perBuilding = base * factors.getCapFactor(r);
            details.push({ resource: r, type: 'cap', base, perBuilding, total: perBuilding * activeCount });
        }
        return { details, activeCount };
    }

    function updateBuildingPrices() {
        const mult = getPermanentMultipliers().costRatio;
        for (let b in GameState.buildings) {
            const bd = GameState.buildings[b];
            bd.price = Formulas.calcBuildingPrice(bd.basePrice, bd.costGrowth, bd.count, mult);
        }
    }

    function updateUpgradePrices() {
        const mult = getPermanentMultipliers().costRatio;
        for (let u in GameState.upgrades) {
            const up = GameState.upgrades[u];
            up.price = Formulas.calcUpgradePrice(up.basePrice, up.growth, up.level, mult);
        }
    }

    function getResourceContributions(resourceName) {
        const contributions = [];
        for (let b in GameState.buildings) {
            const bd = GameState.buildings[b];
            if (bd.active === 0) continue;
            const stats = getBuildingStats(b);
            if (!stats) continue;
            const detail = stats.details.find(d => d.resource === resourceName && (d.type === 'prod' || d.type === 'cons'));
            if (detail && Math.abs(detail.total) > 0.0001) {
                const value = detail.type === 'cons' ? -detail.total : detail.total;
                contributions.push({ building: b, value });
            }
        }
        return contributions;
    }

    return {
        computeProductionAndCaps,
        getBuildingStats,
        updateBuildingPrices,
        updateUpgradePrices,
        getResourceContributions,
        getPermanentMultipliers
    };
})();

window.computeProductionAndCaps = ProductionEngine.computeProductionAndCaps;
window.getBuildingStats = ProductionEngine.getBuildingStats;
window.updateBuildingPrices = ProductionEngine.updateBuildingPrices;
window.updateUpgradePrices = ProductionEngine.updateUpgradePrices;
window.getResourceContributions = ProductionEngine.getResourceContributions;
window.getPermanentMultipliers = ProductionEngine.getPermanentMultipliers;
window.ProductionEngine = ProductionEngine;