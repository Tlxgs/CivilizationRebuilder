// production.js - 支持建筑自定义 calc 函数
const ProductionEngine = (function() {
    
    function defaultCalc(state, buildingId, building, cfg, modData, happinessFactor, eventMultipliers) {
        const prodMult = ModifierSystem.calcProdMultiplier(modData, buildingId, cfg.type);
        const consMult = ModifierSystem.calcConsMultiplier(modData, buildingId);
        const active = building.active;
        
        const production = {};
        const consumption = {};
        const cap = {};
        
        for (let r in cfg.baseProduce) {
            const baseVal = cfg.baseProduce[r];
            const eventMul = eventMultipliers[r] || 1;
            production[r] = baseVal * active * prodMult * happinessFactor * eventMul;
        }
        for (let r in cfg.baseConsume) {
            const baseVal = cfg.baseConsume[r];
            consumption[r] = baseVal * active * consMult;
        }
        for (let r in cfg.capProvide) {
            const baseVal = cfg.capProvide[r];
            const capMult = ModifierSystem.calcCapMultiplier(modData, buildingId, r);
            cap[r] = baseVal * active * capMult;
        }
        
        return { production, consumption, cap };
    }

    function computeProductionAndCaps() {
        const state = GameState;
        const res = state.resources;
        const blds = state.buildings;

        const modData = ModifierSystem.collectModifiers(state);
        state.happiness = ModifierSystem.calcHappiness(state, modData);
        const happinessFactor = state.happiness / 100;

        for (let r in res) {
            res[r].production = 0;
            res[r].cap = res[r].baseCap;
        }

        const activeEvent = state.activeRandomEvent;
        const eventMultipliers = activeEvent ? activeEvent.effects : {};

        for (let bKey in blds) {
            const building = blds[bKey];
            if (building.active === 0) continue;

            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            let effects;
            if (typeof cfg.calc === 'function') {
                effects = cfg.calc(state, bKey, building, cfg, modData, happinessFactor, eventMultipliers);
            } else {
                effects = defaultCalc(state, bKey, building, cfg, modData, happinessFactor, eventMultipliers);
            }

            for (let r in effects.production) {
                res[r].production += effects.production[r] || 0;
            }
            for (let r in effects.consumption) {
                res[r].production -= effects.consumption[r] || 0;
            }
            for (let r in effects.cap) {
                res[r].cap += effects.cap[r] || 0;
            }
        }
    }

    function getBuildingStats(buildingKey) {
        const state = GameState;
        const building = state.buildings[buildingKey];
        if (!building) return null;

        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!cfg) return null;

        const modData = ModifierSystem.collectModifiers(state);
        const happinessFactor = state.happiness / 100;
        const eventMultipliers = state.activeRandomEvent?.effects || {};

        let perBuildingEffects;
        if (typeof cfg.calc === 'function') {
            const virtualBuilding = { ...building, active: 1 };
            perBuildingEffects = cfg.calc(state, buildingKey, virtualBuilding, cfg, modData, happinessFactor, eventMultipliers);
        } else {
            const virtualBuilding = { ...building, active: 1 };
            perBuildingEffects = defaultCalc(state, buildingKey, virtualBuilding, cfg, modData, happinessFactor, eventMultipliers);
        }

        const details = [];
        for (let r in perBuildingEffects.production) {
            const per = perBuildingEffects.production[r] || 0;
            details.push({ resource: r, type: 'prod', perBuilding: per, total: per * building.active });
        }
        for (let r in perBuildingEffects.consumption) {
            const per = perBuildingEffects.consumption[r] || 0;
            details.push({ resource: r, type: 'cons', perBuilding: per, total: per * building.active });
        }
        for (let r in perBuildingEffects.cap) {
            const per = perBuildingEffects.cap[r] || 0;
            details.push({ resource: r, type: 'cap', perBuilding: per, total: per * building.active });
        }
        // 提取幸福度贡献（单建筑）
        const happinessPerBuilding = perBuildingEffects.happiness !== undefined 
            ? perBuildingEffects.happiness 
            : (cfg.happinessEffect || 0);   // 兼容未迁移的建筑

        return { 
            details, 
            activeCount: building.active,
            happinessPerBuilding,
            happinessTotal: happinessPerBuilding * building.active
        };
        return { details, activeCount: building.active };
    }

    function updateBuildingPrices() {
        const modData = ModifierSystem.collectModifiers(GameState);
        const costMult = ModifierSystem.calcCostMultiplier(modData);
        for (let b in GameState.buildings) {
            const bd = GameState.buildings[b];
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;
            bd.price = Formulas.calcBuildingPrice(cfg.basePrice, cfg.costGrowth, bd.count, costMult);
        }
    }

    function updateUpgradePrices() {
        const modData = ModifierSystem.collectModifiers(GameState);
        const costMult = ModifierSystem.calcCostMultiplier(modData);
        for (let u in GameState.upgrades) {
            const up = GameState.upgrades[u];
            up.price = Formulas.calcUpgradePrice(up.basePrice, up.growth, up.level, costMult);
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

    function getPermanentMultipliers() {
        const modData = ModifierSystem.collectModifiers(GameState);
        return {
            costRatio: modData.costRatio,
            prodRatio: 1 + modData.globalProdAdd,
            speedRatio: 1 + modData.globalSpeedAdd,
            spaceProdRatio: 1 + modData.spaceProdAdd,
            capRatio: 1 + modData.relic * modData.capPerRelic,
            sciCapRatio: 1 + Math.log(1 + modData.relic) * modData.sciCapPerRelicLog
        };
    }

    return {
        computeProductionAndCaps,
        getBuildingStats,
        updateBuildingPrices,
        updateUpgradePrices,
        getResourceContributions,
        getPermanentMultipliers,
        defaultCalc
    };
})();

window.ProductionEngine = ProductionEngine;
window.computeProductionAndCaps = ProductionEngine.computeProductionAndCaps;
window.getBuildingStats = ProductionEngine.getBuildingStats;
window.updateBuildingPrices = ProductionEngine.updateBuildingPrices;
window.updateUpgradePrices = ProductionEngine.updateUpgradePrices;
window.getResourceContributions = ProductionEngine.getResourceContributions;
window.getPermanentMultipliers = ProductionEngine.getPermanentMultipliers;