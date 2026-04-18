// 公共变量与函数
let currentTooltip = null;
let shiftPressed = false;

window.addEventListener('keydown', e => { if (e.key === 'Shift') shiftPressed = true; });
window.addEventListener('keyup', e => { if (e.key === 'Shift') shiftPressed = false; });
window.addEventListener('blur', () => { shiftPressed = false; });

function showTooltip(el, text) {
    if (currentTooltip) currentTooltip.remove();
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = text;
    document.body.appendChild(tip);
    const rect = el.getBoundingClientRect();
    tip.style.left = rect.left + 'px';
    tip.style.top = (rect.bottom + 5) + 'px';
    currentTooltip = tip;
    el.addEventListener('mouseleave', () => { tip.remove(); currentTooltip = null; }, { once: true });
}
// 事件绑定
function bindEvents() {
    // 选项卡切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            const panels = ['building', 'tech', 'upgrade', 'policy', 'trade', 'crystal', 'permanent', 'reset', 'changelog'];
            panels.forEach(p => {
                const panelEl = document.getElementById(`panel-${p}`);
                if (panelEl) panelEl.style.display = p === tab ? 'block' : 'none';
            });
            renderAll();
        });
    });

    // 全局点击事件（委托）
    document.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        if (btn.dataset.action) {
            Core.performAction(btn.dataset.action);
            return;
        }
        
        if (btn.classList.contains('buy-btn')) {
            const bKey = btn.dataset.building;
            Core.buyBuilding(bKey, shiftPressed ? 10 : 1);
        } else if (btn.classList.contains('plus-btn')) {
            const bKey = btn.dataset.building;
            const bd = GameState.buildings[bKey];
            const max = shiftPressed ? 10 : 1;
            const inc = Math.min(max, bd.count - bd.active);
            if (inc > 0) { bd.active += inc; renderAll(); }
        } else if (btn.classList.contains('minus-btn')) {
            const bKey = btn.dataset.building;
            const bd = GameState.buildings[bKey];
            const max = shiftPressed ? 10 : 1;
            const dec = Math.min(max, bd.active);
            if (dec > 0) { bd.active -= dec; renderAll(); }
        } else if (btn.classList.contains('tech-btn')) {
            Core.researchTech(btn.dataset.tech);
        } else if (btn.classList.contains('upgrade-btn')) {
            Core.buyUpgrade(btn.dataset.upgrade);
        } else if (btn.classList.contains('perm-btn')) {
            Core.buyPermanent(btn.dataset.permanent);
        } else if (btn.id === 'hard-reset') {
            if (confirm("确定硬重置？所有数据将丢失！")) hardReset();
        } else if (btn.id === 'manual-save') {
            saveGame();
        } else if (btn.id === 'export-save') {
            exportGame();
        } else if (btn.id === 'import-save') {
            document.getElementById('import-modal').style.display = 'flex';
        }
    });

    // 政策 radio 切换
    document.addEventListener('change', e => {
        if (e.target.type === 'radio') {
            const name = e.target.name;
            const value = e.target.value;
            if (!Core.switchPolicy(name, value)) {
                const pol = GameState.policies[name];
                e.target.checked = false;
                document.querySelector(`input[name="${name}"][value="${pol.activePolicy}"]`).checked = true;
                alert("政策点不足！");
            }
        }
    });

    // 导入模态框
    const modal = document.getElementById('import-modal');
    document.querySelector('.modal-close')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancel-import')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('confirm-import')?.addEventListener('click', () => {
        const text = document.getElementById('import-text').value;
        importGame(text);
        modal.style.display = 'none';
        renderAll();
    });
}

window.bindEvents = bindEvents;
window.showTooltip = showTooltip;
// shiftPressed 作为全局变量可直接访问，无需挂载