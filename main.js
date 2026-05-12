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

onload = () => {
    initGameData();
    loadGame();
    
    // 处理离线时间
    processOfflineTime();
    
    bindEvents();
    GameLoop.start();
    renderAll();
};

addEventListener('beforeunload', () => {
    if (_hardResetting) return;
    GameState.lastSaveTime = Date.now();
    saveGame();
    GameLoop.stop();
});

function processOfflineTime() {
    const lastTime = GameState.lastSaveTime;
    if (!lastTime) return;
    const now = Date.now();
    const elapsed = Math.floor((now - lastTime) / 1000);
    if (elapsed <= 1) return;
    const maxOffline = 36000;
    const crystalGain = 0.5*Math.min(elapsed, maxOffline);
    ResourcesManager.add({"时间晶体":crystalGain});
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    let timeStr = `${hours}时${minutes}分${seconds}秒`;
    GameState.lastSaveTime = now;
    addEventLog(`离线 ${timeStr}，获得 ${crystalGain} 时间晶体。`);
}
const IS_LOCAL = location.protocol === 'file:';

const CHEAT_SEQUENCE = ['t'];
let sequenceIndex = 0;

addEventListener('keydown', (e) => {
    if (e.key === 'F12' && !GameState.achievements["不道德的巅峰"]) {
        GameState.achievements["不道德的巅峰"] = {
            name: "不道德的巅峰",
            effect: {},
            effectText: "你在做什么？",
        };
        addEventLog("✨ 解锁成就「不道德的巅峰」！");
        ProductionEngine.refreshEffects();
        renderAll();
        return;
    }
    if (!IS_LOCAL) return;
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

function performCheat() {
    const crystal = GameState.resources['时间晶体'];
    const relic = GameState.resources['遗物'];
    const dark = GameState.resources['暗能量'];

    if (relic) {
        relic.amount += 100;
        relic.visible = true;
    }
    if (dark) {
        dark.amount += 100;
        dark.visible = true;
    }
    if (crystal) {
        crystal.amount = 10;
        crystal.visible = true;
    }

    for (let r in GameState.resources) {
        if (r === '遗物' || r === '暗能量' || r === '时间晶体'||r==='孢子'||r==='奇点') continue;
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