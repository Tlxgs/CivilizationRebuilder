// main.js
setInterval(() => {
    saveGame();
}, 10000);

window.onload = () => {
    initGameData();
    loadGame();
    bindEvents();
    bindBuildingDetailEvents();
    GameLoop.start();
    renderAll();
};

window.addEventListener('beforeunload', () => {
    GameLoop.stop();
});

const CHEAT_SEQUENCE = ['t', 'l', 'x', 'g', 's','b','e','s','t'];
let sequenceIndex = 0;

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

function performCheat() {
    for (let r in GameState.resources) {
        if (r === '遗物' || r === '暗能量') continue;
        const res = GameState.resources[r];
        if (res.cap > 0) {
            res.amount = res.cap;
            res.visible = true;
        }
    }
    const relic = GameState.resources['遗物'];
    const dark = GameState.resources['暗能量'];
    if (relic) { relic.amount += 100; relic.visible = true; }
    if (dark) { dark.amount += 100; dark.visible = true; }
    ProductionEngine.computeProductionAndCaps();
    renderAll();
    addEventLog('神秘的暗号生效了……资源增加了');
}