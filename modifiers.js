// modifiers.js
// 收集所有加成来源，计算倍率

const ModifierSystem = (function() {
    let cachedModifiers = null;
    let cachedStateHash = '';

    function getStateHash(state) {
        let hash = '';
        hash += state.happiness || 0;
        if (state.activeRandomEvents && state.activeRandomEvents.length) {
            for (let ev of state.activeRandomEvents) hash += ev.id + '|' + ev.endDay;
        }
        for (let t in state.techs) hash += (state.techs[t].researched ? '1' : '0');
        for (let u in state.upgrades) hash += (state.upgrades[u].level || 0);
        for (let p in state.policies) hash += (state.policies[p].activePolicy || '') + (state.policies[p].visible ? '1' : '0');
        for (let b in state.buildings) hash += (state.buildings[b].active || 0);
        for (let c of state.crystals.equipped) hash += c ? c.id : 'null';
        return hash;
    }

    function collectModifiers(state) {
        const hash = getStateHash(state);
        if (cachedModifiers && cachedStateHash === hash) return cachedModifiers;

        const modifiers = [];
        const relic = state.resources["遗物"]?.amount || 0;

        let costRatio = 1.0;
        let globalProdAdd = 0;
        let globalSpeedAdd = 0;
        let spaceProdAdd = 0;
        let capPerRelic = 0;
        let sciCapPerRelicLog = 0;

        // 永恒升级效果
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

        // 科技效果
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

        // 升级效果
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

        // 政策效果
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

        // 建筑间加成（modifiers 字段）
        for (let bKey in state.buildings) {
            const bld = state.buildings[bKey];
            const cfg = BUILDINGS_CONFIG[bKey];
            if (!cfg || !cfg.modifiers || bld.active === 0) continue;
            for (let mod of cfg.modifiers) {
                modifiers.push({
                    source: 'building',
                    target: mod.target,
                    prod: (mod.prodFactor || 0) * bld.active,
                    cons: (mod.consFactor || 0) * bld.active,
                    cap: (mod.capFactor || 0) * bld.active
                });
            }
        }

        // 晶体效果
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

        // ===== 新事件系统：收集建筑乘数并加入 modifiers =====
        const eventMods = EventEffectHandler.collectEventModifiers(state.activeRandomEvents || []);
        const buildingMults = eventMods.buildingMults;
        
        for (let building in buildingMults) {
            const mults = buildingMults[building];
            modifiers.push({
                source: 'event',
                target: building,
                prod: (mults.prod || 1) - 1,      // 转换为增量
                cons: (mults.cons || 1) - 1,
                cap: (mults.cap || 1) - 1
            });
        }

        // 资源乘数仍使用单独对象（用于产量最终乘数）
        const eventMultipliers = eventMods.resourceMults;

        cachedModifiers = {
            list: modifiers,
            costRatio,
            globalProdAdd,
            globalSpeedAdd,
            spaceProdAdd,
            capPerRelic,
            sciCapPerRelicLog,
            relic,
            eventMultipliers,
            eventHappinessMod: EventEffectHandler.getEventHappinessMod(state.activeRandomEvents || [])
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
        const eventBonus = sumBySource('event');

        let factor = (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
                   * (1 + buildingBonus) * (1 + crystalBonus) * (1 + eventBonus)
                   * (1 + modData.globalProdAdd)
                   * (1 + modData.globalSpeedAdd);
        if (buildingType === '太空') {
            factor *= (1 + modData.spaceProdAdd);
        }
        return factor;
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
        const eventBonus = sumBySource('event');

        return (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
               * (1 + buildingBonus) * (1 + crystalBonus) * (1 + eventBonus)
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
        const eventBonus = sumBySource('event');

        let baseMult = (1 + techBonus) * (1 + upgradeBonus) * (1 + policyBonus)
                     * (1 + buildingBonus) * (1 + crystalBonus) * (1 + eventBonus);

        if (resource === '科学') {
            baseMult *= (1 + Math.log(1 + modData.relic) * modData.sciCapPerRelicLog);
        } else {
            baseMult *= (1 + modData.relic * modData.capPerRelic);
        }
        return baseMult;
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
        calcCostMultiplier,
        clearCache
    };
})();

window.ModifierSystem = ModifierSystem;