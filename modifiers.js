// modifiers.js - 统一修改器系统（支持建筑自定义 calc 的幸福度贡献）
const ModifierSystem = (function() {
    let cachedModifiers = null;
    let cachedStateHash = '';

    function getStateHash(state) {
        let hash = '';
        hash += state.happiness || 0;
        hash += state.activeRandomEvent?.id || '';
        for (let t in state.techs) hash += (state.techs[t].researched ? '1' : '0');
        for (let u in state.upgrades) hash += (state.upgrades[u].level || 0);
        for (let p in state.policies) hash += (state.policies[p].activePolicy || '') + (state.policies[p].visible ? '1' : '0');
        for (let b in state.buildings) hash += (state.buildings[b].active || 0);
        for (let c of state.crystals.equipped) hash += c ? c.id : 'null';
        return hash;
    }

    function collectModifiers(state) {
        const hash = getStateHash(state);
        if (cachedModifiers && cachedStateHash === hash) {
            return cachedModifiers;
        }

        const modifiers = [];
        const relic = state.resources["遗物"]?.amount || 0;

        let costRatio = 1.0;
        let globalProdAdd = 0;
        let globalSpeedAdd = 0;
        let spaceProdAdd = 0;
        let capPerRelic = 0;
        let sciCapPerRelicLog = 0;

        for (let key in state.permanent) {
            const p = state.permanent[key];
            if (!p.researched) continue;
            const eff = p.effect || {};
            if (eff.costRatio) costRatio *= eff.costRatio;
            if (eff.globalProd) globalProdAdd += eff.globalProd;
            if (eff.globalSpeed) globalSpeedAdd += eff.globalSpeed;
            if (eff.globalSpaceProd) spaceProdAdd += eff.globalSpaceProd;
            if (eff.capPerRelic) capPerRelic += eff.capPerRelic;
            if (eff.sciCapPerRelicLog) sciCapPerRelicLog += eff.sciCapPerRelicLog;
        }

        // 科技
        for (let t in state.techs) {
            const tech = state.techs[t];
            if (!tech.researched || !tech.effect) continue;
            for (let building in tech.effect) {
                const eff = tech.effect[building];
                modifiers.push({
                    source: 'tech',
                    target: building,
                    prod: eff.prodFactor || 0,
                    cons: eff.consFactor || 0,
                    cap: eff.capFactor || 0
                });
            }
        }

        // 升级
        for (let u in state.upgrades) {
            const up = state.upgrades[u];
            if (up.level > 0 && up.effect) {
                for (let building in up.effect) {
                    const val = up.effect[building] * up.level;
                    modifiers.push({
                        source: 'upgrade',
                        target: building,
                        prod: val,
                        cons: val,
                        cap: val
                    });
                }
            }
        }

        // 政策
        for (let p in state.policies) {
            const pol = state.policies[p];
            if (!pol.visible) continue;
            const opt = pol.options[pol.activePolicy];
            if (opt.prodFactor) {
                for (let building in opt.prodFactor) {
                    modifiers.push({
                        source: 'policy',
                        target: building,
                        prod: opt.prodFactor[building],
                        cons: 0,
                        cap: 0
                    });
                }
            }
            if (opt.consFactor) {
                for (let building in opt.consFactor) {
                    const existing = modifiers.find(m => m.source === 'policy' && m.target === building);
                    if (existing) existing.cons = opt.consFactor[building];
                    else modifiers.push({ source: 'policy', target: building, prod: 0, cons: opt.consFactor[building], cap: 0 });
                }
            }
            if (opt.capFactor) {
                for (let building in opt.capFactor) {
                    const existing = modifiers.find(m => m.source === 'policy' && m.target === building);
                    if (existing) existing.cap = opt.capFactor[building];
                    else modifiers.push({ source: 'policy', target: building, prod: 0, cons: 0, cap: opt.capFactor[building] });
                }
            }
        }

        // 建筑间加成
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            if (!bld.modifiers || bld.active === 0) continue;
            for (let mod of bld.modifiers) {
                modifiers.push({
                    source: 'building',
                    target: mod.target,
                    prod: (mod.prodFactor || 0) * bld.active,
                    cons: (mod.consFactor || 0) * bld.active,
                    cap: (mod.capFactor || 0) * bld.active
                });
            }
        }

        // 晶体
        for (let crystal of state.crystals.equipped) {
            if (!crystal) continue;
            for (let eff of crystal.effects) {
                const target = eff.target === 'global' ? 'global' : eff.target;
                if (eff.type === 'prod') {
                    modifiers.push({ source: 'crystal', target, prod: eff.value, cons: 0, cap: 0 });
                } else if (eff.type === 'cons') {
                    modifiers.push({ source: 'crystal', target, prod: 0, cons: eff.value, cap: 0 });
                } else if (eff.type === 'cap') {
                    modifiers.push({ source: 'crystal', target, prod: 0, cons: 0, cap: eff.value });
                }
            }
        }

        cachedModifiers = {
            list: modifiers,
            costRatio,
            globalProdAdd,
            globalSpeedAdd,
            spaceProdAdd,
            capPerRelic,
            sciCapPerRelicLog,
            relic
        };
        cachedStateHash = hash;
        return cachedModifiers;
    }

    function calcProdMultiplier(modData, buildingId, buildingType) {
        const modifiers = modData.list;
        const sumBySource = (source) => {
            return modifiers
                .filter(m => m.source === source && (m.target === buildingId || m.target === 'global'))
                .reduce((sum, m) => sum + m.prod, 0);
        };
        const techBonus = sumBySource('tech');
        const upgradeBonus = sumBySource('upgrade');
        const policyBonus = sumBySource('policy');
        const buildingBonus = modifiers
            .filter(m => m.source === 'building' && m.target === buildingId)
            .reduce((sum, m) => sum + m.prod, 0);
        const crystalBonus = sumBySource('crystal');

        let prodFactor = (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
                    * (1 + buildingBonus) * (1 + crystalBonus)
                    * (1 + modData.globalProdAdd)
                    * (1 + modData.globalSpeedAdd); 
        if (buildingType === '太空') {
            prodFactor *= (1 + modData.spaceProdAdd);
        }
        return prodFactor;
    }

    function calcConsMultiplier(modData, buildingId) {
        const modifiers = modData.list;
        const sumBySource = (source) => {
            return modifiers
                .filter(m => m.source === source && (m.target === buildingId || m.target === 'global'))
                .reduce((sum, m) => sum + m.cons, 0);
        };
        const techBonus = sumBySource('tech');
        const upgradeBonus = sumBySource('upgrade');
        const policyBonus = sumBySource('policy');
        const buildingBonus = modifiers
            .filter(m => m.source === 'building' && m.target === buildingId)
            .reduce((sum, m) => sum + m.cons, 0);
        const crystalBonus = sumBySource('crystal');

        return (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
               * (1 + buildingBonus) * (1 + crystalBonus)
               * (1 + modData.globalSpeedAdd);
    }

    function calcCapMultiplier(modData, buildingId, resource) {
        const modifiers = modData.list;
        const sumBySource = (source) => {
            return modifiers
                .filter(m => m.source === source && (m.target === buildingId || m.target === 'global'))
                .reduce((sum, m) => sum + m.cap, 0);
        };
        const techBonus = sumBySource('tech');
        const upgradeBonus = sumBySource('upgrade');
        const policyBonus = sumBySource('policy');
        const buildingBonus = modifiers
            .filter(m => m.source === 'building' && m.target === buildingId)
            .reduce((sum, m) => sum + m.cap, 0);
        const crystalBonus = sumBySource('crystal');

        let baseMult = (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
                     * (1 + buildingBonus) * (1 + crystalBonus);

        if (resource === '科学') {
            baseMult *= (1 + Math.log(1 + modData.relic) * modData.sciCapPerRelicLog);
        } else {
            baseMult *= (1 + modData.relic * modData.capPerRelic);
        }
        return baseMult;
    }

    /**
     * 计算总幸福度
     *  - 遍历所有建筑
     *  - 若建筑有自定义 calc，调用之，累加其返回的 happiness 字段
     *  - 否则，累加 cfg.happinessEffect * active
     *  - 再加上晶体的幸福度贡献
     */
    function calcHappiness(state, modData) {
        let happiness = 100;

        // 建筑幸福度
        for (let bKey in state.buildings) {
            const building = state.buildings[bKey];
            if (building.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg) continue;

            if (typeof cfg.calc === 'function') {
                // 为幸福度计算构造虚拟环境，不需要生产相关数据
                const dummyModData = modData; // 或者传入 modData 供 calc 使用
                const dummyHappinessFactor = 1; // 幸福度系数不应影响幸福度本身
                const dummyEventMultipliers = {};
                const effects = cfg.calc(state, bKey, building, cfg, dummyModData, dummyHappinessFactor, dummyEventMultipliers);
                if (effects.happiness !== undefined) {
                    happiness += effects.happiness;
                }
            } else if (cfg.happinessEffect) {
                happiness += cfg.happinessEffect * building.active;
            }
        }

        // 晶体幸福度
        for (let crystal of state.crystals.equipped) {
            if (!crystal) continue;
            for (let eff of crystal.effects) {
                if (eff.type === 'happiness') {
                    happiness += eff.value * 100;
                }
            }
        }

        return Math.max(0, happiness);
    }

    function calcCostMultiplier(modData) {
        return modData.costRatio;
    }

    function clearCache() {
        cachedModifiers = null;
        cachedStateHash = '';
    }

    return {
        collectModifiers,
        calcProdMultiplier,
        calcConsMultiplier,
        calcCapMultiplier,
        calcHappiness,
        calcCostMultiplier,
        clearCache
    };
})();

window.ModifierSystem = ModifierSystem;