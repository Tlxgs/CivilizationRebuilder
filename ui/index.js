// 聚合渲染总入口
function renderAll() {
    renderHappiness();
    renderResources();
    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderUpgradePanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderAchievementsPanel();
    renderResetPanel();
    renderTradePanel();
    renderChangelogPanel();
    renderLogPanel();
    renderCrystalPanel();
    renderPopulationInfo(); 
    updateTabsVisibility();
}
function renderHappiness() {
    const el = document.getElementById('happiness-display');
    if (!el) return;
    
    const happiness = GameState.happiness || 100;
    el.innerHTML = `😊 幸福度: ${happiness.toFixed(1)}%`;
    
    // 生成详细贡献 tooltip
    const contribs = GameState.happinessContributions || [];
    let tooltipHtml = `<strong>幸福度组成</strong><br>基础: 100%<br>`;
    if (contribs.length === 0) {
        tooltipHtml += '无额外加成';
    } else {
        for (let c of contribs) {
            const sign = c.value > 0 ? '+' : '';
            tooltipHtml += `${c.source}: ${sign}${c.value.toFixed(2)}%<br>`;
        }
    }
    tooltipHtml += `<br><strong>总计: ${happiness.toFixed(1)}%</strong>`;
    
    // 绑定 tooltip
    el.addEventListener('mouseenter', () => {
        showTooltip(el, tooltipHtml);
    });
}
window.renderAll = renderAll;
window.renderHappiness = renderHappiness;