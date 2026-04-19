// core.js
class GameEngine {
    buyBuilding(key, quantity = 1) {
        const b = GameState.buildings[key];
        if (!b) return false;
        let successCount = 0;
        for (let i = 0; i < quantity; i++) {
            if (!consumeResources(b.price)) break;
            b.count++;
            b.active++;
            successCount++;
        }
        if (successCount > 0) {
            updateBuildingPrices();
            computeProductionAndCaps();
            renderAll();
        }
        return successCount > 0;
    }

    researchTech(key) {
        const t = GameState.techs[key];
        if (t.researched) return false;
        if (!consumeResources(t.price)) return false;
        t.researched = true;
        
        // 刷新所有可见性
        refreshAllVisibility();
        
        updateBuildingPrices();
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
        return true;
    }

    buyUpgrade(key) {
        const up = GameState.upgrades[key];
        if (!up.visible) return false;
        if (!consumeResources(up.price)) return false;
        up.level++;
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
        return true;
    }

    switchPolicy(policyName, optionValue) {
        const policy = GameState.policies[policyName];
        if (!policy) return false;
        const option = policy.options[optionValue];
        const cost = {政策点: option.price || 0};
        if (!consumeResources(cost)) return false;
        policy.activePolicy = optionValue;
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
        if (!consumeResources(p.price)) return false;
        p.researched = true;
        updateBuildingPrices();
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
        return true;
    }

    performAction(actionId) {
        const handlers = {
            collect_wood: () => {
                GameState.resources["木头"].amount = Math.min(
                    GameState.resources["木头"].cap,
                    GameState.resources["木头"].amount + 1
                );
                return true;
            },
            collect_stone: () => {
                GameState.resources["石头"].amount = Math.min(
                    GameState.resources["石头"].cap,
                    GameState.resources["石头"].amount + 1
                );
                return true;
            },
            research_tech: () => {
                GameState.resources["科学"].amount = Math.min(
                    GameState.resources["科学"].cap,
                    GameState.resources["科学"].amount + 1
                );
                return true;
            },
            war: () => {
                const armsAmount = GameState.resources["军备"]?.amount || 0;
                if (armsAmount < 100) {
                    alert("需要至少 100 军备才能发动战争！");
                    return false;
                }
                if (GameState.crystals.inventory.length >= 3) {
                    alert("晶体库存已满，无法获得新晶体！请先丢弃或装备一些晶体。");
                    return false;
                }
                let failChance = Formulas.calcWarFailChance(armsAmount);
                let isFailed = Math.random() < failChance;
                if (isFailed) {
                    addEventLog(`战争失败！消耗了 ${formatNumber(armsAmount)} 军备，一无所获。`);
                } else {
                    const crystal = generateCrystalFromWar(armsAmount);
                    GameState.crystals.inventory.push(crystal);
                    addEventLog(`战争胜利！获得晶体「${crystal.name}」，消耗 ${formatNumber(armsAmount)} 军备。`);
                }
                GameState.resources["军备"].amount = 0;
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