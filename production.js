// production.js
// 支持 produces/consumes/caps/happiness 可为函数或对象

const ProductionEngine = (function() {

    // 获取基础值（支持函数动态计算）
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

    // 主计算函数
    function computeProductionAndCaps() {
        const state = GameState;
        const modData = ModifierSystem.collectModifiers(state);

    let totalHappiness = 100;
    const happinessContributions = [];

    // 建筑贡献
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

    // 晶体贡献
    for (let i = 0; i < state.crystals.equipped.length; i++) {
        const crystal = state.crystals.equipped[i];
        if (!crystal) continue;
        for (let eff of crystal.effects) {
            if (eff.type === 'happiness') {
                const contrib = eff.value * 100;
                totalHappiness += contrib;
                happinessContributions.push({ source: `晶体:${crystal.name}`, value: contrib });
            }
        }
    }


    const happinessFactor = state.happiness / 100;

    const eventHappinessMod = modData.eventHappinessMod || 0;
    if (eventHappinessMod !== 0) {
        totalHappiness += eventHappinessMod;
        happinessContributions.push({ source: '事件', value: eventHappinessMod });
    }
    state.happiness = Math.max(0, totalHappiness);
    state.happinessContributions = happinessContributions;

    // 重置资源产量和上限
    for (let r in state.resources) {
        state.resources[r].production = 0;
        state.resources[r].cap = state.resources[r].baseCap;
    }

    const eventMultipliers = modData.eventMultipliers || {};

    // 遍历所有激活建筑，累加产量、消耗、上限
    for (let bKey in state.buildings) {
        const bld = state.buildings[bKey];
        if (bld.active === 0) continue;

        const cfg = BUILDINGS_CONFIG[bKey];
        if (!cfg) continue;

        const active = bld.active;
        const prodMult = ModifierSystem.calcProdMultiplier(modData, bKey, cfg.type);
        const consMult = ModifierSystem.calcConsMultiplier(modData, bKey);

        const baseProd = getBaseProduces(cfg, state);
        for (let r in baseProd) {
            const eventMul = eventMultipliers[r] || 1;
            state.resources[r].production += baseProd[r] * active * prodMult * happinessFactor * eventMul;
        }

        const baseCons = getBaseConsumes(cfg, state);
        for (let r in baseCons) {
            state.resources[r].production -= baseCons[r] * active * consMult;
        }

        const baseCap = getBaseCaps(cfg, state);
        for (let r in baseCap) {
            const capMult = ModifierSystem.calcCapMultiplier(modData, bKey, r);
            state.resources[r].cap += baseCap[r] * active * capMult;
        }
    }
    }

    // 获取单建筑统计数据（用于提示框）
    function getBuildingStats(buildingKey) {
        const state = GameState;
        const building = state.buildings[buildingKey];
        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!building || !cfg) return null;

        const modData = ModifierSystem.collectModifiers(state);
        const happinessFactor = state.happiness / 100;
        const eventMultipliers = modData.eventMultipliers || {};

        const prodMult = ModifierSystem.calcProdMultiplier(modData, buildingKey, cfg.type);
        const consMult = ModifierSystem.calcConsMultiplier(modData, buildingKey);

        const baseProd = getBaseProduces(cfg, state);
        const baseCons = getBaseConsumes(cfg, state);
        const baseCap = getBaseCaps(cfg, state);
        const baseHappiness = getBaseHappiness(cfg, state);

        const details = [];
        for (let r in baseProd) {
            const eventMul = eventMultipliers[r] || 1;
            const per = baseProd[r] * prodMult * happinessFactor * eventMul;
            details.push({ resource: r, type: 'prod', perBuilding: per, total: per * building.active });
        }
        for (let r in baseCons) {
            const per = baseCons[r] * consMult;
            details.push({ resource: r, type: 'cons', perBuilding: per, total: per * building.active });
        }
        for (let r in baseCap) {
            const capMult = ModifierSystem.calcCapMultiplier(modData, buildingKey, r);
            const per = baseCap[r] * capMult;
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
        const modData = ModifierSystem.collectModifiers(GameState);
        const costMult = ModifierSystem.calcCostMultiplier(modData);
        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;
            bld.price = Formulas.calcBuildingPrice(cfg.basePrice, cfg.costGrowth, bld.count, costMult);
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
            const bld = GameState.buildings[b];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;

            const modData = ModifierSystem.collectModifiers(GameState);
            const happinessFactor = GameState.happiness / 100;
            const eventMultipliers = modData.eventMultipliers || {};
            const prodMult = ModifierSystem.calcProdMultiplier(modData, b, cfg.type);
            const consMult = ModifierSystem.calcConsMultiplier(modData, b);

            const baseProd = typeof cfg.produces === 'function' ? cfg.produces(GameState) : (cfg.produces || {});
            const baseCons = typeof cfg.consumes === 'function' ? cfg.consumes(GameState) : (cfg.consumes || {});

            // 计算产量贡献
            if (baseProd[resourceName]) {
                const eventMul = eventMultipliers[resourceName] || 1;
                const val = baseProd[resourceName] * bld.active * prodMult * happinessFactor * eventMul;
                contributions.push({ building: b, value: val });
            }
            // 计算消耗贡献（负值）
            if (baseCons[resourceName]) {
                const val = -baseCons[resourceName] * bld.active * consMult;
                contributions.push({ building: b, value: val });
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
        getPermanentMultipliers
    };
})();

window.ProductionEngine = ProductionEngine;
window.computeProductionAndCaps = ProductionEngine.computeProductionAndCaps;
window.getBuildingStats = ProductionEngine.getBuildingStats;
window.updateBuildingPrices = ProductionEngine.updateBuildingPrices;
window.updateUpgradePrices = ProductionEngine.updateUpgradePrices;
window.getResourceContributions = ProductionEngine.getResourceContributions;
window.getPermanentMultipliers = ProductionEngine.getPermanentMultipliers;