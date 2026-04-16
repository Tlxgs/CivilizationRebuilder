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

// ==================== 保存/加载 ====================
function saveGame() {
    const saveData = {
        resources: GameState.resources,
        buildings: GameState.buildings,
        techs: GameState.techs,
        upgrades: GameState.upgrades,
        policies: GameState.policies,
        permanent: GameState.permanent
    };
    localStorage.setItem('civilizationRebuilder', JSON.stringify(saveData));
    const ind = document.getElementById('save-indicator');
    if (ind) ind.innerText = '💾 已保存';
    setTimeout(() => { if(ind) ind.innerText = '💾 已自动保存'; }, 1500);
}

function loadGame() {
    const saved = localStorage.getItem('civilizationRebuilder');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        refreshGameStateFromSave(data);
    } catch(e) { console.error('加载失败', e); }
}

function refreshGameStateFromSave(saveData) {
    // 备份必要数据
    const backup = {
        resources: {},
        buildings: {},
        techs: {},
        upgrades: {},
        policies: {},
        permanent: {}
    };
    for (let r in saveData.resources) {
        backup.resources[r] = {
            amount: saveData.resources[r].amount,
            heat: saveData.resources[r].heat
        };
    }
    for (let b in saveData.buildings) {
        backup.buildings[b] = {
            count: saveData.buildings[b].count,
            active: saveData.buildings[b].active,
            visible: saveData.buildings[b].visible
        };
    }
    for (let t in saveData.techs) {
        backup.techs[t] = { researched: saveData.techs[t].researched };
    }
    for (let u in saveData.upgrades) {
        backup.upgrades[u] = {
            level: saveData.upgrades[u].level,
            visible: saveData.upgrades[u].visible
        };
    }
    for (let p in saveData.policies) {
        backup.policies[p] = {
            activePolicy: saveData.policies[p].activePolicy,
            visible: saveData.policies[p].visible
        };
    }
    for (let perm in saveData.permanent) {
        backup.permanent[perm] = { researched: saveData.permanent[perm].researched };
    }

    initGameData();

    for (let r in backup.resources) {
        if (GameState.resources[r]) {
            GameState.resources[r].amount = backup.resources[r].amount;
            if (backup.resources[r].heat !== undefined) GameState.resources[r].heat = backup.resources[r].heat;
            if (GameState.resources[r].amount > 0) GameState.resources[r].visible = true;
        }
    }
    for (let b in backup.buildings) {
        if (GameState.buildings[b]) {
            GameState.buildings[b].count = backup.buildings[b].count;
            GameState.buildings[b].active = backup.buildings[b].active;
            GameState.buildings[b].visible = backup.buildings[b].visible;
        }
    }
    for (let t in backup.techs) {
        if (GameState.techs[t]) GameState.techs[t].researched = backup.techs[t].researched;
    }
    for (let u in backup.upgrades) {
        if (GameState.upgrades[u]) {
            GameState.upgrades[u].level = backup.upgrades[u].level;
            GameState.upgrades[u].visible = backup.upgrades[u].visible;
        }
    }
    for (let p in backup.policies) {
        if (GameState.policies[p]) {
            GameState.policies[p].activePolicy = backup.policies[p].activePolicy;
            GameState.policies[p].visible = backup.policies[p].visible;
        }
    }
    for (let perm in backup.permanent) {
        if (GameState.permanent[perm]) GameState.permanent[perm].researched = backup.permanent[perm].researched;
    }

    updateBuildingPrices();
    updateUpgradePrices();
    computeProductionAndCaps();
    renderAll();
}

function exportGame() {
    const saveData = {
        resources: GameState.resources,
        buildings: GameState.buildings,
        techs: GameState.techs,
        upgrades: GameState.upgrades,
        policies: GameState.policies,
        permanent: GameState.permanent,
        version: '1.0'
    };
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