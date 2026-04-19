// production.js

const ProductionEngine = (function() {

    function getBaseProduces(cfg, state) {
        if (!cfg.produces) return {};
        if (typeof cfg.produces === 'function') return cfg.produces(state);
        return cfg.produces;
    }

    function getBaseConsumes(cfg, state) {
        if (!cfg.consumes) return {};
        if (typeof cfg.consumes === 'function') return cfg.consumes(state);
        return cfg.consumes;
    }

    function getBaseCaps(cfg, state) {
        if (!cfg.caps) return {};
        if (typeof cfg.caps === 'function') return cfg.caps(state);
        return cfg.caps;
    }

    function getBaseHappiness(cfg, state) {
        if (cfg.happiness === undefined) return 0;
        if (typeof cfg.happiness === 'function') return cfg.happiness(state);
        return cfg.happiness;
    }

    function refreshEffects() {
        EffectsManager.refreshAllEffects(GameState);
    }

    function computeProductionAndCaps() {
        const state = GameState;
        refreshEffects();

        // 1. 计算幸福度
        let totalHappiness = 100;
        const happinessContributions = [];

        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;
            const baseHappy = getBaseHappiness(cfg, state);
            if (baseHappy !== 0) {
                const contrib = baseHappy * bld.active;
                totalHappiness += contrib;
                happinessContributions.push({ source: bKey, value: contrib });
            }
        }

        const eventHappiness = EffectsManager.getAdditiveValue('global.happiness');
        totalHappiness += eventHappiness;
        if (eventHappiness !== 0) {
            happinessContributions.push({ source: '事件/晶体', value: eventHappiness });
        }

        state.happiness = Math.max(0, totalHappiness);
        state.happinessContributions = happinessContributions;

        const happinessFactor = state.happiness / 100;

        // 2. 重置资源产量和上限
        for (let r in state.resources) {
            state.resources[r].production = 0;
            state.resources[r].cap = state.resources[r].baseCap;
        }

        // 3. 遍历所有激活建筑
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;

            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            const active = bld.active;

            let prodMult = EffectsManager.getBuildingProdMultiplier(bKey);
            let consMult = EffectsManager.getBuildingConsMultiplier(bKey);
            let capMult = EffectsManager.getBuildingCapMultiplier(bKey); // 建筑通用上限倍率

            // 全局倍率
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.type === '太空') {
                prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            }

            // 动态遗物对上限的影响（基于资源）
            const relic = state.resources["遗物"]?.amount || 0;
            let capPerRelic = 0, sciCapPerRelicLog = 0;
            for (let permId in state.permanent) {
                const perm = state.permanent[permId];
                if (!perm.researched || !perm.effect) continue;
                if (perm.effect.capPerRelic) capPerRelic += perm.effect.capPerRelic;
                if (perm.effect.sciCapPerRelicLog) sciCapPerRelicLog += perm.effect.sciCapPerRelicLog;
            }

            // 产量
            const baseProd = getBaseProduces(cfg, state);
            for (let r in baseProd) {
                const eventMult = EffectsManager.getResourceMultiplier(r);
                const val = baseProd[r] * active * prodMult * happinessFactor * eventMult;
                state.resources[r].production += val;
            }

            // 消耗
            const baseCons = getBaseConsumes(cfg, state);
            for (let r in baseCons) {
                const val = baseCons[r] * active * consMult;
                state.resources[r].production -= val;
            }

            // 上限
            const baseCap = getBaseCaps(cfg, state);
            for (let r in baseCap) {
                let resourceCapMult = capMult; // 基础建筑上限倍率
                // 额外应用遗物动态倍率
                if (r === '科学') {
                    resourceCapMult *= (1 + Math.log(1 + relic) * sciCapPerRelicLog);
                } else {
                    resourceCapMult *= (1 + relic * capPerRelic);
                }
                state.resources[r].cap += baseCap[r] * active * resourceCapMult;
            }
        }
    }

    function getBuildingStats(buildingKey) {
        const state = GameState;
        const building = state.buildings[buildingKey];
        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!building || !cfg) return null;

        refreshEffects();
        const happinessFactor = state.happiness / 100;

        let prodMult = EffectsManager.getBuildingProdMultiplier(buildingKey);
        prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
        prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
        if (cfg.type === '太空') {
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
        }
        let consMult = EffectsManager.getBuildingConsMultiplier(buildingKey);
        consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
        let capMult = EffectsManager.getBuildingCapMultiplier(buildingKey);

        const baseProd = getBaseProduces(cfg, state);
        const baseCons = getBaseConsumes(cfg, state);
        const baseCap = getBaseCaps(cfg, state);
        const baseHappiness = getBaseHappiness(cfg, state);

        const relic = state.resources["遗物"]?.amount || 0;
        let capPerRelic = 0, sciCapPerRelicLog = 0;
        for (let permId in state.permanent) {
            const perm = state.permanent[permId];
            if (!perm.researched || !perm.effect) continue;
            if (perm.effect.capPerRelic) capPerRelic += perm.effect.capPerRelic;
            if (perm.effect.sciCapPerRelicLog) sciCapPerRelicLog += perm.effect.sciCapPerRelicLog;
        }

        const details = [];
        for (let r in baseProd) {
            const eventMult = EffectsManager.getResourceMultiplier(r);
            const per = baseProd[r] * prodMult * happinessFactor * eventMult;
            details.push({ resource: r, type: 'prod', perBuilding: per, total: per * building.active });
        }
        for (let r in baseCons) {
            const per = baseCons[r] * consMult;
            details.push({ resource: r, type: 'cons', perBuilding: per, total: per * building.active });
        }
        for (let r in baseCap) {
            let resourceCapMult = capMult;
            if (r === '科学') {
                resourceCapMult *= (1 + Math.log(1 + relic) * sciCapPerRelicLog);
            } else {
                resourceCapMult *= (1 + relic * capPerRelic);
            }
            const per = baseCap[r] * resourceCapMult;
            details.push({ resource: r, type: 'cap', perBuilding: per, total: per * building.active });
        }

        return {
            details,
            activeCount: building.active,
            happinessPerBuilding: baseHappiness,
            happinessTotal: baseHappiness * building.active
        };
    }

    function updateBuildingPrices() {
        const costMult = 1 + EffectsManager.getAdditiveValue('global.cost');
        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;
            bld.price = Formulas.calcBuildingPrice(cfg.basePrice, cfg.costGrowth, bld.count, costMult);
        }
    }

    function updateUpgradePrices() {
        const costMult = 1 + EffectsManager.getAdditiveValue('global.cost');
        for (let u in GameState.upgrades) {
            const up = GameState.upgrades[u];
            up.price = Formulas.calcUpgradePrice(up.basePrice, up.growth, up.level, costMult);
        }
    }

    function getResourceContributions(resourceName) {
        const contributions = [];
        refreshEffects();
        const happinessFactor = GameState.happiness / 100;

        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;

            let prodMult = EffectsManager.getBuildingProdMultiplier(b);
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.type === '太空') {
                prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            }
            let consMult = EffectsManager.getBuildingConsMultiplier(b);
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));

            const baseProd = typeof cfg.produces === 'function' ? cfg.produces(GameState) : (cfg.produces || {});
            const baseCons = typeof cfg.consumes === 'function' ? cfg.consumes(GameState) : (cfg.consumes || {});

            if (baseProd[resourceName]) {
                const eventMult = EffectsManager.getResourceMultiplier(resourceName);
                const val = baseProd[resourceName] * bld.active * prodMult * happinessFactor * eventMult;
                contributions.push({ building: b, value: val });
            }
            if (baseCons[resourceName]) {
                const val = -baseCons[resourceName] * bld.active * consMult;
                contributions.push({ building: b, value: val });
            }
        }
        return contributions;
    }

    function getPermanentMultipliers() {
        return {
            costRatio: 1 + EffectsManager.getAdditiveValue('global.cost'),
            prodRatio: 1 + EffectsManager.getAdditiveValue('global.prod'),
            speedRatio: 1 + EffectsManager.getAdditiveValue('global.speed'),
            spaceProdRatio: 1 + EffectsManager.getAdditiveValue('global.spaceProd'),
            capRatio: 1,
            sciCapRatio: 1
        };
    }

    return {
        computeProductionAndCaps,
        getBuildingStats,
        updateBuildingPrices,
        updateUpgradePrices,
        getResourceContributions,
        getPermanentMultipliers,
        refreshEffects
    };
})();

window.ProductionEngine = ProductionEngine;
window.computeProductionAndCaps = ProductionEngine.computeProductionAndCaps;
window.getBuildingStats = ProductionEngine.getBuildingStats;
window.updateBuildingPrices = ProductionEngine.updateBuildingPrices;
window.updateUpgradePrices = ProductionEngine.updateUpgradePrices;
window.getResourceContributions = ProductionEngine.getResourceContributions;
window.getPermanentMultipliers = ProductionEngine.getPermanentMultipliers;