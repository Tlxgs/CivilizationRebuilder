// production.js

const ProductionEngine = (function() {

    // production.js
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

    // 辅助函数：合并建筑配置与当前模式配置
    function getActiveModeConfig(cfg, building) {
        if (!cfg.modes || !building || building.mode === undefined) return cfg;
        const mode = cfg.modes[building.mode];
        if (!mode) return cfg;
        // 合并模式配置到基础配置（模式字段优先级更高）
        return { ...cfg, ...mode };
    }
    function refreshEffects() {
        EffectsManager.refreshAllEffects(GameState);
    }

    function computeProductionAndCaps() {
        const state = GameState;
        refreshEffects();

        let totalHappiness = 100;
        const happinessContributions = [];

        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;
            const baseHappy = getBaseHappiness(cfg, bld,state);
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
        let totalCapacity = 0;
        let totalRequired = 0;

        // 累加所有激活建筑的人口贡献和占用
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;
            totalCapacity += (bld.populationProvided || 0) * bld.active;
            totalRequired += (bld.populationRequired || 0) * bld.active;
        }

        state.population.capacity = totalCapacity;
        state.population.used = totalRequired;

        // 如果占用超过容量，顺序关闭建筑直到满足
        if (totalRequired > totalCapacity) {
            // 收集所有需要人口的建筑（populationRequired > 0 且 active > 0）
            const getActiveBuildings = () => {
                const list = [];
                for (let bKey in state.buildings) {
                    const bld = state.buildings[bKey];
                    if (bld.active > 0 && (bld.populationRequired || 0) > 0) {
                        list.push({ key: bKey, bld, req: bld.populationRequired });
                    }
                }
                // 按建筑名称排序，保证关闭顺序确定性（可改为按优先级排序）
                list.sort((a, b) => a.key.localeCompare(b.key));
                return list;
            };

            let closedLog = []; // 记录关闭日志（合并输出）
            let iterations = 0;
            const maxIterations = 1000; // 防止无限循环

            while (totalRequired > totalCapacity && iterations < maxIterations) {
                const buildings = getActiveBuildings();
                if (buildings.length === 0) break; // 没有可关闭的建筑了（理论上不会）

                // 选择第一个建筑关闭1个单位
                const target = buildings[0];
                const closeCount = 1; // 每次关闭1个
                const reqPer = target.req;
                target.bld.active -= closeCount;
                totalRequired -= reqPer * closeCount;
                closedLog.push(`${target.key} -1`);
                iterations++;
            }

            if (closedLog.length > 0) {
                // 合并日志，避免刷屏
                const unique = {};
                for (let log of closedLog) {
                    const [name, delta] = log.split(' ');
                    unique[name] = (unique[name] || 0) + parseInt(delta);
                }
                const parts = [];
                for (let name in unique) {
                    parts.push(`${name} ${unique[name]}`);
                }
            }

            // 重新计算最终的人口数据（确保一致）
            totalRequired = 0;
            totalCapacity = 0;
            for (let bKey in state.buildings) {
                const bld = state.buildings[bKey];
                if (bld.active === 0) continue;
                totalCapacity += (bld.populationProvided || 0) * bld.active;
                totalRequired += (bld.populationRequired || 0) * bld.active;
            }
            state.population.capacity = totalCapacity;
            state.population.used = totalRequired;
        }

        for (let r in state.resources) {
            state.resources[r].production = 0;
            state.resources[r].cap = state.resources[r].baseCap;
        }

        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (bld.active === 0) continue;

            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            const active = bld.active;

            let prodMult = EffectsManager.getBuildingProdMultiplier(bKey);
            let consMult = EffectsManager.getBuildingConsMultiplier(bKey);
            let capMult = EffectsManager.getBuildingCapMultiplier(bKey);

            prodMult *= (1 + EffectsManager.getAdditiveValue('global.prod'));
            prodMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            consMult *= (1 + EffectsManager.getAdditiveValue('global.speed'));
            if (cfg.type === '太空') {
                prodMult *= (1 + EffectsManager.getAdditiveValue('global.spaceProd'));
            }

            const relic = state.resources["遗物"]?.amount || 0;
            let capPerRelic = 0, sciCapPerRelicLog = 0;
            for (let permId in state.permanent) {
                const perm = state.permanent[permId];
                if (!perm.researched || !perm.effect) continue;
                if (perm.effect.capPerRelic) capPerRelic += perm.effect.capPerRelic;
                if (perm.effect.sciCapPerRelicLog) sciCapPerRelicLog += perm.effect.sciCapPerRelicLog;
            }

            const baseProd = getBaseProduces(cfg, bld,state);
            for (let r in baseProd) {
                const eventMult = EffectsManager.getResourceMultiplier(r);
                const val = baseProd[r] * active * prodMult * happinessFactor * eventMult;
                state.resources[r].production += val;
            }

            const baseCons = getBaseConsumes(cfg, bld,state);
            for (let r in baseCons) {
                const val = baseCons[r] * active * consMult;
                state.resources[r].production -= val;
            }

            const baseCap = getBaseCaps(cfg, bld,state);
            for (let r in baseCap) {
                let resourceCapMult = capMult;
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

        const baseProd = getBaseProduces(cfg, building,state);
        const baseCons = getBaseConsumes(cfg, building,state);
        const baseCap = getBaseCaps(cfg, building,state);
        const baseHappiness = getBaseHappiness(cfg,building, state);

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