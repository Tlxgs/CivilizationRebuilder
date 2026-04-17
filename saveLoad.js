// ==================== 加密相关 ====================
const ENCRYPT_KEY = "CivilizationRebuilder2025";

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
        version: "1.0",                     // 存档版本号，用于未来迁移
        resources: {},
        buildings: {},
        techs: {},
        upgrades: {},
        policies: {},
        permanent: {}
    };

    // 只保存资源的动态字段：数量、热度、可见性（可选）
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        saveData.resources[r] = {
            amount: res.amount,
            heat: res.heat,
            visible: res.visible
        };
    }

    // 建筑：数量、激活数、可见性
    for (let b in GameState.buildings) {
        const bld = GameState.buildings[b];
        saveData.buildings[b] = {
            count: bld.count,
            active: bld.active,
            visible: bld.visible
        };
    }

    // 科技：是否已研究
    for (let t in GameState.techs) {
        saveData.techs[t] = {
            researched: GameState.techs[t].researched
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

    // 政策：当前激活选项、可见性
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        saveData.policies[p] = {
            activePolicy: pol.activePolicy,
            visible: pol.visible
        };
    }

    // 永恒升级：是否已研究
    for (let perm in GameState.permanent) {
        saveData.permanent[perm] = {
            researched: GameState.permanent[perm].researched
        };
    }

    return saveData;
}

// ==================== 保存/加载 ====================
function saveGame() {
    const saveData = getSaveData();
    localStorage.setItem('civilizationRebuilder', JSON.stringify(saveData));
    const ind = document.getElementById('save-indicator');
    if (ind) ind.innerText = '💾 已保存';
    setTimeout(() => { if(ind) ind.innerText = '💾 已保存'; }, 1500);
}

// 核心：将存档数据（精简或旧版）合并到当前 GameState（已重新初始化为最新静态数据）
function refreshGameStateFromSave(saveData) {
    // 1. 备份永恒升级状态（因为 initGameData 会重置它们）
    const permBackup = {};
    if (saveData.permanent) {
        for (let perm in saveData.permanent) {
            permBackup[perm] = { researched: saveData.permanent[perm].researched };
        }
    }

    // 2. 重新初始化所有静态数据（获得最新的建筑、科技、升级等定义）
    initGameData();

    // 3. 恢复永恒升级（必须在其他恢复之前，因为会影响价格计算）
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
                if (saved.heat !== undefined) GameState.resources[r].heat = saved.heat;
                if (saved.visible !== undefined) GameState.resources[r].visible = saved.visible;
                // 如果数量大于0但未标记可见，自动设为可见
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
                if (saved.visible !== undefined) GameState.buildings[b].visible = saved.visible;
            }
        }
    }

    // 6. 恢复科技研究状态
    if (saveData.techs) {
        for (let t in saveData.techs) {
            if (GameState.techs[t]) {
                const saved = saveData.techs[t];
                if (saved.researched !== undefined) GameState.techs[t].researched = saved.researched;
            }
        }
    }

    // 7. 恢复升级数据
    if (saveData.upgrades) {
        for (let u in saveData.upgrades) {
            if (GameState.upgrades[u]) {
                const saved = saveData.upgrades[u];
                if (saved.level !== undefined) GameState.upgrades[u].level = saved.level;
                if (saved.visible !== undefined) GameState.upgrades[u].visible = saved.visible;
            }
        }
    }

    // 8. 恢复政策数据
    if (saveData.policies) {
        for (let p in saveData.policies) {
            if (GameState.policies[p]) {
                const saved = saveData.policies[p];
                if (saved.activePolicy !== undefined) GameState.policies[p].activePolicy = saved.activePolicy;
                if (saved.visible !== undefined) GameState.policies[p].visible = saved.visible;
            }
        }
    }

    // 9. 重新计算价格、生产、上限，并刷新界面
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

function exportGame() {
    const saveData = getSaveData();
    const json = JSON.stringify(saveData, null, 2);
    const encrypted = encryptData(json);
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

function importGame(encryptedText) {
    try {
        const decryptedJson = decryptData(encryptedText);
        if (!decryptedJson) throw new Error('解密失败');
        const data = JSON.parse(decryptedJson);
        // 简单校验：必须包含核心动态字段（resources/buildings等）
        if (data.resources && data.buildings && data.techs) {
            refreshGameStateFromSave(data);
            alert('导入成功！');
            return true;
        }
        throw new Error('无效存档格式');
    } catch(e) {
        alert('导入失败：存档文件损坏或密码错误');
        return false;
    }
}