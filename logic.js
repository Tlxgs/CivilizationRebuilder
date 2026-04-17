// 检查是否可支付
function canAfford(costMap) {
    for (let r in costMap) {
        if ((GameState.resources[r]?.amount || 0) < costMap[r]) return false;
    }
    return true;
}

// 消耗资源
function consumeResources(costMap) {
    if (!canAfford(costMap)) return false;
    for (let r in costMap) {
        GameState.resources[r].amount -= costMap[r];
    }
    return true;
}

// 购买建筑
function buyBuilding(key) {
    const b = GameState.buildings[key];
    if (!b || !consumeResources(b.price)) return false;
    b.count++;
    b.active++;
    updateBuildingPrices();
    return true;
}
function researchTech(key) {
    const t = GameState.techs[key];
    if (t.researched) return false;
    if (!consumeResources(t.price)) return false;
    t.researched = true;

    if (t.unlocks) {
        t.unlocks.forEach(b => { if (GameState.buildings[b]) GameState.buildings[b].visible = true; });
    }
    if (t.unlocksPolicies) {
        t.unlocksPolicies.forEach(p => { if (GameState.policies[p]) GameState.policies[p].visible = true; });
    }
    if (t.unlocksUpgrades) {
        t.unlocksUpgrades.forEach(u => { if (GameState.upgrades[u]) GameState.upgrades[u].visible = true; });
    }
    return true;
}

// 购买升级：每级增加加成值
function buyUpgrade(key) {
    const up = GameState.upgrades[key];
    if (!consumeResources(up.price)) return false;
    up.level++;
    updateUpgradePrices();
    return true;
}

function switchPolicy(policyName, optionValue) {
    const policy = GameState.policies[policyName];
    if (!policy) return false;
    const option = policy.options[optionValue];
    const cost = option.price || 0;
    if ((GameState.resources["政策点"]?.amount || 0) < cost) return false;
    GameState.resources["政策点"].amount -= cost;
    policy.activePolicy = optionValue;
    return true;
}


function buyPermanent(key) {
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
    
    return true;
}

// 作弊填满资源
function cheatFillResources() {
    for (let r in GameState.resources) {
        if (r === "遗物") continue;  // 遗物不填满
        const res = GameState.resources[r];
        if (!res.visible) continue;   // 只填满已可见的资源
        if (res.cap === Infinity) continue;
        res.amount = res.cap;
        // 如果原本 amount 为0，填满后设为可见（但原本已可见无需重复设置）
        if (res.amount > 0) res.visible = true;
    }
}

// 行动函数
function performAction(actionId) {
    switch(actionId) {
        case "collect_wood":
            GameState.resources["木头"].amount = Math.min(
                GameState.resources["木头"].cap,
                GameState.resources["木头"].amount + 1
            );
            break;
        case "collect_stone":
            GameState.resources["石头"].amount = Math.min(
                GameState.resources["石头"].cap,
                GameState.resources["石头"].amount + 1
            );
            break;
        case "research_tech":
            GameState.resources["科学"].amount = Math.min(
                GameState.resources["科学"].cap,
                GameState.resources["科学"].amount + 1
            );
            break;
        case "nuke_reset":
            const scienceCap = GameState.resources["科学"].cap;
            const relicGain = Math.floor(Math.log(scienceCap)**2);
            if (relicGain > 0) {
                GameState.resources["遗物"].amount += relicGain;
            }
            softResetKeepRelic();
            break;
        case "cheat_fill":
            cheatFillResources();
            GameState.resources["遗物"].amount += 100;
            computeProductionAndCaps();
            break;
        default:
            return false;
    }
    return true;
}

function resetBuildingsToOriginal() {
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        bd.count = 0;
        bd.active = 0;
        bd.visible = false;
    }
}

// 软重置但保留遗物（核弹用）
function softResetKeepRelic() {
    const relic = GameState.resources["遗物"]?.amount || 0;
    const permBackup = JSON.parse(JSON.stringify(GameState.permanent));
    
    for (let r in GameState.resources) {
        let def = (r === "遗物") ? relic : 0;
        GameState.resources[r].amount = def;
        GameState.resources[r].visible = (def > 0) || (r === "木头") || (r === "科学");
    }
    
    resetBuildingsToOriginal();
    
    for (let t in GameState.techs) GameState.techs[t].researched = false;
    for (let u in GameState.upgrades) {
        GameState.upgrades[u].level = 0;
        GameState.upgrades[u].visible = false;
    }
    for (let p in GameState.policies) GameState.policies[p].visible = false;
    GameState.permanent = permBackup;
    
    updateBuildingPrices();
    updateUpgradePrices();
}

// 软重置
function softReset() {
    const relic = GameState.resources["遗物"]?.amount || 0;
    const permBackup = JSON.parse(JSON.stringify(GameState.permanent));
    
    for (let r in GameState.resources) {
        let def = (r === "遗物") ? relic : 0;
        GameState.resources[r].amount = def;
        GameState.resources[r].visible = (def > 0) || (r === "木头") || (r === "科学");
    }
    
    resetBuildingsToOriginal();
    
    for (let t in GameState.techs) GameState.techs[t].researched = false;
    for (let u in GameState.upgrades) {
        GameState.upgrades[u].level = 0;
        GameState.upgrades[u].visible = false;
    }
    for (let p in GameState.policies) GameState.policies[p].visible = false;
    GameState.permanent = permBackup;
    
    updateBuildingPrices();
    updateUpgradePrices();
}

// 硬重置
function hardReset() {
    localStorage.clear();
    location.reload();
}


function getMarketTradeVolume() {
    const market = GameState.buildings["市场"];
    if (!market || !market.visible) return 0;
    return market.active * 10; 
}

// 购买资源
function buyResource(resourceName) {
    const marketVolume = getMarketTradeVolume();
    if (marketVolume <= 0) return false;
    
    const res = GameState.resources[resourceName];
    if (!res || !res.hasOwnProperty('value')) return false;
    
    const heat = res.heat || 1;
    const costGold = marketVolume * heat;  // 消耗金
    const gainResource = marketVolume / res.value;
    
    // 检查金是否足够
    if ((GameState.resources["金"]?.amount || 0) < costGold) return false;
    
    // 执行交易
    GameState.resources["金"].amount -= costGold;
    let newAmount = res.amount + gainResource;
    res.amount = Math.min(res.cap, newAmount);
    if (res.amount > 0) res.visible = true;
    
    // 增加热度
    if (gainResource > 0.0001) {
        let increase = 0.1 * Math.random() + Math.sqrt(heat) * 0.1;
        res.heat = Math.min(100, res.heat + increase);
    }
    return true;
}

// 出售资源
function sellResource(resourceName) {
    const marketVolume = getMarketTradeVolume();
    if (marketVolume <= 0) return false;
    
    const res = GameState.resources[resourceName];
    if (!res || !res.hasOwnProperty('value')) return false;
    
    const heat = res.heat || 1;
    const sellResourceAmount = marketVolume / res.value;
    const gainGold = marketVolume * heat * 0.8;  // 出售获得80%金
    
    // 检查资源是否足够
    if (res.amount < sellResourceAmount) return false;
    
    // 执行交易
    res.amount -= sellResourceAmount;
    GameState.resources["金"].amount += gainGold;
    if (GameState.resources["金"].amount > 0) GameState.resources["金"].visible = true;
    
    // 降低热度
    if (sellResourceAmount > 0.0001) {
        let decrease = 0.1 * Math.random() + Math.sqrt(heat) * 0.1;
        res.heat = Math.max(0.01, res.heat - decrease);
    }
    return true;
}
