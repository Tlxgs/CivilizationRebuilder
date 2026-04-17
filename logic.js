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
        if (r === "暗能量") continue; 
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
            const relicGain = getRelicGain();
            if (relicGain > 0) {
                GameState.resources["遗物"].amount += relicGain;
            }
            softResetKeepPermanent();
            break;
        case "vacuum_decay":
            const extraRelic = getRelicGain() * 2;
            const darkMatterCount = GameState.buildings["暗物质研究所"]?.count || 0;
            if (confirm(`执行真空衰变！\n获得额外遗物：${extraRelic}\n获得暗能量：${darkMatterCount}\n确定要重置吗？`)) {
                vacuumDecayReset();
                renderAll();
            }
            break;
        case "cheat_fill":
            cheatFillResources();
            GameState.resources["遗物"].amount += 100;
            GameState.resources["暗能量"].amount +=100;
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
function softResetKeepPermanent() {
    GameState.happiness = 100;
    const relic = GameState.resources["遗物"]?.amount || 0;
    const darkEnergy = GameState.resources["暗能量"]?.amount || 0;
    const permBackup = JSON.parse(JSON.stringify(GameState.permanent));

    for (let r in GameState.resources) {
        if (r === "遗物") GameState.resources[r].amount = relic;
        else if (r === "暗能量") GameState.resources[r].amount = darkEnergy;
        else GameState.resources[r].amount = 0;
        GameState.resources[r].visible = (GameState.resources[r].amount > 0) || (r === "木头") || (r === "科学");
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
    const starmarket = GameState.buildings["星际交易站"];
    return (market?.active || 0) * 10 + (starmarket?.active || 0) * 5000; 
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
        let increase = 0.08 * Math.random() + Math.sqrt(heat) * 0.08;
        res.heat = Math.min(1000, res.heat + increase);
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
        let decrease = 0.08 * Math.random() + Math.sqrt(heat) * 0.08;
        res.heat = Math.max(0.001, res.heat - decrease);
    }
    return true;
}
function vacuumDecayReset() {
    // 额外获得遗物：核弹获取量的2倍
    const extraRelic = getRelicGain() * 2;
    // 获得暗能量数量 = 暗物质研究所数量（重置前的数量）
    const darkMatterLabCount = GameState.buildings["暗物质研究所"]?.count || 0;
    const extraDarkEnergy = darkMatterLabCount;

    GameState.resources["遗物"].amount += extraRelic;
    GameState.resources["暗能量"].amount += extraDarkEnergy;

    softResetKeepPermanent();
}
// 添加一条日志
function addEventLog(text) {
    const totalDays = GameState.gameDays;
    const year = Math.floor(totalDays / 365);
    const day = (totalDays % 365) + 1;
    const dateStr = `${year}年${day}日`;
    GameState.eventLogs.unshift({ dateStr, text });  // 最新在前
    if (GameState.eventLogs.length > 20) GameState.eventLogs.pop();
}

// 结束当前随机事件
function endCurrentEvent() {
    if (!GameState.activeRandomEvent) return;
    const event = GameState.activeRandomEvent;
    addEventLog(`[事件结束] ${event.name} 效果已消失`);
    GameState.activeRandomEvent = null;
    computeProductionAndCaps();
    if (typeof renderAll === 'function') renderAll();
}

function triggerRandomEvent() {
    if (GameState.activeRandomEvent) return false;
    if (Math.random() > 0.01) return false;  // 1%概率

    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    GameState.activeRandomEvent = { ...event };
    const startDay = GameState.gameDays;
    GameState.activeEventEndDay = startDay + event.durationDays;

    let effectDesc = Object.entries(event.effects)
        .map(([res, mul]) => {
            const percent = Math.abs((mul - 1) * 100);
            if (mul > 1) {
                return `${res}产量 +${percent.toFixed(0)}%`;
            } else if (mul < 1) {
                return `${res}产量 -${percent.toFixed(0)}%`;
            }
        })
        .join(', ');
    addEventLog(`随机事件触发：${event.name}！${event.desc} (${effectDesc})，持续${event.durationDays}天`);
    computeProductionAndCaps();
    if (typeof renderAll === 'function') renderAll();
    return true;
}
// 每天推进（每1秒调用一次，即5 tick）
function advanceDay() {
    GameState.gameDays++;
    const year = Math.floor(GameState.gameDays / 365);
    const day = (GameState.gameDays % 365) + 1;
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.innerText = `${year}年${day}日`;

    if (GameState.activeRandomEvent && GameState.gameDays >= GameState.activeEventEndDay) {
        endCurrentEvent();
    }

    if (!GameState.activeRandomEvent) {
        triggerRandomEvent();
    }

    if (typeof renderLogPanel === 'function') renderLogPanel();
}

// 渲染日志面板
function renderLogPanel() {
    const container = document.getElementById('event-log-list');
    if (!container) return;
    if (!GameState.eventLogs || GameState.eventLogs.length === 0) {
        container.innerHTML = '<div class="log-entry" style="color:#8a9aac;">暂无事件日志</div>';
        return;
    }
    let html = '';
    for (let log of GameState.eventLogs) {
        html += `<div class="log-entry">
                    <span class="log-date">[${log.dateStr}]</span>
                    <span>${log.text}</span>
                 </div>`;
    }
    container.innerHTML = html;
}