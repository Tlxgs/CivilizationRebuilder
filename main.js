// main.js - 精简入口
setInterval(() => {
    saveGame();
}, 10000);

window.onload = () => {
    initGameData();
    loadGame();
    bindEvents();
    GameLoop.start();
    renderAll()
};

window.addEventListener('beforeunload', () => {
    GameLoop.stop();
});