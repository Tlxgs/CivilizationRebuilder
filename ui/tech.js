// ui/tech.js

/**
 * 判断科技购买能力状态
 * 返回 'affordable' | 'insufficient' | 'cap-exceeded'
 */
function getTechAffordabilityStatus(tech) {
    const price = tech.price;
    let canAfford = true;
    let hasCapIssue = false;
    for (let res in price) {
        const amount = GameState.resources[res]?.amount || 0;
        const cap = GameState.resources[res]?.cap || 0;
        const needed = price[res];
        if (amount + 1e-6 < needed) {           // 浮点容差
            canAfford = false;
            if (cap !== Infinity && cap + 1e-6 < needed) {
                hasCapIssue = true;
            }
        }
    }
    if (canAfford) return 'affordable';
    return hasCapIssue ? 'cap-exceeded' : 'insufficient';
}

function renderTechPanel() {
    const panel = document.getElementById('panel-tech');
    if (!panel) return;

    let html = '<div class="grid-list">';
    let hasUnresearched = false;

    // 未研究科技（仅显示前置已完成的）
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (tech.researched) continue;
        // 前置检查
        let canResearch = true;
        if (tech.prereq) {
            for (let p of tech.prereq) {
                if (!GameState.techs[p]?.researched) {
                    canResearch = false;
                    break;
                }
            }
        }
        if (!canResearch) continue;
        hasUnresearched = true;

        const status = getTechAffordabilityStatus(tech);
        let colorClass = '';
        if (status === 'insufficient') colorClass = 'insufficient-name';
        else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';

        html += `<button class="card-btn tech-btn ${colorClass}" data-tech="${t}"><b>${t}</b></button>`;
    }

    if (!hasUnresearched) {
        html = '<p>暂无可用科技</p>';
    } else {
        html += '</div>';
    }

    // 已研究科技
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

    // 绑定 tooltip
    document.querySelectorAll('#panel-tech .tech-btn, #panel-tech .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;

        let priceHtml = Object.entries(tech.price).map(([r, amt]) => {
            const enough = (GameState.resources[r]?.amount || 0) + 1e-6 >= amt;
            const color = enough ? '' : 'red';
            return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
        }).join(', ');

        let text = `<strong>${techName}</strong><br>${tech.desc}<br>消耗: ${priceHtml}`;
        if (tech.researched) text += '<br>✓ 已研究';
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}

window.renderTechPanel = renderTechPanel;
window.getTechAffordabilityStatus = getTechAffordabilityStatus;