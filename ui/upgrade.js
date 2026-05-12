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

getUpgradePanelHTML = getUpgradePanelHTML;