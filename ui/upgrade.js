function getUpgradeAffordabilityStatus(upgrade) {
    const price = upgrade.price;
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

// ========== 修改 renderUpgradePanel 函数中升级按钮的生成 ==========
function renderUpgradePanel() {
    const panel = document.getElementById('panel-upgrade');
    let hasAny = false;
    let html = '<div class="grid-list">';
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (!up.visible) continue;
        hasAny = true;
        
        // ===== 修改开始 =====
        const status = getUpgradeAffordabilityStatus(up);
        let colorClass = '';
        if (status === 'insufficient') colorClass = 'insufficient-name';
        else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';
        
        html += `<button class="card-btn upgrade-btn ${colorClass}" data-upgrade="${u}"><b>${u} Lv.${up.level}</b></button>`;
    }
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用升级</p>';
        return;
    }
    html += '</div>';
    panel.innerHTML = html;
    
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upName = btn.dataset.upgrade;
        const up = GameState.upgrades[upName];
        
        // 价格字符串（带颜色标记）
        let priceHtml = Object.entries(up.price).map(([r, amt]) => {
            const enough = (GameState.resources[r]?.amount || 0) >= amt;
            const color = enough ? '' : 'red';
            return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
        }).join(', ');
        
        let effectText = '';
        for (let b in up.effect) {
            effectText += `${b} 效率 +${(up.effect[b]*100).toFixed(0)}%<br>`;
        }
        let text = `<strong>${upName}</strong><br>${up.desc}<br>等级: ${up.level}<br>价格: ${priceHtml}<br>效果:<br>${effectText}`;
        btn.addEventListener('mouseenter', () => showTooltip(btn, text));
    });
}
window.renderUpgradePanel = renderUpgradePanel;