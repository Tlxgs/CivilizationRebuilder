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

// 研究科技（修正）
function researchTech(key) {
    const t = GameState.techs[key];
    if (t.researched) return false;
    if (!consumeResources(t.price)) return false;
    t.researched = true;
    
    if (t.unlocks) {
        t.unlocks.forEach(b => {
            if (GameState.buildings[b]) GameState.buildings[b].visible = true;
        });
    }
    if (t.unlocksPolicies) {
        t.unlocksPolicies.forEach(p => {
            if (GameState.policies[p]) GameState.policies[p].visible = true;
        });
    }
    if (t.unlocksUpgrades) {
        t.unlocksUpgrades.forEach(u => {
            if (GameState.upgrades[u]) GameState.upgrades[u].visible = true;
        });
    }
    
    if (t.effect) {
        for (let building in t.effect) {
            const eff = t.effect[building];
            if (typeof eff === 'number') {
                if (GameState.buildings[building]) {
                    GameState.buildings[building].efficiency += eff;
                }
            }
            // 对象类型（如 {prod:..., cap:...}）不需要直接修改，会在utils中动态读取
        }
    }
    
    if (key === "管理学") GameState.policies["基础资源政策"].visible = true;
    if (key === "冶炼管理") GameState.policies["冶炼方式"].visible = true;
    if (key === "金融学") GameState.policies["经济观念"].visible = true;
    if (key === "林业工程") GameState.upgrades["伐木场优化"].visible = true;
    if (key === "高效采石") GameState.upgrades["采石场优化"].visible = true;
    if (key === "压缩存储技术") GameState.upgrades["储存优化"].visible = true;
    if (key === "运筹学") GameState.upgrades["工厂优化"].visible = true;
    return true;
}

// 购买升级（增加建筑效率）
function buyUpgrade(key) {
    const up = GameState.upgrades[key];
    if (!consumeResources(up.price)) return false;
    up.level++;
    for (let b in up.effect) {
        if (GameState.buildings[b]) {
            GameState.buildings[b].efficiency += up.effect[b];
        }
    }
    updateUpgradePrices();
    return true;
}

// 购买永久科技
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
        if (r === "遗物") continue;
        const res = GameState.resources[r];
        if (res.cap === Infinity) continue;
        res.amount = res.cap;
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
            const relicGain = Math.floor(Math.log(scienceCap))**2;
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

// 重置建筑到原始状态
function resetBuildingsToOriginal() {
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        bd.produce = JSON.parse(JSON.stringify(bd.originalProduce));
        bd.capProvide = JSON.parse(JSON.stringify(bd.originalCapProvide));
        bd.count = 0;
        bd.active = 0;
        bd.efficiency = 1.0;
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

// 软重置（保留遗物和永久科技）
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

// 资源更新（每tick 0.2秒）
function tickResources(deltaSec = 0.2) {
    computeProductionAndCaps();
    const res = GameState.resources;
    for (let r in res) {
        let prod = res[r].production;
        let newAmount = res[r].amount + prod * deltaSec;
        res[r].amount = Math.min(res[r].cap, Math.max(0, newAmount));
        if (res[r].amount > 0.01) res[r].visible = true;
    }
}
// 在文件末尾添加贸易相关函数

// 获取当前市场交易量（每次交易的基础数量）
function getMarketTradeVolume() {
    const market = GameState.buildings["市场"];
    if (!market || !market.visible) return 0;
    return market.active * market.efficiency * 10;
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
        res.heat = Math.min(20, res.heat + increase);
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
        res.heat = Math.max(0.5, res.heat - decrease);
    }
    return true;
}

// 修改政策切换逻辑：消耗政策点
// 在 ui.js 的 change 事件中调用新函数，而不是直接修改
function switchPolicy(policyName, optionValue) {
    const policy = GameState.policies[policyName];
    if (!policy) return false;
    
    const option = policy.options[optionValue];
    const cost = option.price || 0;
    
    // 检查政策点是否足够
    if ((GameState.resources["政策点"]?.amount || 0) < cost) return false;
    
    // 扣除政策点
    GameState.resources["政策点"].amount -= cost;
    
    // 切换政策
    policy.activePolicy = optionValue;
    
    return true;
}