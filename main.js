// 自动保存定时器
setInterval(() => {
    saveGame();
}, 10000);

// 游戏主循环（每0.2秒更新资源）
let lastTimestamp = 0;
const TICK_INTERVAL = 0.2; // 秒

function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    if (!lastTimestamp) { lastTimestamp = now; return; }
    let delta = (now - lastTimestamp) / 1000;
    if (delta >= TICK_INTERVAL) {
        let ticks = Math.floor(delta / TICK_INTERVAL);
        for (let i = 0; i < ticks; i++) {
            tickResources(TICK_INTERVAL);
        }
        lastTimestamp = now - (delta % TICK_INTERVAL) * 1000;
        renderResources();
        updateBuyButtonsColor();
    }
}

// 初始化游戏
window.onload = () => {
    initGameData();
    loadGame();
    updateBuildingPrices();
    updateUpgradePrices();
    computeProductionAndCaps();
    renderAll();
    bindEvents();
    requestAnimationFrame(gameLoop);
};