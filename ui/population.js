// ui/population.js
function renderPopulationInfo() {
    const container = document.getElementById('population-info');
    const pop = GameState.localResources?.population;
    if (!pop) return;
    const used = Math.floor(pop.used);
    const cap  = Math.floor(pop.capacity);
    container.innerHTML = `人口: ${used} / ${cap}`;
    if (used > cap) container.style.color = '#c52828';
    else if (used === cap) container.style.color = '#e6a017';
    else container.style.color = '#2d3f53';
}

// 在 renderAll 中调用（见下一步）
window.renderPopulationInfo = renderPopulationInfo;