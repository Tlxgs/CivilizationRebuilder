// utils.js - 精简后内容（仅保留 formatNumber, canAfford, consumeResources, applyTechUnlocks 等）

function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return "0";
    if (n === Infinity) return "∞";
    if (n < 1e3) return n.toFixed(2);
    if (n < 1e6) return (n/1e3).toFixed(2) + "K";
    if (n < 1e9) return (n/1e6).toFixed(2) + "M";
    if (n < 1e12) return (n/1e9).toFixed(2) + "B";
    return (n/1e12).toFixed(2) + "T";
}

function canAfford(costMap) {
    for (let r in costMap) {
        if ((GameState.resources[r]?.amount || 0) < costMap[r]) return false;
    }
    return true;
}

function consumeResources(costMap) {
    if (!canAfford(costMap)) return false;
    for (let r in costMap) {
        GameState.resources[r].amount -= costMap[r];
    }
    return true;
}

function applyTechUnlocks(tech) {
    if (tech.unlocks) {
        tech.unlocks.forEach(b => {
            if (GameState.buildings[b]) GameState.buildings[b].visible = true;
        });
    }
    if (tech.unlocksPolicies) {
        tech.unlocksPolicies.forEach(p => {
            if (GameState.policies[p]) GameState.policies[p].visible = true;
        });
    }
    if (tech.unlocksUpgrades) {
        tech.unlocksUpgrades.forEach(u => {
            if (GameState.upgrades[u]) GameState.upgrades[u].visible = true;
        });
    }
}


window.formatNumber = formatNumber;
window.canAfford = canAfford;
window.consumeResources = consumeResources;
window.applyTechUnlocks = applyTechUnlocks;