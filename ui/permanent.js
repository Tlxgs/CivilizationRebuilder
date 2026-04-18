// ui/permanent.js
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
        html += `<button class="card-btn perm-btn" data-permanent="${p}"><b>${p}</b></button>`;
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

    document.querySelectorAll('.perm-btn, .researched-item[data-permanent]').forEach(el => {
        const permName = el.dataset.permanent;
        const perm = GameState.permanent[permName];
        if (!perm) return;
        let text = `<strong>${permName}</strong><br>${perm.desc}<br>消耗: ${Object.entries(perm.price).map(([r,amt]) => `${r} ${formatNumber(amt)}`).join(', ')}`;
        if (perm.researched) text += '<br>✓ 已获得';
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}
window.renderPermanentPanel = renderPermanentPanel;