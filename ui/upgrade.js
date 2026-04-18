// ui/upgrade.js
function renderUpgradePanel() {
    const panel = document.getElementById('panel-upgrade');
    let hasAny = false;
    let html = '<div class="grid-list">';
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (!up.visible) continue;
        hasAny = true;
        html += `<button class="card-btn upgrade-btn" data-upgrade="${u}"><b>${u} Lv.${up.level}</b></button>`;
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
        const priceStr = Object.entries(up.price).map(([r, amt]) => `${r} ${formatNumber(amt)}`).join(', ');
        let effectText = '';
        for (let b in up.effect) {
            effectText += `${b} 效率 +${(up.effect[b]*100).toFixed(0)}%<br>`;
        }
        let text = `<strong>${upName}</strong><br>${up.desc}<br>等级: ${up.level}<br>价格: ${priceStr}<br>效果:<br>${effectText}`;
        btn.addEventListener('mouseenter', () => showTooltip(btn, text));
    });
}
window.renderUpgradePanel = renderUpgradePanel;