// ui/permanent.js
function getPermanentAffordabilityStatus(perm) {
    const price = perm.price;
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
function renderPermanentPanel() {
    const panel = document.getElementById('panel-permanent');
    const relicAmount = GameState.resources["遗物"]?.amount || 0;
    
    if (relicAmount <= 0) {
        panel.innerHTML = '<p>暂未解锁</p>';
        return;
    }
    
    let notResearched = [];
    let researched = [];
    
    for (let p in GameState.permanent) {
        const perm = GameState.permanent[p];
        if (perm.researched) {
            researched.push(p);
        } else {
            let canShow = true;
            if (perm.prereq) {
                for (let prereq of perm.prereq) {
                    if (!GameState.permanent[prereq]?.researched) {
                        canShow = false;
                        break;
                    }
                }
            }
            if (canShow) {
                notResearched.push(p);
            }
        }
    }
    
    let html = '<div class="grid-list">';
    for (let p of notResearched) {
        const perm = GameState.permanent[p];
        
        // ===== 修改开始 =====
        const status = getPermanentAffordabilityStatus(perm);
        let colorClass = '';
        if (status === 'insufficient') colorClass = 'insufficient-name';
        else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';
        
        html += `<button class="card-btn perm-btn ${colorClass}" data-permanent="${p}"><b>${p}</b></button>`;
    }
    html += '</div>';
    
    if (researched.length) {
        html += '<h3>已研究永恒升级</h3><div class="grid-list">';
        for (let p of researched) {
            html += `<span class="card-btn researched-item" data-permanent="${p}">${p}</span>`;
        }
        html += '</div>';
    }
    
    if (notResearched.length === 0 && researched.length === 0) {
        html = '<p>暂无永恒升级</p>';
    }
    panel.innerHTML = html;

    // tooltip 绑定
    document.querySelectorAll('.perm-btn, .researched-item[data-permanent]').forEach(el => {
        const permName = el.dataset.permanent;
        const perm = GameState.permanent[permName];
        if (!perm) return;
        
        // 价格字符串（带颜色标记）
        let priceHtml = Object.entries(perm.price).map(([r, amt]) => {
            const enough = (GameState.resources[r]?.amount || 0) >= amt;
            const color = enough ? '' : 'red';
            return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
        }).join(', ');
        
        let text = `<strong>${permName}</strong><br>${perm.desc}<br>消耗: ${priceHtml}`;
        if (perm.researched) text += '<br>✓ 已获得';
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}
window.renderPermanentPanel = renderPermanentPanel;