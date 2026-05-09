// ==================== 加密相关 ====================
const ENCRYPT_KEY = "CivilizationRebuilder2026";

function strToUtf8Bytes(str) {
    return new TextEncoder().encode(str);
}

function utf8BytesToStr(bytes) {
    return new TextDecoder().decode(bytes);
}

function encryptData(dataStr) {
    const bytes = strToUtf8Bytes(dataStr);
    const keyBytes = strToUtf8Bytes(ENCRYPT_KEY);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    let binary = '';
    for (let i = 0; i < result.length; i++) {
        binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
}

function decryptData(encryptedBase64) {
    try {
        const binary = atob(encryptedBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const keyBytes = strToUtf8Bytes(ENCRYPT_KEY);
        const result = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        }
        return utf8BytesToStr(result);
    } catch(e) {
        console.error("解密失败", e);
        return null;
    }
}

// ==================== 生成精简存档数据 ====================
function getSaveData() {
    const saveData = {
        version: "1.0",
        gameDays: GameState.gameDays,
        lastSaveTime: GameState.lastSaveTime,
        speed: GameState.speed,  
        seed: GameState.seed, 
        activeRandomEvents: GameState.activeRandomEvents ? GameState.activeRandomEvents.map(ev => ({
            id: ev.id,
            name: ev.name,
            desc: ev.desc,
            effects: ev.effects,
            durationDays: ev.durationDays,
            endDay: ev.endDay,
            baseProbability: ev.baseProbability,
            prereqTech: ev.prereqTech,
        })) : [],
        eventLogs: GameState.eventLogs.slice(),
        queue: GameState.queue ? GameState.queue.slice() : [],
        resources: {}, buildings: {}, techs: {}, upgrades: {}, policies: {}, permanent: {},
    };
    // 只保存资源的动态字段：数量、热度、可见性（可选）
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        saveData.resources[r] = {
            amount: res.amount,
            tradeHeat: res.tradeHeat,
            visible: res.visible
        };
    }

    // 建筑：数量、激活数、可见性
    for (let b in GameState.buildings) {
        const bld = GameState.buildings[b];
        saveData.buildings[b] = {
            count: bld.count,
            active: bld.active,
            visible: bld.visible,
            mode: bld.mode      // 新增
        };
    }

    // 科技：是否已研究
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        saveData.techs[t] = {
            researched: tech.researched,
            challengeCompleted: tech.challengeCompleted || false
        };
    }

    // 升级：等级、可见性
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        saveData.upgrades[u] = {
            level: up.level,
            visible: up.visible
        };
    }

    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        saveData.policies[p] = {
            currentValue: pol.currentValue,
            visible: pol.visible
        };
    }

    // 永恒升级：是否已研究
    for (let perm in GameState.permanent) {
        saveData.permanent[perm] = {
            researched: GameState.permanent[perm].researched
        };
    }
    saveData.tradeRates = JSON.parse(JSON.stringify(GameState.tradeRates));
    saveData.userTradeVolume = GameState.userTradeVolume;
    saveData.maxTradeVolume = GameState.maxTradeVolume;
    saveData.crystals = JSON.parse(JSON.stringify(GameState.crystals));
    saveData.autoWarEnabled = GameState.autoWarEnabled;
    saveData.achievements = Object.keys(GameState.achievements);
    return saveData;
}

// ==================== 保存/加载 ====================
function saveGame() {
    const saveData = getSaveData();
    localStorage.setItem('civilizationRebuilder', JSON.stringify(saveData));
}
function refreshGameStateFromSave(saveData) {

    // 1. 备份永恒升级状态
    const permBackup = {};
    if (saveData.permanent) {
        for (let perm in saveData.permanent) {
            permBackup[perm] = { researched: saveData.permanent[perm].researched };
        }
    }

    // 2. 重新初始化所有静态数据
    initGameData();

    // 3. 恢复永恒升级
    for (let perm in permBackup) {
        if (GameState.permanent[perm]) {
            GameState.permanent[perm].researched = permBackup[perm].researched;
        }
    }

    // 4. 恢复资源动态数据
    if (saveData.resources) {
        for (let r in saveData.resources) {
            if (GameState.resources[r]) {
                const saved = saveData.resources[r];
                if (saved.amount !== undefined) GameState.resources[r].amount = saved.amount;
                if (saved.tradeHeat !== undefined) GameState.resources[r].tradeHeat = saved.tradeHeat;
                if (saved.visible !== undefined) GameState.resources[r].visible = saved.visible;
                if (GameState.resources[r].amount > 0) GameState.resources[r].visible = true;
            }
        }
    }

    // 5. 恢复建筑动态数据
    if (saveData.buildings) {
        for (let b in saveData.buildings) {
            if (GameState.buildings[b]) {
                const saved = saveData.buildings[b];
                if (saved.count !== undefined) GameState.buildings[b].count = saved.count;
                if (saved.active !== undefined) GameState.buildings[b].active = saved.active;
                if (saved.mode !== undefined) GameState.buildings[b].mode = saved.mode;
            }
        }
    }

    // 6. 恢复科技研究状态
    if (saveData.techs) {
        for (let t in saveData.techs) {
            if (GameState.techs[t]) {
                const saved = saveData.techs[t];
                if (saved.researched !== undefined) GameState.techs[t].researched = saved.researched;
                if (saved.challengeCompleted !== undefined) GameState.techs[t].challengeCompleted = saved.challengeCompleted;
            }
        }
    }

    // 7. 恢复升级数据
    if (saveData.upgrades) {
        for (let u in saveData.upgrades) {
            if (GameState.upgrades[u]) {
                const saved = saveData.upgrades[u];
                if (saved.level !== undefined) GameState.upgrades[u].level = saved.level;
                // visible 由条件重新计算
            }
        }
    }

    // 8. 恢复政策数据
    if (saveData.policies) {
        for (let p in saveData.policies) {
            if (GameState.policies[p]) {
                const saved = saveData.policies[p];
                if (saved.currentValue !== undefined) GameState.policies[p].currentValue = saved.currentValue;
            }
        }
    }
    // 恢复贸易数据
    if (saveData.tradeRates) {
        GameState.tradeRates = saveData.tradeRates;
    }
    if (saveData.userTradeVolume !== undefined) {
        GameState.userTradeVolume = saveData.userTradeVolume;
    }
    if (saveData.maxTradeVolume !== undefined) {
        GameState.maxTradeVolume = saveData.maxTradeVolume;
    } else {
        // 兼容旧存档
        TradeEngine.updateMaxTradeVolume(GameState);
    }
    if (saveData.seed !== undefined) GameState.seed = saveData.seed;
    
    // 确保 tradeRates 为所有可贸易资源都有值
    for (let r in RESOURCES_CONFIG) {
        if (RESOURCES_CONFIG[r].value !== undefined && r !== "金") {
            if (GameState.tradeRates[r] === undefined) {
                GameState.tradeRates[r] = 0;
            }
        }
    }
    // 刷新所有可见性（根据当前科技状态）
    refreshAllVisibility();

    // 恢复日期、事件、日志
    if (saveData.lastSaveTime!== undefined) GameState.lastSaveTime = saveData.lastSaveTime;
    if (saveData.speed !== undefined) GameState.speed = saveData.speed;
    if (saveData.gameDays !== undefined) GameState.gameDays = saveData.gameDays;
    if (saveData.eventLogs) GameState.eventLogs = saveData.eventLogs;
    if (saveData.activeRandomEvents) {
        GameState.activeRandomEvents = saveData.activeRandomEvents.map(ev => {
            return {
                id: ev.id,
                name: ev.name,
                desc: ev.desc,
                endDay: ev.endDay,
                effects: ev.effects.map(eff => {
                    return {
                        type: eff.type,
                        resource: eff.resource,
                        building: eff.building,
                        field: eff.field,
                        amount: eff.amount,
                        multiplier: eff.multiplier,
                        value: eff.value
                    };
                })
            };
        });
    }
    if (saveData.crystals) {
        GameState.crystals = {
            equipped: saveData.crystals.equipped || [null, null, null],
            inventory: saveData.crystals.inventory || []
        };
    } else {
        if (!GameState.crystals) {
            GameState.crystals = { equipped: [null, null, null], inventory: [] };
        }
    }
    // 1. 处理旧存档可能保存的是对象
    let unlockedAchievementIds = [];
    if (saveData.achievements) {
        if (Array.isArray(saveData.achievements)) {
            unlockedAchievementIds = saveData.achievements;
        } else {
            // 旧版格式：对象，提取键名
            unlockedAchievementIds = Object.keys(saveData.achievements);
        }
    }

    // 2. 同时考虑旧存档中 tech.challengeCompleted 标记
    for (let techId in saveData.techs) {
        if (saveData.techs[techId].challengeCompleted) {
            // 找出该科技对应的成就 id（在配置中查找 requireTech）
            if (ACHIEVEMENTS_CONFIG) {
                const ach = ACHIEVEMENTS_CONFIG.find(a => a.unlockCondition?.requireTech === techId);
                if (ach && !unlockedAchievementIds.includes(ach.id)) {
                    unlockedAchievementIds.push(ach.id);
                }
            }
        }
    }

    // 3. 根据 id 数组重建 GameState.achievements 对象
    GameState.achievements = {};
    if (ACHIEVEMENTS_CONFIG) {
        for (let achId of unlockedAchievementIds) {
            const cfg = ACHIEVEMENTS_CONFIG.find(a => a.id === achId);
            if (cfg) {
                GameState.achievements[achId] = {
                    name: cfg.name,
                    effect: cfg.effect || {},
                    effectText: cfg.effectText || '',
                };
            }
        }
    }

    if (saveData.autoWarEnabled !== undefined) GameState.autoWarEnabled = saveData.autoWarEnabled;
    if (saveData.queue !== undefined)GameState.queue = saveData.queue || [];
    // 如果有修复，刷新效果
    if (Object.keys(GameState.achievements).length > 0) {
        ProductionEngine.refreshEffects();
        computeProductionAndCaps();
        updateBuildingPrices();
        updateUpgradePrices();
    }
        ProductionEngine.refreshEffects();
        updateBuildingPrices();
        updateUpgradePrices();
        computeProductionAndCaps();
        renderAll();
    }

function loadGame() {
    const saved = localStorage.getItem('civilizationRebuilder');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        refreshGameStateFromSave(data);
    } catch(e) {
        console.error('加载失败', e);
    }
}

// ==================== 新增：获取导出文本 ====================
function getGameExportText() {
    const saveData = getSaveData();
    const json = JSON.stringify(saveData, null, 2);
    return encryptData(json);
}

// ==================== 修改：导出存档文件（复用导出文本） ====================
function exportGame() {
    const encrypted = getGameExportText();
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `文明重建者_存档_${new Date().toISOString().slice(0,19)}.civ`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('存档已导出为文件（.civ）');
}

// ==================== 新增：复制存档文本到剪贴板 ====================
async function copyGameExportText() {
    const encrypted = getGameExportText();
    try {
        await navigator.clipboard.writeText(encrypted);
        alert('存档文本已复制到剪贴板！');
    } catch(e) {
        // 降级方案：显示文本弹窗
        prompt('复制以下加密文本（手动复制）', encrypted);
    }
}

// ==================== 新增：从文件导入存档 ====================
function importGameFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const encrypted = e.target.result;
        importGame(encrypted);
    };
    reader.readAsText(file);
}
function importGame(encryptedText) {
    try {
        const decryptedJson = decryptData(encryptedText);
        if (!decryptedJson) throw new Error('解密失败');
        const data = JSON.parse(decryptedJson);
        if (data.resources && data.buildings && data.techs) {
            refreshGameStateFromSave(data);
            alert('导入成功！');
            return true;
        }
        throw new Error('无效存档格式');
    } catch(e) {
        alert('导入失败：存档文件损坏');
        return false;
    }
}