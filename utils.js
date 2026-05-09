// utils.js
function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return "0";
    if (n === Infinity) return "∞";
    if (n === -Infinity) return "-∞";

    const sign = n < 0 ? "-" : "";
    const absN = Math.abs(n);

    if (absN < 1e3) return sign + absN.toFixed(2);
    if (absN < 1e6) return sign + (absN / 1e3).toFixed(2) + "K";
    if (absN < 1e9) return sign + (absN / 1e6).toFixed(2) + "M";
    if (absN < 1e12) return sign + (absN / 1e9).toFixed(2) + "G";
    return sign + (absN / 1e12).toFixed(2) + "T";
}

function canAfford(costMap) {
    for (let r in costMap) {
        if ((GameState.resources[r]?.amount || 0) < costMap[r]) return false;
    }
    return true;
}



// 检查解锁条件（支持多种类型条件）
function checkUnlockCondition(condition, state) {
    if (!condition) return true;  // 无条件则默认可见
    if (condition.tech) {
        return state.techs[condition.tech]?.researched || false;
    }
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
        for (let bKey in GameState.buildings) {
            const cfg = BUILDINGS_CONFIG[bKey];
            if (cfg) {
                let visible = checkUnlockCondition(cfg.unlockCondition, GameState);
                // 新增:如果建筑数量大于0,强制可见
                if (GameState.buildings[bKey].count > 0) visible = true;
                GameState.buildings[bKey].visible = visible;
            }
        }
    }
    
    // 升级
    for (let uKey in GameState.upgrades) {
        const up = GameState.upgrades[uKey];
        if (up) {
            up.visible = checkUnlockCondition(up.unlockCondition, GameState);
        }
    }
    
    for (let pKey in GameState.policies) {
        const pol = GameState.policies[pKey];
        if (pol && pol.unlockCondition && pol.unlockCondition.tech) {
            pol.visible = GameState.techs[pol.unlockCondition.tech]?.researched || false;
        }
    }
}

function onTechResearched(tech) {
    // 科技研究完成后，只需刷新可见性即可
    refreshAllVisibility();
}

function formatLocalNumber(n) {
    if (typeof n !== 'number') return '0';
    const fixed = n.toFixed(2);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}
function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "∞";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}时${mins}分${secs}秒`;
    if (mins > 0) return `${mins}分${secs}秒`;
    return `${secs}秒`;
}
function randomSeeded() {
    // 确保种子存在且为整数
    let seed = GameState.seed || (GameState.seed = Date.now() >>> 0);
    // 线性同余生成器：multiplier = 1664525, increment = 1013904223
    seed = (seed * 1664525 + 1013904223) >>> 0;
    GameState.seed = seed;   // 每次调用都会推进种子状态
    return seed / 4294967296; // 返回 0 ~ 1
}

// 同时提供一个重置/初始化种子的工具（可选）
function resetSeed(newSeed) {
    GameState.seed = newSeed;
}

window.randomSeeded = randomSeeded;
formatTime = formatTime;          // 全局可用
formatLocalNumber = formatLocalNumber;

formatNumber = formatNumber;
canAfford = canAfford;
checkUnlockCondition = checkUnlockCondition;
refreshAllVisibility = refreshAllVisibility;
onTechResearched = onTechResearched;