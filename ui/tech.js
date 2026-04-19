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
        
        // 检查是否买得起
        const affordable = canAfford(tech.price);
        const btnStyle = affordable ? '' : 'style="color: red;"';
        
        html += `<button class="card-btn tech-btn" data-tech="${t}" ${btnStyle}><b>${t}</b></button>`;
    }
    if (!hasUnresearched) html = '<p>暂无可用科技</p>';
    else html += '</div>';
    
    html += '<h3>已研究</h3><div class="grid-list">';
    let hasResearched = false;
    for (let t in GameState.techs) {
        if (GameState.techs[t].researched) {
            hasResearched = true;
            html += `<span class="card-btn researched-item" data-tech="${t}">${t}</span>`;
        }
    }
    if (!hasResearched) html += '<p>暂无已研究科技</p>';
    html += '</div>';
    panel.innerHTML = html;

    // tooltip 绑定
    document.querySelectorAll('.tech-btn, .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;
        
        // 生成带颜色标记的价格字符串
        let priceHtml = Object.entries(tech.price).map(([r, amt]) => {
            const enough = (GameState.resources[r]?.amount || 0) >= amt;
            const color = enough ? '' : 'red';
            return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
        }).join(', ');
        
        let text = `<strong>${techName}</strong><br>${tech.desc}<br>消耗: ${priceHtml}`;
        if (tech.researched) text += '<br>✓ 已研究</span>';
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}
window.renderTechPanel = renderTechPanel;