// ui/population.js
function renderPopulationInfo() {
    const container = document.getElementById('population-info');
    if (!container) return;
    const pop = GameState.localResources?.population;
    if (!pop) {
        container.innerHTML = '人口: - / -';
        return;
    }
    const used = formatLocalNumber(pop.used);
    const cap  = formatLocalNumber(pop.capacity);
    container.innerHTML = `人口: ${used} / ${cap}`;
    if (pop.used > pop.capacity) container.style.color = '#c52828';
    else if (Math.abs(pop.used - pop.capacity) <= 1e-1) container.style.color = '#e6a017';
    else container.style.color = '#2d3f53';
}

// 在 renderAll 中调用（见下一步）
window.renderPopulationInfo = renderPopulationInfo;