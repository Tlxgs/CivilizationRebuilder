// ui/upgrade.js

function getUpgradePanelHTML() {
    let html = '<div class="grid-list">';
    let hasAny = false;
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (!up.visible) continue;
        hasAny = true;

        const status = getAffordabilityStatus(up.price);
        let colorClass = '';
        if (status === 'insufficient') colorClass = 'insufficient-name';
        else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';

        html += `<button class="card-btn upgrade-btn ${colorClass}" data-upgrade="${u}"><b>${u} Lv.${up.level}</b></button>`;
    }
    if (!hasAny) {
        html += '<p>暂无可用升级</p>';
    }
    html += '</div>';
    return html;
}
function refreshUpgradePanel() {
    const panel = document.getElementById('panel-tech');
    if (!panel) return;

    // 检查当前是否在升级子标签页，如果不是则跳过
    const upgradeTab = panel.querySelector('.sub-tab-btn[data-subtab="upgrade"]');
    if (!upgradeTab || !upgradeTab.classList.contains('active')) return;

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upKey = btn.dataset.upgrade;
        if (!upKey) return;
        const up = GameState.upgrades[upKey];
        if (!up) return;
        const status = getAffordabilityStatus(up.price);
        btn.classList.remove('insufficient-name', 'unaffordable-name');
        if (status === 'insufficient') btn.classList.add('insufficient-name');
        else if (status === 'cap-exceeded') btn.classList.add('unaffordable-name');
    });
}