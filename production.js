// production.js

const ProductionEngine = (function() {

    // ========== 获取建筑基础数据（已处理模式切换） ==========
    function getBaseProduces(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (!modeCfg.produces) return {};
        if (typeof modeCfg.produces === 'function') return modeCfg.produces(state);
        return modeCfg.produces;
    }

    function getBaseConsumes(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (!modeCfg.consumes) return {};
        if (typeof modeCfg.consumes === 'function') return modeCfg.consumes(state);
        return modeCfg.consumes;
    }

    function getBaseCaps(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (!modeCfg.caps) return {};
        if (typeof modeCfg.caps === 'function') return modeCfg.caps(state);
        return modeCfg.caps;
    }

    function getBaseHappiness(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (modeCfg.happiness === undefined) return 0;
        if (typeof modeCfg.happiness === 'function') return modeCfg.happiness(state);
        return modeCfg.happiness;
    }

    function getBaseProvidesLocal(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (!modeCfg.providesLocal) return {};
        if (typeof modeCfg.providesLocal === 'function') return modeCfg.providesLocal(state);
        return modeCfg.providesLocal;
    }

    function getBaseRequiresLocal(cfg, building, state) {
        const modeCfg = getActiveModeConfig(cfg, building);
        if (!modeCfg.requiresLocal) return {};
        if (typeof modeCfg.requiresLocal === 'function') return modeCfg.requiresLocal(state);
        return modeCfg.requiresLocal;
    }

    function getActiveModeConfig(cfg, building) {
        if (!cfg.modes || !building || building.mode === undefined) return cfg;
        const mode = cfg.modes[building.mode];
        if (!mode) return cfg;
        return { ...cfg, ...mode };
    }

    // ========== 抽取公共乘数计算（原版重复部分） ==========
    function _getBuildingMultipliers(buildingKey) {
        const state = GameState;
        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!cfg) return null;

        const happinessFactor = Formulas.calcHappinessSoftCap(
            Math.max(0, state.happiness),
            state
        ) / 100;

        let prodMult = EffectsManager.getBuildingProdMultiplier(buildingKey);
        prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
        prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
        if (cfg.class === 'space') {
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
        }
        if (cfg.class === 'galaxy') {
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.galaxyProd'));
        }
        prodMult *= happinessFactor;

        let consMult = EffectsManager.getBuildingConsMultiplier(buildingKey);
        consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));

        let capMult = EffectsManager.getBuildingCapMultiplier(buildingKey);

        return { prodMult, consMult, capMult, happinessFactor };
    }

    function refreshEffects() {
        EffectsManager.refreshAllEffects(GameState);
    }

    // ========== 核心：计算产量和上限（迭代效率因子） ==========
    function computeProductionAndCaps() {
        const state = GameState;
        refreshEffects();

        const happinessFactor = Formulas.calcHappinessSoftCap(
            Math.max(0, state.happiness),
            state
        ) / 100;

        // 第一步：收集所有激活建筑的“理论值”
        const bldRaw = {};
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            // 使用公共乘数
            const mults = _getBuildingMultipliers(bKey);
            if (!mults) continue;
            let { prodMult, consMult, capMult } = mults;

            const baseProd = getBaseProduces(cfg, bld, state);
            const baseCons = getBaseConsumes(cfg, bld, state);
            const baseCap  = getBaseCaps(cfg, bld, state);
            const baseHappy = getBaseHappiness(cfg, bld, state);

            const scaledProd = {};
            for (let r in baseProd) {
                const eventMult = EffectsManager.getResourceMultiplier(r);
                scaledProd[r] = baseProd[r] * prodMult * eventMult;
            }
            const scaledCons = {};
            for (let r in baseCons) {
                scaledCons[r] = baseCons[r] * consMult;
            }
            const scaledCap = {};
            for (let r in baseCap) {
                scaledCap[r] = baseCap[r] * capMult;
            }

            bldRaw[bKey] = {
                active: bld.active,
                produces: scaledProd,
                consumes: scaledCons,
                caps: scaledCap,
                providesLocal: getBaseProvidesLocal(cfg, bld, state),
                requiresLocal: getBaseRequiresLocal(cfg, bld, state),
                happiness: baseHappy,
                capMult: capMult,
            };
        }

        // 第二步：迭代求解效率因子（受全局/局域资源短缺限制）
        const ITERATIONS = 2;
        let efficiency = GameState.buildingEfficiency;
        for (let bd in bldRaw){
            if (efficiency[bd]==undefined)
                efficiency[bd]=1.0
        }

        for (let iter = 0; iter < ITERATIONS; iter++) {
            let totalProd = {}, totalCons = {};
            for (let bKey in bldRaw) {
                const raw = bldRaw[bKey];
                const e = efficiency[bKey] * raw.active;
                for (let r in raw.produces) {
                    totalProd[r] = (totalProd[r] || 0) + raw.produces[r] * e;
                }
                for (let r in raw.consumes) {
                    totalCons[r] = (totalCons[r] || 0) + raw.consumes[r] * e;
                }
            }

            const dt = 0.2;
            let R_global = {};
            for (let r in totalCons) {
                const stock = state.resources[r]?.amount || 0;
                const prod = totalProd[r] || 0;
                const cons = totalCons[r] || 0;
                if (cons < 1e-9) {
                    R_global[r] = 1.0;
                } else {
                    const available = stock+prod*dt;
                    const needed = cons*dt;
                    R_global[r] = Math.min(1.20, available / needed);
                }
            }

            let localCap = {}, localUsed = {};
            for (let bKey in bldRaw) {
                const raw = bldRaw[bKey];
                const e = efficiency[bKey] * raw.active;
                for (let lr in raw.providesLocal) {
                    localCap[lr] = (localCap[lr] || 0) + raw.providesLocal[lr] * e;
                }
                for (let lr in raw.requiresLocal) {
                    localUsed[lr] = (localUsed[lr] || 0) + raw.requiresLocal[lr] * e;
                }
            }
            let R_local = {};
            for (let lr in LOCAL_RESOURCES_CONFIG) {
                const cap = localCap[lr] || 0;
                const used = localUsed[lr] || 0;
                if (used < 1e-9) {
                    R_local[lr] = 1.0;
                } else {
                    R_local[lr] = Math.min(1.20, cap / used);
                }
            }
            
            for (let bKey in bldRaw) {
                let minR = 1.5;
                const raw = bldRaw[bKey];
                for (let r in raw.consumes) {
                    const R = R_global[r] !== undefined ? R_global[r] : 1.0;
                    if (R < minR) minR = R;
                }
                for (let lr in raw.requiresLocal) {
                    const R = R_local[lr] !== undefined ? R_local[lr] : 1.0;
                    if (R < minR) minR = R;
                }
                if (efficiency[bKey]<1e-5 && minR>1e-5){
                    efficiency[bKey] = Math.min(1,(1e-5+efficiency[bKey])*minR);
                }
                efficiency[bKey] = Math.min(1,efficiency[bKey]*minR);
            }
        }

        // 第三步：将结果写入 GameState
        for (let r in state.resources) {
            state.resources[r].production = 0;
            state.resources[r].cap = state.resources[r].baseCap;
        }
        for (let lr in state.localResources) {
            state.localResources[lr].capacity = 0;
            state.localResources[lr].used = 0;
        }

        const baseHappiness = 100;
        state.happiness = Math.max(0, baseHappiness
            + EffectsManager.getAdditiveValue('global.happiness'));
        state.happinessContributions = EffectsManager.getHappinessBreakdown();

        const relic = state.resources["遗物"]?.amount || 0;
        let capPerRelic = 0, sciCapPerRelicLog = 0;
        for (let permId in state.permanent) {
            const perm = state.permanent[permId];
            if (!perm.researched || !perm.effect) continue;
            if (perm.effect.capPerRelic) capPerRelic += perm.effect.capPerRelic;
            if (perm.effect.sciCapPerRelicLog) sciCapPerRelicLog += perm.effect.sciCapPerRelicLog;
        }

        for (let bKey in bldRaw) {
            const raw = bldRaw[bKey];
            const effActive = efficiency[bKey] * raw.active;

            for (let r in raw.produces) {
                state.resources[r].production += raw.produces[r] * effActive;
            }
            for (let r in raw.consumes) {
                state.resources[r].production -= raw.consumes[r] * effActive;
            }

            for (let r in raw.caps) {
                let relicMult = 1;
                if (r === '科学') {
                    relicMult *= (1 + Math.log(1 + relic) * sciCapPerRelicLog);
                } else {
                    relicMult *= (1 + relic * capPerRelic);
                }
                // 低效科技：研究后上限受效率影响；未研究则不受影响（永远满效率）
                if (GameState.techs["低效"]?.researched) {
                    state.resources[r].cap += raw.caps[r] * effActive * relicMult;
                } else {
                    state.resources[r].cap += raw.caps[r] * raw.active * relicMult;
                }
            }

            for (let lr in raw.providesLocal) {
                state.localResources[lr].capacity += raw.providesLocal[lr] * effActive;
            }
            for (let lr in raw.requiresLocal) {
                state.localResources[lr].used += raw.requiresLocal[lr] * effActive;
            }
        }

        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bldRaw[bKey]) {
                bld.efficiency = efficiency[bKey];
            } else {
                bld.efficiency = 1.0;
            }
        }

        const actualTradeRates = TradeEngine.computeActualTradeRates(state);
        for (let r in actualTradeRates) {
            const tradeRate = actualTradeRates[r];
            if (tradeRate !== 0) state.resources[r].production += tradeRate;
        }
        let goldTradeFlow = 0;
        for (let r in actualTradeRates) {
            const rate = actualTradeRates[r];
            if (rate !== 0) goldTradeFlow += TradeEngine.getGoldFlowForResource(state, r, rate);
        }
        if (goldTradeFlow !== 0) state.resources["金"].production += goldTradeFlow;
    }

    // ========== 建筑详细统计（用于 tooltip） ==========
    function getBuildingStats(buildingKey) {
        const state = GameState;
        const building = state.buildings[buildingKey];
        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!building || !cfg) return null;

        const mults = _getBuildingMultipliers(buildingKey);
        if (!mults) return null;
        let { prodMult, consMult, capMult } = mults;

        const baseProd = getBaseProduces(cfg, building, state);
        const baseCons = getBaseConsumes(cfg, building, state);
        const baseCap  = getBaseCaps(cfg, building, state);
        const baseHappy = getBaseHappiness(cfg, building, state);
        const baseProvidesLocal = getBaseProvidesLocal(cfg, building, state);
        const baseRequiresLocal = getBaseRequiresLocal(cfg, building, state);

        const relic = ResourcesManager.getAmount("遗物");
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
            const val = baseProd[r] * prodMult * eventMult;
            details.push({ resource: r, type: 'prod', perBuilding: val, total: val * building.active });
        }
        for (let r in baseCons) {
            const val = baseCons[r] * consMult;
            details.push({ resource: r, type: 'cons', perBuilding: val, total: val * building.active });
        }
        for (let r in baseCap) {
            let resourceCapMult = capMult;
            if (r === '科学') {
                resourceCapMult *= (1 + Math.log(1 + relic) * sciCapPerRelicLog);
            } else {
                resourceCapMult *= (1 + relic * capPerRelic);
            }
            const val = baseCap[r] * resourceCapMult;
            details.push({ resource: r, type: 'cap', perBuilding: val, total: val * building.active });
        }

        return {
            details,
            activeCount: building.active,
            happinessPerBuilding: baseHappy,
            happinessTotal: baseHappy * building.active,
            providesLocal: baseProvidesLocal,
            requiresLocal: baseRequiresLocal
        };
    }

    // ========== 价格更新 ==========
    function updateBuildingPrices() {
        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;
            bld.price = cfg.cost(GameState, bld.count);
        }
    }

    function updateUpgradePrices() {
        for (let u in GameState.upgrades) {
            const up = GameState.upgrades[u];
            const cfg = UPGRADES_CONFIG[u];
            if (!cfg) continue;
            up.price = cfg.cost(GameState, up.level);
        }
    }

    function getResourceContributions(resourceName) {
        const contributions = [];
        refreshEffects();
        const happinessFactor = Formulas.calcHappinessSoftCap(
            Math.max(0, GameState.happiness),
            GameState
        ) / 100;

        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;
            const effActive = (bld.efficiency ?? 1) * bld.active;

            let prodMult = EffectsManager.getBuildingProdMultiplier(b);
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.class === 'space') prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            if (cfg.class === 'galaxy') prodMult *= (1 + EffectsManager.getAdditiveValue('global.galaxyProd'));
            prodMult *= happinessFactor;

            let consMult = EffectsManager.getBuildingConsMultiplier(b);
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));

            const modeCfg = getActiveModeConfig(cfg, bld, GameState);
            const baseProd = typeof modeCfg.produces === 'function' ? modeCfg.produces(GameState) : (modeCfg.produces || {});
            const baseCons = typeof modeCfg.consumes === 'function' ? modeCfg.consumes(GameState) : (modeCfg.consumes || {});
            if (baseProd[resourceName]) {
                const eventMult = EffectsManager.getResourceMultiplier(resourceName);
                const val = baseProd[resourceName] * effActive * prodMult * eventMult;
                contributions.push({ building: b, value: val });
            }
            if (baseCons[resourceName]) {
                const val = -baseCons[resourceName] * effActive * consMult;
                contributions.push({ building: b, value: val });
            }
        }
        const actualTradeRates = TradeEngine.computeActualTradeRates(GameState);
        const tradeRate = actualTradeRates[resourceName];
        if (tradeRate !== undefined && tradeRate !== 0) contributions.push({ building: "贸易", value: tradeRate });
        if (resourceName === "金") {
            let goldTrade = 0;
            for (let r in actualTradeRates) {
                const rate = actualTradeRates[r];
                if (rate !== 0) goldTrade += TradeEngine.getGoldFlowForResource(GameState, r, rate);
            }
            if (goldTrade !== 0) contributions.push({ building: "贸易", value: goldTrade });
        }
        return contributions;
    }

    function getPermanentMultipliers() {
        return {
            costRatio: 1 + EffectsManager.getAdditiveValue('global.cost'),
            prodRatio: 1 + EffectsManager.getAdditiveValue('global.prod'),
            speedRatio: 1 + EffectsManager.getAdditiveValue('global.speed'),
            spaceProdRatio: 1 + EffectsManager.getAdditiveValue('global.spaceProd'),
            galaxyProdRatio: 1 + EffectsManager.getAdditiveValue('global.galaxyProd'),
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

window.computeProductionAndCaps = ProductionEngine.computeProductionAndCaps;
window.updateBuildingPrices = ProductionEngine.updateBuildingPrices;
window.updateUpgradePrices = ProductionEngine.updateUpgradePrices;
window.getResourceContributions = ProductionEngine.getResourceContributions;
window.refreshEffects = ProductionEngine.refreshEffects;
window.getBuildingStats = ProductionEngine.getBuildingStats;