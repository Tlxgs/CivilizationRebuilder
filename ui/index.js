// 聚合渲染总入口
function renderAll() {
    renderHappiness();
    renderResources();
    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderAchievementsPanel();
    renderResetPanel();
    renderTradePanel();
    renderChangelogPanel();
    renderLogPanel();
    renderCrystalPanel();
    renderPopulationInfo(); 
    renderQueue();
    updateTabsVisibility();
}
function renderHappiness() {
    const el = document.getElementById('happiness-display');
    const happiness = GameState.happiness;
    el.textContent = `😊 幸福度: ${Formulas.calcHappinessSoftCap(happiness,GameState).toFixed(1)}%`;

    const breakdown = EffectsManager.getHappinessBreakdown();
    let tooltipHtml = '<strong>幸福度组成</strong><br>基础: 100%<br>';
    if (breakdown.length === 0) tooltipHtml += '无额外加成';
    else {
        for (let c of breakdown) {
            const sign = c.value > 0 ? '+' : '';
            tooltipHtml += `${c.sourceName}: ${sign}${c.value.toFixed(2)}%<br>`;
        }
    }
    const singularityCount = GameState.resources["奇点"]?.amount || 0;
    const softCap = Formulas.calcHappinessSoftCapBase(GameState);
    const effectiveHappiness = Formulas.calcHappinessSoftCap(GameState.happiness, GameState);
    tooltipHtml += `<br><strong>总计: ${happiness.toFixed(1)}%</strong>(软上限: ${softCap.toFixed(1)}%)`;

    if (happiness > softCap) {
        tooltipHtml += `<br>有效幸福度: ${effectiveHappiness.toFixed(1)}% `;
    }

    el.onmouseenter = () => showTooltip(el, tooltipHtml);
}
renderAll = renderAll;