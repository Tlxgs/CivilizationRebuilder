// effectsManager.js

const EffectsManager = (function() {
    const effects = {};

    function registerEffect(effectName, sourceType, sourceId, value, isMultiplicative = true) {
        if (!effects[effectName]) {
            effects[effectName] = { sources: [] };
        }
        effects[effectName].sources.push({ sourceType, sourceId, value, isMultiplicative });
    }

    function clearSource(sourceType, sourceId) {
        for (let effName in effects) {
            effects[effName].sources = effects[effName].sources.filter(
                s => !(s.sourceType === sourceType && s.sourceId === sourceId)
            );
        }
    }

    function clearSourceType(sourceType) {
        for (let effName in effects) {
            effects[effName].sources = effects[effName].sources.filter(s => s.sourceType !== sourceType);
        }
    }

    function reset() {
        for (let key in effects) {
            delete effects[key];
        }
    }

    function getMultiplier(effectName) {
        const eff = effects[effectName];
        if (!eff) return 1.0;
        let mult = 1.0;
        let additive = 0.0;
        for (let src of eff.sources) {
            if (src.isMultiplicative) {
                mult *= (1 + src.value);
            } else {
                additive += src.value;
            }
        }
        return mult * (1 + additive);
    }

    function getAdditiveValue(effectName) {
        const eff = effects[effectName];
        if (!eff) return 0;
        let total = 0;
        for (let src of eff.sources) {
            total += src.value;
        }
        return total;
    }

    // 便捷方法：获取建筑产量倍率
    function getBuildingProdMultiplier(buildingId) {
        return getMultiplier(`building.${buildingId}.prod`);
    }

    // 便捷方法：获取建筑消耗倍率
    function getBuildingConsMultiplier(buildingId) {
        return getMultiplier(`building.${buildingId}.cons`);
    }

    // 便捷方法：获取建筑上限倍率
    function getBuildingCapMultiplier(buildingId, resourceName) {
        if (resourceName) {
            const specific = getMultiplier(`building.${buildingId}.cap.${resourceName}`);
            if (specific !== 1.0) return specific;
        }
        return getMultiplier(`building.${buildingId}.cap`);
    }

    // 便捷方法：获取全局资源产量倍率（如事件）
    function getResourceMultiplier(resourceName) {
        return getMultiplier(`resource.${resourceName}.prod`);
    }

    // ========== 从游戏状态刷新所有效果 ==========
    function refreshAllEffects(gameState) {
        reset();

        const state = gameState;

        // 1. 科技效果
        for (let techId in state.techs) {
            const tech = state.techs[techId];
            if (!tech.researched || !tech.effect) continue;
            for (let buildingId in tech.effect) {
                const eff = tech.effect[buildingId];
                if (eff.prodFactor) {
                    registerEffect(`building.${buildingId}.prod`, 'tech', techId, eff.prodFactor, true);
                }
                if (eff.consFactor) {
                    registerEffect(`building.${buildingId}.cons`, 'tech', techId, eff.consFactor, true);
                }
                if (eff.capFactor) {
                    registerEffect(`building.${buildingId}.cap`, 'tech', techId, eff.capFactor, true);
                }
            }
        }

        // 2. 升级效果
        for (let upId in state.upgrades) {
            const up = state.upgrades[upId];
            if (up.level <= 0 || !up.effect) continue;
            for (let buildingId in up.effect) {
                const val = up.effect[buildingId] * up.level;
                registerEffect(`building.${buildingId}.prod`, 'upgrade', upId, val, true);
                registerEffect(`building.${buildingId}.cons`, 'upgrade', upId, val, true);
                registerEffect(`building.${buildingId}.cap`, 'upgrade', upId, val, true);
            }
        }

        // 3. 政策效果
        for (let polId in state.policies) {
            const pol = state.policies[polId];
            if (!pol.visible) continue;
            const opt = pol.options[pol.activePolicy];
            if (opt.prodFactor) {
                for (let buildingId in opt.prodFactor) {
                    registerEffect(`building.${buildingId}.prod`, 'policy', polId, opt.prodFactor[buildingId], true);
                }
            }
            if (opt.consFactor) {
                for (let buildingId in opt.consFactor) {
                    registerEffect(`building.${buildingId}.cons`, 'policy', polId, opt.consFactor[buildingId], true);
                }
            }
            if (opt.capFactor) {
                for (let buildingId in opt.capFactor) {
                    registerEffect(`building.${buildingId}.cap`, 'policy', polId, opt.capFactor[buildingId], true);
                }
            }
        }

        // 4. 永恒升级效果（静态部分）
        for (let permId in state.permanent) {
            const perm = state.permanent[permId];
            if (!perm.researched || !perm.effect) continue;
            const eff = perm.effect;
            if (eff.costRatio) {
                registerEffect('global.cost', 'permanent', permId, eff.costRatio - 1, true);
            }
            if (eff.globalProd) {
                registerEffect('global.prod', 'permanent', permId, eff.globalProd, true);
            }
            if (eff.globalSpeed) {
                registerEffect('global.speed', 'permanent', permId, eff.globalSpeed, true);
            }
            if (eff.globalSpaceProd) {
                registerEffect('global.spaceProd', 'permanent', permId, eff.globalSpaceProd, true);
            }
            // capPerRelic 和 sciCapPerRelicLog 在 production 中动态计算，不注册固定值
        }
        for (let achName in state.achievements) {
            const ach = state.achievements[achName];
            if (!ach.effect) continue;
            const eff = ach.effect;
            if (eff.globalProd) registerEffect('global.prod', 'achievement', achName, eff.globalProd, true);
            if (eff.globalCost) registerEffect('global.cost', 'achievement', achName, eff.globalCost, true);
            if (eff.globalScienceProd) registerEffect('resource.科学.prod', 'achievement', achName, eff.globalScienceProd, true);
            if (eff.globalMilitaryProd) {
                registerEffect('building.军营.prod', 'achievement', achName, eff.globalMilitaryProd, true);
                registerEffect('building.军工厂.prod', 'achievement', achName, eff.globalMilitaryProd, true);
            }
            // 扩展其他效果
        }

        // 5. 建筑间加成（modifiers字段）
        for (let buildingId in state.buildings) {
            const bld = state.buildings[buildingId];
            if (bld.active === 0) continue;
            const cfg = BUILDINGS_CONFIG[buildingId];
            if (!cfg || !cfg.modifiers) continue;
            for (let mod of cfg.modifiers) {
                const val = mod.prodFactor ? mod.prodFactor * bld.active : 0;
                if (val) registerEffect(`building.${mod.target}.prod`, 'buildingMod', buildingId, val, true);
                const consVal = mod.consFactor ? mod.consFactor * bld.active : 0;
                if (consVal) registerEffect(`building.${mod.target}.cons`, 'buildingMod', buildingId, consVal, true);
                const capVal = mod.capFactor ? mod.capFactor * bld.active : 0;
                if (capVal) registerEffect(`building.${mod.target}.cap`, 'buildingMod', buildingId, capVal, true);
            }
        }

        // 6. 晶体效果
        for (let crystal of state.crystals.equipped) {
            if (!crystal) continue;
            for (let eff of crystal.effects) {
                const target = eff.target === 'global' ? 'global' : eff.target;
                if (eff.type === 'prod') {
                    registerEffect(`building.${target}.prod`, 'crystal', crystal.id, eff.value, true);
                } else if (eff.type === 'cons') {
                    registerEffect(`building.${target}.cons`, 'crystal', crystal.id, eff.value, true);
                } else if (eff.type === 'cap') {
                    registerEffect(`building.${target}.cap`, 'crystal', crystal.id, eff.value, true);
                } else if (eff.type === 'happiness') {
                    registerEffect('global.happiness', 'crystal', crystal.id, eff.value * 100, false);
                }
            }
        }

        // 7. 事件效果
        if (state.activeRandomEvents) {
            for (let ev of state.activeRandomEvents) {
                if (!ev.effects) continue;
                for (let eff of ev.effects) {
                    if (eff.type === 'resourceMultiplier') {
                        registerEffect(`resource.${eff.resource}.prod`, 'event', ev.id, eff.multiplier - 1, true);
                    } else if (eff.type === 'buildingMultiplier') {
                        const field = eff.field || 'prod';
                        registerEffect(`building.${eff.building}.${field}`, 'event', ev.id, eff.multiplier - 1, true);
                    } else if (eff.type === 'happinessMod') {
                        registerEffect('global.happiness', 'event', ev.id, eff.value, false);
                    }
                }
            }
        }
        // 8. 激活的挑战效果
        for (let challengeId of state.activeChallenges) {
            const tech = TECHS_CONFIG[challengeId];
            if (!tech || !tech.challenge) continue;
            const eff = tech.challenge.duringEffect;
            if (!eff) continue;
            for (let key in eff) {
                if (key === 'globalProd') {
                    registerEffect('global.prod', 'challenge', challengeId, eff.globalProd, true);
                } else if (key === 'globalCap') {
                    registerEffect('global.cap', 'challenge', challengeId, eff.globalCap, true);
                } else if (key === 'globalCost') {
                    registerEffect('global.cost', 'challenge', challengeId, eff.globalCost, true);
                } else if (key === 'globalScienceProd') {
                    registerEffect('resource.科学.prod', 'challenge', challengeId, eff.globalScienceProd, true);
                } else if (key === 'globalMilitaryProd') {
                    registerEffect('building.军营.prod', 'challenge', challengeId, eff.globalMilitaryProd, true);
                } else {
                    if (typeof eff[key] === 'object' && eff[key].prodFactor) {
                        registerEffect(`resource.${key}.prod`, 'challenge', challengeId, eff[key].prodFactor, true);
                    }
                }
            }
        }
    }

    return {
        registerEffect,
        clearSource,
        clearSourceType,
        reset,
        refreshAllEffects,
        getMultiplier,
        getAdditiveValue,
        getBuildingProdMultiplier,
        getBuildingConsMultiplier,
        getBuildingCapMultiplier,
        getResourceMultiplier
    };
})();

window.EffectsManager = EffectsManager;