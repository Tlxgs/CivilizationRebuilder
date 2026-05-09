// core.js
class GameEngine {
    switchBuildingMode(buildingKey) {
        const bld = GameState.buildings[buildingKey];
        const cfg = BUILDINGS_CONFIG[buildingKey];
        if (!cfg.modes || cfg.modes.length <= 1) return false;
        bld.mode = ((bld.mode || 0) + 1) % cfg.modes.length;
        ProductionEngine.computeProductionAndCaps();
        updateBuildingPrices();
        updateUpgradePrices();
        renderAll();
        return true;
    }
    buyBuilding(key, quantity = 1) {
        const b = GameState.buildings[key];
        const cfg = BUILDINGS_CONFIG[key];
        if (!b || !cfg) return false;
        let successCount = 0;
        for (let i = 0; i < quantity; i++) {
            if (!ResourcesManager.consume(b.price)) break;
            b.count++;
            b.active++;
            successCount++;
            b.price = cfg.cost(GameState, b.count);
        }
        if (successCount > 0) {
            updateBuildingPrices();
            computeProductionAndCaps();
            renderAll();
            refreshAllDynamicColors();
        }
        return successCount > 0;
    }

    researchTech(key) {
        const t = GameState.techs[key];
        if (t.researched) return false;
        if (!ResourcesManager.consume(t.price)) return false;
        if (t.challenge) {
            const confirmMsg = `⚠️ 警告：研究挑战后除非完成挑战要求或进行软重置，否则不能退出挑战！确定要研究吗？`;
            if (!confirm(confirmMsg)) return false;
        }
        t.researched = true;
        refreshAllVisibility();
        updateBuildingPrices();
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
        return true;
    }

    buyUpgrade(key, quantity = 1) {
        const up = GameState.upgrades[key];
        if (!up.visible) return false;
        let successCount = 0;
        for (let i = 0; i < quantity; i++) {
            if (!canAfford(up.price)) break;
            ResourcesManager.consume(up.price);      // 一定会成功，因为上面检查过
            up.level++;
            // 立即重新计算该升级的价格（下一级）
            up.price = UPGRADES_CONFIG[key].cost(GameState, up.level);
            successCount++;
        }
        if (successCount > 0) {
            updateUpgradePrices();           // 一次性刷新所有升级价格
            computeProductionAndCaps();
            renderAll();
        }
        return successCount > 0;
    }

    setPolicyValue(policyName, value) {
        const policy = GameState.policies[policyName];
        if (!policy) return false;
        const cfg = POLICIES_CONFIG[policyName];
        const costPerUnit = cfg.costPerUnit || 1;
        const delta = Math.abs(value - policy.currentValue);
        const cost = delta * costPerUnit;
        
        value = Math.max(policy.min, Math.min(policy.max, value));
        if (value === policy.currentValue) return true; // 无变化
        
        if (cost > 0) {
            if (!ResourcesManager.consume({ "政策点": cost })) return false;
        }
        
        policy.currentValue = value;
        computeProductionAndCaps();
        renderAll();
        return true;
    }
    buyPermanent(key) {
        const p = GameState.permanent[key];
        if (p.researched) return false;
        if (p.prereq) {
            for (let prereq of p.prereq) {
                if (!GameState.permanent[prereq]?.researched) return false;
            }
        }
        if (!ResourcesManager.consume(p.price)) return false;
        p.researched = true;
        ProductionEngine.refreshEffects()
        updateBuildingPrices();
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
        return true;
    }

    performAction(actionId) {
        const handlers = {
            toggle_speed: () => {
                if (GameState.speed === 2) {
                    GameState.speed = 1;
                    GameLoop.resetTimer();
                    addEventLog("游戏速度恢复为1倍速。");
                    return true;
                } else {
                    if (ResourcesManager.getAmount("时间晶体")<1) {
                        alert("时间晶体不足！");
                        return false;
                    }
                    GameState.speed = 2;
                    GameLoop.resetTimer();
                    return true;
                }
            },
            collect_wood: () => {return ResourcesManager.add({"木头":1})},
            collect_stone: () => {return ResourcesManager.add({"石头":1})},
            research_tech: () => {return ResourcesManager.add({"科学":1})},
            war: () => {
                const armsAmount = ResourcesManager.getAmount("军备");
                if (armsAmount < 100) {
                    alert("需要至少 100 军备才能发动战争！");
                    return false;
                }
                if (GameState.crystals.inventory.length >= 6) {
                    alert("晶体库存已满，无法获得新晶体！请先丢弃或装备一些晶体。");
                    return false;
                }
                let failChance = Formulas.calcWarFailChance(armsAmount);
                let isFailed = randomSeeded() < failChance;
                if (isFailed) {
                    addEventLog(`战争失败！消耗了 ${formatNumber(armsAmount)} 军备，一无所获。`);
                } else {
                    const crystal = generateCrystalFromWar(armsAmount);
                    GameState.crystals.inventory.push(crystal);
                    addEventLog(`战争胜利！获得晶体「${crystal.name}」，消耗 ${formatNumber(armsAmount)} 军备。`);
                }
                ResourcesManager.consumeSingle("军备",armsAmount,true);
                return true;
            },
            nuke_reset: () => {
                nukeReset();
                return true;
            },
            vacuum_decay: () => {
                vacuumDecayReset();
                return true;
            },
            symbiote_reset: () => {
                symbioteReset();
                return true;
            },
            singularity_reset: () => {
                singularityReset();
                return true;
            },
        };

        const handler = handlers[actionId];
        if (!handler) return false;

        const result = handler();
        if (result) {
            computeProductionAndCaps();
            renderAll();
            
        }
        return result;
    }
}

const Core = new GameEngine();