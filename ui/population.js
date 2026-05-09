// ui/population.js
function renderPopulationInfo() {
    const container = document.getElementById('population-info');
    const pop = GameState.localResources?.population;
    if (!pop) return;
    const used = Math.floor(pop.used);
    const cap  = Math.floor(pop.capacity);
    container.innerHTML = `人口: ${used} / ${cap}`;

    container.classList.remove('pop-danger', 'pop-warning');
    if (used > cap) container.classList.add('pop-danger');
    else if (used === cap) container.classList.add('pop-warning');
}

renderPopulationInfo = renderPopulationInfo;