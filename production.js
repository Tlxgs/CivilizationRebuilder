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

    function getActiveModeConfig(cfg, building) {
        if (!cfg.modes || !building || building.mode === undefined) return cfg;
        const mode = cfg.modes[building.mode];
        if (!mode) return cfg;
        return { ...cfg, ...mode };
    }

    function refreshEffects() {
        EffectsManager.refreshAllEffects(GameState);
    }

    // ========== 核心：计算产量和上限（迭代效率因子，连续降效） ==========
    function computeProductionAndCaps() {
        const state = GameState;
        refreshEffects();

        // 幸福度只用于提升产量，不参与降低建筑效率
        const happinessFactor = Math.max(0, state.happiness) / 100;

        // 第一步：收集所有激活建筑的“理论值”（未经效率缩放，但已经乘了全局加成和幸福度）
        const bldRaw = {};
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            // 基础乘数
            let prodMult = EffectsManager.getBuildingProdMultiplier(bKey);
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.class === 'space') {
                prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            }
            // 幸福度加在产量上
            prodMult *= happinessFactor;

            let consMult = EffectsManager.getBuildingConsMultiplier(bKey);
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));

            let capMult = EffectsManager.getBuildingCapMultiplier(bKey);

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
                providesLocal: cfg.providesLocal || {},
                requiresLocal: cfg.requiresLocal || {},
                happiness: baseHappy,   // 每座幸福度贡献，不受效率影响
                capMult: capMult,
            };
        }

        // 第二步：迭代求解效率因子（受全局/局域资源短缺限制）
        const ITERATIONS = 3;
        let efficiency = {};
        for (let bKey in bldRaw) {
            efficiency[bKey] = 1.0; // 初始不降效
        }

        for (let iter = 0; iter < ITERATIONS; iter++) {
            // 计算全局资源总供给与总消耗（基于当前效率）
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

            // 全局资源充足率
            const dt = 0.2; // 与 TICK_INTERVAL 一致
            let R_global = {};
            for (let r in totalCons) {
                const stock = state.resources[r]?.amount || 0;
                const prod = totalProd[r] || 0;
                const cons = totalCons[r] || 0;
                if (cons < 1e-9) {
                    R_global[r] = 1.0;
                } else {
                    const available = stock + prod * dt;
                    const needed = cons * dt;
                    R_global[r] = Math.min(1.0, available / needed);
                }
            }

            // 局域资源充足率
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
                    R_local[lr] = Math.min(1.0, cap / used);
                }
            }

            // 更新效率：取所有消耗资源/局域需求充足率的最小值
            for (let bKey in bldRaw) {
                let minR = 1.0;
                const raw = bldRaw[bKey];
                for (let r in raw.consumes) {
                    const R = R_global[r] !== undefined ? R_global[r] : 1.0;
                    if (R < minR) minR = R;
                }
                for (let lr in raw.requiresLocal) {
                    const R = R_local[lr] !== undefined ? R_local[lr] : 1.0;
                    if (R < minR) minR = R;
                }
                efficiency[bKey] = minR;
            }
        }

        // 第三步：将结果写入 GameState
        // 清零资源产量/上限
        for (let r in state.resources) {
            state.resources[r].production = 0;
            state.resources[r].cap = state.resources[r].baseCap;
        }

        // 清零局域资源
        for (let lr in state.localResources) {
            state.localResources[lr].capacity = 0;
            state.localResources[lr].used = 0;
        }

        // 幸福度计算（不受效率影响）
        let totalHappiness = 100;
        const happinessContributions = [];
        for (let bKey in bldRaw) {
            const raw = bldRaw[bKey];
            const contrib = raw.happiness * raw.active;
            if (contrib !== 0) {
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

        // 遗物/永久升级相关（用于上限计算）
        const relic = state.resources["遗物"]?.amount || 0;
        let capPerRelic = 0, sciCapPerRelicLog = 0;
        for (let permId in state.permanent) {
            const perm = state.permanent[permId];
            if (!perm.researched || !perm.effect) continue;
            if (perm.effect.capPerRelic) capPerRelic += perm.effect.capPerRelic;
            if (perm.effect.sciCapPerRelicLog) sciCapPerRelicLog += perm.effect.sciCapPerRelicLog;
        }

        // 累加建筑贡献（产量、消耗、上限、局域资源）
        for (let bKey in bldRaw) {
            const raw = bldRaw[bKey];
            const effActive = efficiency[bKey] * raw.active;

            // 资源产量/消耗
            for (let r in raw.produces) {
                state.resources[r].production += raw.produces[r] * effActive;
            }
            for (let r in raw.consumes) {
                state.resources[r].production -= raw.consumes[r] * effActive;
            }

            // 上限（不受效率影响）
            for (let r in raw.caps) {
                let resourceCapMult = raw.capMult || 1;
                if (r === '科学') {
                    resourceCapMult *= (1 + Math.log(1 + relic) * sciCapPerRelicLog);
                } else {
                    resourceCapMult *= (1 + relic * capPerRelic);
                }
                state.resources[r].cap += raw.caps[r] * raw.active * resourceCapMult;
            }

            // 局域资源（提供量和需求量都按效率缩放）
            for (let lr in raw.providesLocal) {
                state.localResources[lr].capacity += raw.providesLocal[lr] * effActive;
            }
            for (let lr in raw.requiresLocal) {
                state.localResources[lr].used += raw.requiresLocal[lr] * effActive;
            }
        }
    }

    // ========== 建筑详细统计（用于 tooltip） ==========
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
        if (cfg.class === 'space') {
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
        }
        prodMult *= happinessFactor;

        let consMult = EffectsManager.getBuildingConsMultiplier(buildingKey);
        consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
        let capMult = EffectsManager.getBuildingCapMultiplier(buildingKey);

        const baseProd = getBaseProduces(cfg, building, state);
        const baseCons = getBaseConsumes(cfg, building, state);
        const baseCap  = getBaseCaps(cfg, building, state);
        const baseHappy = getBaseHappiness(cfg, building, state);

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
            happinessTotal: baseHappy * building.active
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
        const happinessFactor = GameState.happiness / 100;

        for (let b in GameState.buildings) {
            const bld = GameState.buildings[b];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg) continue;

            let prodMult = EffectsManager.getBuildingProdMultiplier(b);
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.class === 'space') {
                prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            }
            prodMult *= happinessFactor;

            let consMult = EffectsManager.getBuildingConsMultiplier(b);
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));

            const baseProd = typeof cfg.produces === 'function' ? cfg.produces(GameState) : (cfg.produces || {});
            const baseCons = typeof cfg.consumes === 'function' ? cfg.consumes(GameState) : (cfg.consumes || {});

            if (baseProd[resourceName]) {
                const eventMult = EffectsManager.getResourceMultiplier(resourceName);
                const val = baseProd[resourceName] * bld.active * prodMult * eventMult;
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