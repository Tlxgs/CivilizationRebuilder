// 通用软重置
function softReset(extraRelic = 0, extraDarkEnergy = 0) {
    const permBackup = JSON.parse(JSON.stringify(GameState.permanent));
    const relic = GameState.resources["遗物"]?.amount || 0;
    const darkEnergy = GameState.resources["暗能量"]?.amount || 0;
    GameState.speed = 1;

    const timeCrystal = GameState.resources["时间晶体"]?.amount || 0;
    for (let r in GameState.resources) {
        if (r === "时间晶体") GameState.resources[r].amount = timeCrystal;       // 保留时间晶体
        else if (r === "遗物") GameState.resources[r].amount = relic + extraRelic;
        else if (r === "暗能量") GameState.resources[r].amount = darkEnergy + extraDarkEnergy;
        else GameState.resources[r].amount = 0;
        GameState.resources[r].visible = (GameState.resources[r].amount > 0) || (r === "科学");
    }

    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        bd.count = 0;
        bd.active = 0;
        bd.visible = false;
    }

    for (let t in GameState.techs) GameState.techs[t].researched = false;
    for (let u in GameState.upgrades) {
        GameState.upgrades[u].level = 0;
        GameState.upgrades[u].visible = false;
    }
    for (let p in GameState.policies) GameState.policies[p].visible = false;

    GameState.permanent = permBackup;

    ProductionEngine.updateBuildingPrices();
    ProductionEngine.updateUpgradePrices();
    ProductionEngine.computeProductionAndCaps();
    renderAll();
}

function nukeReset() {
    const relicGain = Formulas.calcRelicGainFromNuke(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity   // 修正处
    );
    if (confirm(`发射核弹！\n将执行软重置，并获得 ${relicGain} 遗物。\n确定吗？`)) {
        softReset(relicGain, 0);
        addEventLog(`发射核弹！获得 ${relicGain} 遗物。`);
    }
}

function vacuumDecayReset() {
    const extraRelic = Formulas.calcRelicGainFromVacuum(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity 
    );
    const darkMatterCount = Math.floor(Math.sqrt(1+extraRelic));
    if (confirm(`执行真空衰变！\n获得遗物：${extraRelic}\n获得暗能量：${darkMatterCount}\n确定吗？`)) {
        softReset(extraRelic, darkMatterCount);
        addEventLog(`真空衰变！获得 ${extraRelic} 遗物和 ${darkMatterCount} 暗能量。`);
    }
}

function hardReset() {
    window._hardResetting = true; 
    localStorage.clear();
    location.reload();
}

function getMarketTradeVolume() {
    const marketActive = GameState.buildings["市场"]?.active || 0;
    const starMarketActive = GameState.buildings["星际交易站"]?.active || 0;
    return Formulas.calcMarketTradeVolume(marketActive, starMarketActive);
}

function buyResource(resourceName) {
    const volume = getMarketTradeVolume();
    if (volume <= 0) return false;
    const res = GameState.resources[resourceName];
    if (!res || res.value === undefined) return false;   // 修改点
    const { costGold, gainResource } = Formulas.calcBuyResourceParams(volume, res.value, res.heat || 1);
    if ((GameState.resources["金"]?.amount || 0) < costGold) return false;
    GameState.resources["金"].amount -= costGold;
    let newAmount = res.amount + gainResource;
    res.amount = Math.min(res.cap, newAmount);
    if (res.amount > 0) res.visible = true;
    if (gainResource > 0.0001) {
        let increase = 0.08 * Math.random() + Math.sqrt(res.heat) * 0.08;
        res.heat = Math.min(1000, res.heat + increase);
    }
    return true;
}

function sellResource(resourceName) {
    const volume = getMarketTradeVolume();
    if (volume <= 0) return false;
    const res = GameState.resources[resourceName];
    if (!res || res.value === undefined) return false;   // 修改点
    const { sellAmount, gainGold } = Formulas.calcSellResourceParams(volume, res.value, res.heat || 1);
    if (res.amount < sellAmount) return false;
    res.amount -= sellAmount;
    GameState.resources["金"].amount += gainGold;
    if (GameState.resources["金"].amount > 0) GameState.resources["金"].visible = true;
    if (sellAmount > 0.0001) {
        let decrease = 0.08 * Math.random() + Math.sqrt(res.heat) * 0.08;
        res.heat = Math.max(0.001, res.heat - decrease);
    }
    return true;
}

// 日志
function addEventLog(text) {
    const totalDays = GameState.gameDays;
    const year = Math.floor(totalDays / 360);
    const day = (totalDays % 360) + 1;
    const dateStr = `${year}年${day}日`;
    GameState.eventLogs.unshift({ dateStr, text });
    if (GameState.eventLogs.length > 20) GameState.eventLogs.pop();
}

function generateCrystalFromWar(armsAmount) {
    const quality = Formulas.calcCrystalQuality(armsAmount);
    const numEffects = Formulas.calcCrystalEffectCount(quality);
    
    let effects = [];
    const effectTypes = ['prod', 'cons', 'cap', 'happiness'];
    
    for (let i = 0; i < numEffects; i++) {
        let type = effectTypes[Math.floor(Math.random() * effectTypes.length)];
        let target;
        let availableTargets;
        
        switch (type) {
            case 'happiness':
                target = 'global';
                break;
            case 'prod':
                availableTargets = getBuildingsWithProduce();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                break;
            case 'cons':
                availableTargets = getBuildingsWithConsume();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                break;
            case 'cap':
                availableTargets = getBuildingsWithCap();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                break;
        }
        
        let baseValue = Formulas.calcCrystalEffectBaseValue(quality);
        
        // 根据类型调整系数
        if (type === 'happiness') baseValue *= 0.5;
        if (type === 'cap') baseValue *= 0.3;
        
        const positiveChance = Formulas.calcCrystalPositiveChance(quality);
        let isPositive = Math.random() < positiveChance;
        let value = isPositive ? baseValue : -baseValue;
        
        effects.push({ type, target, value });
    }
    
    // 确保至少有一条词条
    if (effects.length === 0) {
        effects.push({ type: 'prod', target: 'global', value: 0.01 });
    }
    
    const crystalName = generateCrystalName(effects);
    return { id: Date.now() + Math.random(), name: crystalName, effects: effects };
}

function generateCrystalName(effects) {
    const prefixes = ["闪耀", "暗影", "炽热", "冰霜", "虚空", "星辰", "混沌", "秩序", "勇猛", "智慧"];
    const suffixes = ["之石", "结晶", "碎片", "核心", "精华", "徽记"];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + 
           suffixes[Math.floor(Math.random() * suffixes.length)];
}
function equipCrystal(inventoryIndex) {
    let crystal = GameState.crystals.inventory[inventoryIndex];
    if (!crystal) return;
    let emptySlot = GameState.crystals.equipped.findIndex(slot => slot === null);
    if (emptySlot === -1) {
        alert("装备槽已满，请先卸下一个晶体。");
        return;
    }
    GameState.crystals.equipped[emptySlot] = crystal;
    GameState.crystals.inventory.splice(inventoryIndex, 1);
    computeProductionAndCaps();
    renderAll();
}

function unequipCrystal(slotIndex) {
    let crystal = GameState.crystals.equipped[slotIndex];
    if (!crystal) return;
    if (GameState.crystals.inventory.length >= 3) {
        alert("库存已满，无法卸下。请先丢弃一个库存晶体。");
        return;
    }
    GameState.crystals.equipped[slotIndex] = null;
    GameState.crystals.inventory.push(crystal);
    computeProductionAndCaps();
    renderAll();
}

function discardCrystal(inventoryIndex) {
    GameState.crystals.inventory.splice(inventoryIndex, 1);
    computeProductionAndCaps();
    renderAll();
}
function getBuildingsWithProduce() {
    return Object.keys(GameState.buildings).filter(key => {
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const produces = typeof cfg.produces === 'function' ? cfg.produces(GameState) : (cfg.produces || {});
        return Object.keys(produces).length > 0;
    });
}

function getBuildingsWithConsume() {
    return Object.keys(GameState.buildings).filter(key => {
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const consumes = typeof cfg.consumes === 'function' ? cfg.consumes(GameState) : (cfg.consumes || {});
        return Object.keys(consumes).length > 0;
    });
}

function getBuildingsWithCap() {
    return Object.keys(GameState.buildings).filter(key => {
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const caps = typeof cfg.caps === 'function' ? cfg.caps(GameState) : (cfg.caps || {});
        return Object.keys(caps).length > 0;
    });
}