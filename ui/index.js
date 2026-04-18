// 聚合渲染总入口
function renderAll() {
    renderHappiness();       // 若未拆分可保留在 common 或独立文件
    renderResources();
    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderUpgradePanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderResetPanel();
    renderTradePanel();
    renderChangelogPanel();
    renderLogPanel();
    renderCrystalPanel();
    updateTabsVisibility();
}
function renderHappiness() {
    const el = document.getElementById('happiness-display');
    if (el) el.innerHTML = `😊 幸福度: ${(GameState.happiness||100).toFixed(1)}%`;
}
window.renderAll = renderAll;
window.renderHappiness = renderHappiness;