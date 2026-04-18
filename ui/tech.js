// ui/tech.js
function renderTechPanel() {
    const panel = document.getElementById('panel-tech');
    let html = '<div class="grid-list">';
    let hasUnresearched = false;
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (tech.researched) continue;
        let canResearch = true;
        if (tech.prereq) {
            for (let p of tech.prereq) {
                if (!GameState.techs[p]?.researched) canResearch = false;
            }
        }
        if (!canResearch) continue;
        hasUnresearched = true;
        html += `<button class="card-btn tech-btn" data-tech="${t}"><b>${t}</b></button>`;
    }
    if (!hasUnresearched) html = '<p>暂无可用科技</p>';
    else html += '</div>';
    
    html += '<h3>已研究</h3><div class="grid-list">';
    let hasResearched = false;
    for (let t in GameState.techs) {
        if (GameState.techs[t].researched) {
            hasResearched = true;
            html += `<span class="card-btn researched-item" data-tech="${t}" style="background:#3a5a30">${t}</span>`;
        }
    }
    if (!hasResearched) html += '<p>暂无已研究科技</p>';
    html += '</div>';
    panel.innerHTML = html;

    document.querySelectorAll('.tech-btn, .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;
        let text = `<strong>${techName}</strong><br>${tech.desc}<br>消耗: ${Object.entries(tech.price).map(([r,amt]) => `${r} ${formatNumber(amt)}`).join(', ')}`;
        if (tech.researched) text += '<br>✓ 已研究</span>';
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}
window.renderTechPanel = renderTechPanel;