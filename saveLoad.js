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
const SAVE_FIELD_MAPPINGS = {
    resources: {
        fields: ['amount', 'tradeHeat', 'visible'],
        initCheck: true  // 资源必须已初始化
    },
    buildings: {
        fields: ['count', 'active', 'visible', 'mode'],
        initCheck: true
    },
    techs: {
        fields: ['researched', 'challengeCompleted'],
        initCheck: true
    },
    upgrades: {
        fields: ['level'],
        initCheck: true,
        postProcess: () => {
            // 升级的 visible 由条件重新计算，不恢复
            for (let u in GameState.upgrades) {
                GameState.upgrades[u].visible = checkUnlockCondition(
                    GameState.upgrades[u].unlockCondition, GameState
                );
            }
        }
    },
    policies: {
        fields: ['currentValue'],
        initCheck: true
    },
    permanent: {
        fields: ['researched'],
        initCheck: true
    },
    tradeRates: {
        fields: [],  // 整体替换，不是字段级
        replaceFull: true
    },
    crystals: {
        replaceFull: true
    },
    queue: {
        replaceFull: true
    },
    eventLogs: {
        replaceFull: true
    },
    achievements: {
        customHandler: true  // 特殊处理
    }
};

function restoreField(category, targetState, savedData, mapping) {
    if (!savedData[category]) return;
    if (mapping.replaceFull) {
        targetState[category] = savedData[category];
        return;
    }
    for (let id in savedData[category]) {
        if (!targetState[category][id]) continue;
        const savedItem = savedData[category][id];
        const targetItem = targetState[category][id];
        for (let field of mapping.fields) {
            if (savedItem[field] !== undefined) {
                targetItem[field] = savedItem[field];
            }
        }
    }
    if (mapping.postProcess) mapping.postProcess();
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

    // 4. 按映射表恢复各字段
    for (let category in SAVE_FIELD_MAPPINGS) {
        if (category === 'achievements') continue; // 单独处理
        restoreField(category, GameState, saveData, SAVE_FIELD_MAPPINGS[category]);
    }

    // 5. 特殊处理成就（兼容旧格式）
    let unlockedAchievementIds = [];
    if (saveData.achievements) {
        if (Array.isArray(saveData.achievements)) {
            unlockedAchievementIds = saveData.achievements;
        } else {
            unlockedAchievementIds = Object.keys(saveData.achievements);
        }
    }
    // 同时从挑战完成状态中补充成就
    for (let techId in saveData.techs) {
        if (saveData.techs[techId]?.challengeCompleted) {
            const ach = ACHIEVEMENTS_CONFIG?.find(a => a.unlockCondition?.requireTech === techId);
            if (ach && !unlockedAchievementIds.includes(ach.id)) {
                unlockedAchievementIds.push(ach.id);
            }
        }
    }
    GameState.achievements = {};
    for (let achId of unlockedAchievementIds) {
        const cfg = ACHIEVEMENTS_CONFIG?.find(a => a.id === achId);
        if (cfg) {
            GameState.achievements[achId] = {
                name: cfg.name,
                effect: cfg.effect || {},
                effectText: cfg.effectText || '',
            };
        }
    }

    // 6. 恢复其他简单字段
    if (saveData.userTradeVolume !== undefined) GameState.userTradeVolume = saveData.userTradeVolume;
    if (saveData.maxTradeVolume !== undefined) GameState.maxTradeVolume = saveData.maxTradeVolume;
    if (saveData.seed !== undefined) GameState.seed = saveData.seed;
    if (saveData.lastSaveTime !== undefined) GameState.lastSaveTime = saveData.lastSaveTime;
    if (saveData.speed !== undefined) GameState.speed = saveData.speed;
    if (saveData.gameDays !== undefined) GameState.gameDays = saveData.gameDays;
    if (saveData.autoWarEnabled !== undefined) GameState.autoWarEnabled = saveData.autoWarEnabled;

    // 7. 处理 activeRandomEvents（需要重建对象结构）
    if (saveData.activeRandomEvents) {
        GameState.activeRandomEvents = saveData.activeRandomEvents.map(ev => ({
            id: ev.id,
            name: ev.name,
            desc: ev.desc,
            endDay: ev.endDay,
            effects: ev.effects.map(eff => ({ ...eff }))
        }));
    }

    // 8. 确保 tradeRates 对所有可贸易资源存在默认值
    for (let r in RESOURCES_CONFIG) {
        if (RESOURCES_CONFIG[r].value !== undefined && r !== "金") {
            if (GameState.tradeRates[r] === undefined) GameState.tradeRates[r] = 0;
        }
    }

    // 9. 刷新可见性和效果
    refreshAllVisibility();
    ProductionEngine.refreshEffects();
    ProductionEngine.computeProductionAndCaps();
    ProductionEngine.updateBuildingPrices();
    ProductionEngine.updateUpgradePrices();
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