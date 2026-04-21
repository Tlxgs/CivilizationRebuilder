function getTechAffordabilityStatus(tech) {
    const price = tech.price;
    let hasUnlimitedCapIssue = false;
    let canAffordNow = true;
    for (let res in price) {
        const amount = GameState.resources[res]?.amount || 0;
        const cap = GameState.resources[res]?.cap || 0;
        const needed = price[res];
        if (amount < needed) {
            canAffordNow = false;
            if (cap !== Infinity && cap < needed) {
                hasUnlimitedCapIssue = true;
            }
        }
    }
    if (canAffordNow) return 'affordable';
    if (hasUnlimitedCapIssue) return 'cap-exceeded';
    return 'insufficient';
}

// ========== 修改 renderTechPanel 函数中未研究科技的按钮生成部分 ==========
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
        
        // ===== 修改开始 =====
        const status = getTechAffordabilityStatus(tech);
        let colorClass = '';
        if (status === 'insufficient') colorClass = 'insufficient-name';
        else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';
        
        html += `<button class="card-btn tech-btn ${colorClass}" data-tech="${t}"><b>${t}</b></button>`;
        // ===== 修改结束 =====
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