// ui/upgrade.js

function getUpgradeAffordabilityStatus(upgrade) {
    const price = upgrade.price;
    let hasUnlimitedCapIssue = false;
    let canAffordNow = true;
    for (let res in price) {
        const amount = ResourcesManager.getAmount(res);
        const cap = ResourcesManager.getCap(res);
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

function getUpgradePanelHTML() {
    let html = '<div class="grid-list">';
    let hasAny = false;
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (!up.visible) continue;
        hasAny = true;

        const status = getUpgradeAffordabilityStatus(up);
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

// 保留全局渲染函数用于兼容（如果需要独立调用，可留空实现）
function renderUpgradePanel() {
    // 这个函数不再直接操作 DOM，但为了兼容可能的外部调用，留空
}

getUpgradeAffordabilityStatus = getUpgradeAffordabilityStatus;
getUpgradePanelHTML = getUpgradePanelHTML;
renderUpgradePanel = renderUpgradePanel;