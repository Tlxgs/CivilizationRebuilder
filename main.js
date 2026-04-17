// 自动保存定时器
setInterval(() => {
    saveGame();
}, 10000);
let lastTimestamp = 0;
const TICK_INTERVAL = 0.2;
let pendingTicks = 0;
let dayTickAcc = 0;

function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    if (!lastTimestamp) { lastTimestamp = now; return; }
    let delta = (now - lastTimestamp) / 1000;
    if (delta >= TICK_INTERVAL) {
        let ticks = Math.floor(delta / TICK_INTERVAL);
        for (let i = 0; i < ticks; i++) {
            tickResources(TICK_INTERVAL);
            dayTickAcc++;
            if (dayTickAcc >= 5) {   // 5 tick = 1秒 = 1日
                dayTickAcc = 0;
                advanceDay();        // 调用日期推进函数
            }
        }
        lastTimestamp = now - (delta % TICK_INTERVAL) * 1000;
        renderResources();
        updateBuyButtonsColor();
        renderLogPanel();            // 实时刷新日志显示
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