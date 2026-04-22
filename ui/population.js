// ui/population.js
function renderPopulationInfo() {
    const container = document.getElementById('population-info');
    if (!container) return;
    const cap = GameState.population.capacity;
    const used = GameState.population.used;
    container.innerHTML = `人口: ${used} / ${cap}`;
    if (used > cap) container.style.color = '#c52828';
    else if (used === cap) container.style.color = '#e6a017';
    else container.style.color = '#2d3f53';
}

// 在 renderAll 中调用（见下一步）
window.renderPopulationInfo = renderPopulationInfo;