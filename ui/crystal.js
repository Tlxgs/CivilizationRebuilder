// ui/crystal.js
function formatCrystalEffects(effects) {
    if (!effects || effects.length === 0) return "无效果";
    return effects.map(e => {
        let sign = e.value > 0 ? '+' : '';
        let percent = (e.value * 100).toFixed(1);
        if (e.type === 'happiness') return `幸福度 ${sign}${percent}%`;
        if (e.type === 'prod') return `${e.target} 产量 ${sign}${percent}%`;
        if (e.type === 'cons') return `${e.target} 消耗 ${sign}${percent}%`;
        if (e.type === 'cap') return `${e.target} 上限 ${sign}${percent}%`;
        return `${e.type} ${sign}${percent}%`;
    }).join('<br>');
}

function renderCrystalPanel() {
    const panel = document.getElementById('panel-crystal');
    if (!panel) return;

    const crystals = GameState.crystals;
    let html = `<div style="margin-bottom: 20px;">
        <h3>装备槽位 (生效中)</h3>
        <div class="crystal-slots">`;
    for (let i = 0; i < crystals.equipped.length; i++) {
        const crystal = crystals.equipped[i];
        html += `<div class="crystal-slot">
            <div class="crystal-card ${crystal ? '' : 'empty'}">`;
        if (crystal) {
            html += `<div class="crystal-name">${crystal.name}</div>
                    <div class="crystal-effects">${formatCrystalEffects(crystal.effects)}</div>`;
            // 脆弱标识
            if (crystal.fragile) {
                html += `<div class="crystal-fragile-mark">脆弱：重置后消失</div>`;
            }
            html += `<button class="btn-rect unequip-crystal" data-slot="${i}">卸下</button>`;
        } else {
            html += `<div class="empty-slot">空槽位</div>`;
        }
        html += `</div></div>`;
    }
    html += `</div><h3>库存槽位</h3><div class="crystal-slots">`;
    for (let i = 0; i < crystals.inventory.length; i++) {
        const crystal = crystals.inventory[i];
        html += `<div class="crystal-slot">
            <div class="crystal-card">
                <div class="crystal-name">${crystal.name}</div>
                <div class="crystal-effects">${formatCrystalEffects(crystal.effects)}</div>`;
        // 脆弱标识
        if (crystal.fragile) {
            html += `<div class="crystal-fragile-mark">脆弱：重置后消失</div>`;
        }
        html += `<div class="crystal-buttons">
                    <button class="btn-rect equip-crystal" data-inv-index="${i}">装备</button>
                    <button class="btn-rect discard-crystal" data-inv-index="${i}">丢弃</button>
                </div>
            </div>
        </div>`;
    }
    for (let i = crystals.inventory.length; i < 6; i++) {
        html += `<div class="crystal-slot"><div class="crystal-card empty">空闲库存槽</div></div>`;
    }
    html += `</div></div>`;
    panel.innerHTML = html;

    document.querySelectorAll('.equip-crystal').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.invIndex);
            equipCrystal(idx);
        });
    });
    document.querySelectorAll('.discard-crystal').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.invIndex);
            if (confirm('确定丢弃这个晶体吗？')) discardCrystal(idx);
        });
    });
    document.querySelectorAll('.unequip-crystal').forEach(btn => {
        btn.addEventListener('click', () => {
            const slot = parseInt(btn.dataset.slot);
            unequipCrystal(slot);
        });
    });
}
window.renderCrystalPanel = renderCrystalPanel;