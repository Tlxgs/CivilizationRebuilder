function softReset(extraRelic = 0, extraDarkEnergy = 0,extraSpore=0,extraSingularity=0,extraWisdom=0) {
    clearQueue();
    GameState.gameDays = 0;
    GameState.speed = 1;
    GameState.activeRandomEvents = [];
    for (let r in GameState.resources) {
        if (r === "时间晶体") continue;
        else if (r === "遗物") ResourcesManager.add({"遗物":extraRelic});
        else if (r === "暗能量") ResourcesManager.add({"暗能量":extraDarkEnergy});
        else if (r === "孢子") ResourcesManager.add({"孢子":extraSpore});
        else if (r === "奇点") ResourcesManager.add({"奇点":extraSingularity});
        else if (r === "智慧") ResourcesManager.add({"智慧":extraWisdom});
        else GameState.resources[r].amount = 0;
        if (GameState.achievements&&GameState.achievements["低效"]){
            if (r=="木头"||r=="石头"||r=="科学") GameState.resources[r].amount += 100;
        }
        GameState.resources[r].visible = GameState.resources[r].amount > 0;
    }

    if (GameState.crystals) {
        let removedCount = 0;
        // 过滤库存
        const oldInventory = GameState.crystals.inventory;
        GameState.crystals.inventory = oldInventory.filter(c => {
            if (c && c.fragile) {
                removedCount++;
                return false;
            }
            return true;
        });
        // 清除装备槽中的脆弱晶体
        for (let i = 0; i < GameState.crystals.equipped.length; i++) {
            if (GameState.crystals.equipped[i] && GameState.crystals.equipped[i].fragile) {
                GameState.crystals.equipped[i] = null;
                removedCount++;
            }
        }
    }

    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        bd.count = 0;
        bd.active = 0;
        bd.visible = false;
    }

    for (let t in GameState.techs) {
        GameState.techs[t].researched = false;
    }
    for (let u in GameState.upgrades) {
        GameState.upgrades[u].level = 0;
        GameState.upgrades[u].visible = false;
    }
    for (let p in GameState.policies) GameState.policies[p].visible = false;

    // 重置贸易系统和热度
    TradeEngine.updateMaxTradeVolume(GameState);
    TradeEngine.resetTradeRates(GameState);
    ProductionEngine.updateBuildingPrices();
    ProductionEngine.updateUpgradePrices();
    ProductionEngine.computeProductionAndCaps();
    renderAll();
}

function unlockAchievementsForReset(resetType) {
    if (!ACHIEVEMENTS_CONFIG) return;
    const achievements = GameState.achievements;
    const activeStars = getTotalActiveChallengeStars(); // 现成方法，返回数字

    for (let achCfg of ACHIEVEMENTS_CONFIG) {
        if (achievements[achCfg.id]) continue;
        const cond = achCfg.unlockCondition;
        if (!cond) continue;

        if (cond.type === 'reset') {
            // 检查重置类型
            if (cond.resetType !== 'any' && cond.resetType !== resetType) continue;
            // 检查科技前置
            if (cond.requireTech) {
                const tech = GameState.techs[cond.requireTech];
                if (!tech || !tech.researched) continue;
            }
            // 新增：检查星级条件
            if (typeof cond.minStars === 'number' && activeStars < cond.minStars) continue;

            // 解锁成就
            achievements[achCfg.id] = {
                name: achCfg.name,
                effect: achCfg.effect || {},
                effectText: achCfg.effectText || '',
            };
            addEventLog(`✨ 解锁成就「${achCfg.name}」！`);
            ProductionEngine.refreshEffects();
            renderAll();
        }
    }
}
// 修改 nukeReset 函数
function nukeReset() {
    const relicGain = Formulas.calcRelicGainFromNuke(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity
    );
    // 星级加成
    const stars = getTotalActiveChallengeStars();
    const multiplier = 1 + stars * 0.05;
    const finalRelic = Math.floor(relicGain * multiplier);
    
    if (confirm(`发射核弹！\n将执行软重置，并获得 ${finalRelic} 遗物。\n确定吗？`)) {
        unlockAchievementsForReset('nuke');
        softReset(finalRelic, 0);
        addEventLog(`发射核弹！获得 ${finalRelic} 遗物。`);
    }
}

// 修改 vacuumDecayReset 函数
function vacuumDecayReset() {
    const extraRelic = Formulas.calcRelicGainFromVacuum(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity
    );
    const stars = getTotalActiveChallengeStars();
    const multiplier = 1 + stars * 0.05;
    const finalRelic = Math.floor(extraRelic * multiplier);
    const darkMatterCount = Math.floor(Math.sqrt(1 + extraRelic)*multiplier);
    
    if (confirm(`执行真空衰变！\n获得遗物：${finalRelic}\n获得暗能量：${darkMatterCount}\n确定吗？`)) {
        unlockAchievementsForReset('vacuum');
        softReset(finalRelic, darkMatterCount);
        addEventLog(`真空衰变！获得 ${finalRelic} 遗物和 ${darkMatterCount} 暗能量。`);
    }
}

function symbioteReset() {
    const baseRelicGain = Formulas.calcRelicGainFromNuke(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity
    );
    const stars = getTotalActiveChallengeStars();
    const multiplier = 1 + stars * 0.05;
    const extraRelic = Math.floor(baseRelicGain * 3 * multiplier);
    
    const extraSpore = Math.floor(Math.sqrt(1+baseRelicGain * 3)*multiplier);
    const extraDarkEnergy = Math.floor(0.05*extraSpore*(GameState.buildings["暗能量融合仪"]?.count||0));
    let label=`\n获得暗能量: ${extraDarkEnergy}`
    if (extraDarkEnergy<0.1){
        label="";
    }
    
    if (confirm(`共生重置！\n外星微生物彻底掌控了人类意识，我们……成为了它们的一部分。\n获得遗物: ${extraRelic}${label}\n获得孢子: ${extraSpore}\n确定要献出人类的未来吗？`)) {
        unlockAchievementsForReset('symbiote');
        softReset(extraRelic, extraDarkEnergy, extraSpore);
        addEventLog(`共生重置！人类……以另一种形式延续。`);
    }
}
function singularityReset() {
    const baseRelicGain = Formulas.calcRelicGainFromNuke(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity
    );
    const stars = getTotalActiveChallengeStars();
    const multiplier = 1 + stars * 0.05;
    const extraRelic = Math.floor(baseRelicGain * 5 * multiplier);  // 基础倍数较高
    const extraDarkEnergy = Math.floor(Math.sqrt(1 + extraRelic)*multiplier);
    const extraSingularity = Math.floor((Math.log(300 + extraRelic)-Math.log(300)) * 10 * multiplier);
    
    if (confirm(`将质能转换提升到最高功率！\n获得遗物: ${extraRelic}\n获得暗物质: ${extraDarkEnergy}\n获得奇点: ${extraSingularity}\n确定吗？`)) {
        unlockAchievementsForReset('singularity');  // 可添加对应成就（若需要）
        softReset(extraRelic, extraDarkEnergy, 0, extraSingularity);
        addEventLog(`奇点转换！获得 ${extraRelic} 遗物, ${extraDarkEnergy}暗物质, ${extraSingularity} 奇点。`);
    }
}

function consciousReset() {
    const baseRelicGain = Formulas.calcRelicGainFromNuke(
        GameState.resources["科学"].cap,
        GameState.buildings["粒子加速器"]?.count || 0,
        GameState.localResources.population.capacity
    );
    const stars = getTotalActiveChallengeStars();
    const multiplier = 1 + stars * 0.05;
    const extraRelic = Math.floor(baseRelicGain * 10 * multiplier);  // 基础倍数较高
    const extraDarkEnergy = Math.floor(Math.sqrt(1 + extraRelic)*multiplier);
    const extraSpore = Math.floor(Math.sqrt(1+baseRelicGain * 3)*multiplier);
    const extraSingularity = Math.floor((Math.log(300 + extraRelic)-Math.log(300)) * 10 * multiplier);
    const extraWisdom = 1*multiplier;
    
    if (confirm(`将全人类意识上传到计算机中！\n获得遗物: ${extraRelic}\n获得暗物质: ${extraDarkEnergy}\n获得孢子: ${extraSpore}\n获得奇点: ${extraSingularity}\n获得智慧: ${extraWisdom}\n确定吗？`)) {
        unlockAchievementsForReset('singularity');
        softReset(extraRelic, extraDarkEnergy, extraSpore, extraSingularity,extraWisdom);
        addEventLog(`意识上传！获得 ${extraRelic} 遗物, ${extraDarkEnergy}暗物质,${extraDarkEnergy}\n孢子, ${extraSingularity} 奇点,${extraWisdom}智慧。`);
    }
}
function hardReset() {
    localStorage.clear();
    location.reload();
}

function getMarketTradeVolume() {
    const marketActive = GameState.buildings["市场"]?.active || 0;
    const starMarketActive = GameState.buildings["星际交易站"]?.active || 0;
    return Formulas.calcMarketTradeVolume(marketActive, starMarketActive);
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
        let type = effectTypes[Math.floor(randomSeeded() * effectTypes.length)];
        let target;
        let availableTargets;
        
        switch (type) {
            case 'happiness':
                target = 'global';
                break;
            case 'prod':
                availableTargets = getBuildingsWithProduce();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(randomSeeded() * availableTargets.length)];
                break;
            case 'cons':
                availableTargets = getBuildingsWithConsume();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(randomSeeded() * availableTargets.length)];
                break;
            case 'cap':
                availableTargets = getBuildingsWithCap();
                if (availableTargets.length === 0) target = 'global';
                else target = availableTargets[Math.floor(randomSeeded() * availableTargets.length)];
                break;
        }
        
        let baseValue = Formulas.calcCrystalEffectBaseValue(quality,0.01,0.3);
        
        // 根据类型调整系数
        if (type === 'happiness') baseValue *= 0.2;
        if (type === 'cap') baseValue *= 0.2;
        
        const positiveChance = Formulas.calcCrystalPositiveChance(quality);
        let isPositive = randomSeeded() < positiveChance;
        let value = isPositive ? baseValue : -baseValue;
        if (type === 'cons') value = -value;

        if (value<-0.8)value=-0.8;

        effects.push({ type, target, value });
    }
    
    // 确保至少有一条词条
    if (effects.length === 0) {
        effects.push({ type: 'prod', target: 'global', value: 0.01 });
    }
    
    const crystalName = generateCrystalName(effects);
    
    // 定义 crystal 变量
    let crystal = {
        id: Date.now() + Math.random(),
        name: crystalName,
        effects: effects
    };
    
    // 5% 概率变为脆弱晶体
    if (randomSeeded() < 0.05) {
        crystal.fragile = true;
        for (let eff of crystal.effects) {
            eff.value *= 1.2;
        }
    }
    
    return crystal;
}

function generateCrystalName(effects) {
    const prefixes = ["闪耀", "暗影", "炽热", "冰霜", "虚空", "星辰", "混沌", "秩序", "勇猛", "智慧"];
    const suffixes = ["之石", "结晶", "碎片", "核心", "精华", "徽记"];
    return prefixes[Math.floor(randomSeeded() * prefixes.length)] + 
           suffixes[Math.floor(randomSeeded() * suffixes.length)];
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
    if (GameState.crystals.inventory.length >= 6) {
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
    renderAll();
}
function getBuildingsWithProduce() {
    return Object.keys(GameState.buildings).filter(key => {
        const bld = GameState.buildings[key];
        if (!bld.visible) return false;
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const produces = typeof cfg.produces === 'function' ? cfg.produces(GameState) : (cfg.produces || {});
        return Object.keys(produces).length > 0;
    });
}

function getBuildingsWithConsume() {
    return Object.keys(GameState.buildings).filter(key => {
        const bld = GameState.buildings[key];
        if (!bld.visible) return false;
        /** @type {BuildingConfig} */
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const consumes = typeof cfg.consumes === 'function' ? cfg.consumes(GameState) : (cfg.consumes || {});
        return Object.keys(consumes).length > 0;
    });
}

function getBuildingsWithCap() {
    return Object.keys(GameState.buildings).filter(key => {
        const bld = GameState.buildings[key];
        if (!bld.visible) return false;
        const cfg = BUILDINGS_CONFIG[key];
        if (!cfg) return false;
        const caps = typeof cfg.caps === 'function' ? cfg.caps(GameState) : (cfg.caps || {});
        return Object.keys(caps).length > 0;
    });
}
function getTotalActiveChallengeStars() {
    let stars = 0;
    for (let techId in GameState.techs) {
        const tech = GameState.techs[techId];
        if (tech.researched && tech.challenge && tech.challenge.star) {
            stars += tech.challenge.star;
        }
    }
    return stars;
}
window.getTotalActiveChallengeStars=getTotalActiveChallengeStars;
window.addEventLog=addEventLog;