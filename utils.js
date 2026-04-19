// utils.js
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

// 检查解锁条件（支持多种类型条件）
function checkUnlockCondition(condition, state) {
    if (!condition) return true;  // 无条件则默认可见
    
    // 科技条件
    if (condition.tech) {
        return state.techs[condition.tech]?.researched || false;
    }
    // 可扩展：资源条件、建筑条件等
    // if (condition.resource) { ... }
    // if (condition.building) { ... }
    
    return false;
}

// utils.js（只更新 refreshAllVisibility 部分）
function refreshAllVisibility() {
    // 建筑
    for (let bKey in GameState.buildings) {
        const cfg = BUILDINGS_CONFIG[bKey];
        if (cfg) {
            GameState.buildings[bKey].visible = checkUnlockCondition(cfg.unlockCondition, GameState);
        }
    }
    
    // 升级
    for (let uKey in GameState.upgrades) {
        const up = GameState.upgrades[uKey];
        if (up) {
            up.visible = checkUnlockCondition(up.unlockCondition, GameState);
        }
    }
    
    // 政策
    for (let pKey in GameState.policies) {
        const pol = GameState.policies[pKey];
        if (pol) {
            pol.visible = checkUnlockCondition(pol.unlockCondition, GameState);
        }
    }
}

// 研究科技后调用此函数（替代原来的 applyTechUnlocks）
function onTechResearched(tech) {
    // 科技研究完成后，只需刷新可见性即可
    refreshAllVisibility();
    
    // 如果有需要特殊处理的科技效果，可在此添加
}



window.formatNumber = formatNumber;
window.canAfford = canAfford;
window.consumeResources = consumeResources;
window.checkUnlockCondition = checkUnlockCondition;
window.refreshAllVisibility = refreshAllVisibility;
window.onTechResearched = onTechResearched;