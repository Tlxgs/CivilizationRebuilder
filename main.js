// main.js
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
})();
setInterval(() => {
    saveGame();
}, 10000);

window.onload = () => {
    initGameData();
    loadGame();
    
    // 处理离线时间
    processOfflineTime();
    
    bindEvents();
    GameLoop.start();
    renderAll();
};

window.addEventListener('beforeunload', () => {
    if (window._hardResetting) return;          // 硬重置时不再保存
    GameState.lastSaveTime = Date.now();
    saveGame();
    GameLoop.stop();
});

function processOfflineTime() {
    const lastTime = GameState.lastSaveTime;
    if (!lastTime) return;
    const now = Date.now();
    const elapsed = Math.floor((now - lastTime) / 1000);
    if (elapsed <= 1) return;   // 至少1秒才算离线
    const maxOffline = 36000;
    const crystalGain = 0.5*Math.min(elapsed, maxOffline);
    const crystal = GameState.resources["时间晶体"];
    if (crystal) {
        crystal.amount += crystalGain;
        crystal.visible = true;
    }
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    let timeStr = `${hours}时${minutes}分${seconds}秒`;
    addEventLog(`离线 ${timeStr}，获得 ${crystalGain} 时间晶体。`);
}

const CHEAT_SEQUENCE = ['t', 'l', 'x', 'g', 's'];
let sequenceIndex = 0;
/*
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (key === CHEAT_SEQUENCE[sequenceIndex]) {
        sequenceIndex++;
        if (sequenceIndex === CHEAT_SEQUENCE.length) {
            performCheat();
            sequenceIndex = 0;
        }
    } else {
        sequenceIndex = 0;
    }
});
*/
function performCheat() {
    const crystal = GameState.resources['时间晶体'];
    const relic = GameState.resources['遗物'];
    const dark = GameState.resources['暗能量'];

    // 先设置特殊资源
    if (relic) {
        relic.amount += 100;
        relic.visible = true;
    }
    if (dark) {
        dark.amount += 100;
        dark.visible = true;
    }
    if (crystal) {
        crystal.amount = 10;           // 强制设为10，不考虑cap
        crystal.visible = true;
    }

    // 然后填充其他所有资源至上限
    for (let r in GameState.resources) {
        if (r === '遗物' || r === '暗能量' || r === '时间晶体') continue;
        const res = GameState.resources[r];
        if (res.cap > 0) {
            res.amount = res.cap;
            res.visible = true;
        }
    }

    ProductionEngine.computeProductionAndCaps();
    renderAll();
    addEventLog('神秘的暗号生效了……资源增加了');
}