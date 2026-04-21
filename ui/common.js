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
    document.addEventListener('click', e => {
        // 1. 优先处理模式切换齿轮按钮
        const gearBtn = e.target.closest('.mode-gear-btn');
        if (gearBtn) {
            const buildingKey = gearBtn.dataset.building;
            if (buildingKey) {
                Core.switchBuildingMode(buildingKey);
            }
            return;
        }

        // 2. 处理所有按钮点击（包括 + / - 按钮）
        const btn = e.target.closest('button');
        if (btn) {
            // 处理操作按钮
            if (btn.dataset.action) {
                Core.performAction(btn.dataset.action);
                return;
            }
            // 处理建筑加减按钮
            if (btn.classList.contains('plus-btn')) {
                const bKey = btn.dataset.building;
                const bd = GameState.buildings[bKey];
                const max = shiftPressed ? 10 : 1;
                const inc = Math.min(max, bd.count - bd.active);
                if (inc > 0) { 
                    bd.active += inc; 
                    updateBuildingPrices();
                    updateUpgradePrices();
                    computeProductionAndCaps();
                    renderAll(); 
                }
                return;
            }
            if (btn.classList.contains('minus-btn')) {
                const bKey = btn.dataset.building;
                const bd = GameState.buildings[bKey];
                const max = shiftPressed ? 10 : 1;
                const dec = Math.min(max, bd.active);
                if (dec > 0) { 
                    bd.active -= dec; 
                    updateBuildingPrices();
                    updateUpgradePrices();
                    computeProductionAndCaps();
                    renderAll(); 
                }
                return;
            }
            // 其他按钮（如科技、升级等）通过 data-* 属性处理
            if (btn.classList.contains('tech-btn')) {
                Core.researchTech(btn.dataset.tech);
                return;
            }
            if (btn.classList.contains('upgrade-btn')) {
                Core.buyUpgrade(btn.dataset.upgrade);
                return;
            }
            if (btn.classList.contains('perm-btn')) {
                Core.buyPermanent(btn.dataset.permanent);
                return;
            }
            // 重置面板中的按钮通过 id 处理
            if (btn.id === 'hard-reset') {
                if (confirm("确定硬重置？所有数据将丢失！")) hardReset();
                return;
            }
            if (btn.id === 'manual-save') {
                saveGame();
                return;
            }
            if (btn.id === 'export-save') {
                exportGame();
                return;
            }
            if (btn.id === 'import-save') {
                document.getElementById('import-modal').style.display = 'flex';
                return;
            }
            return;
        }

        const card = e.target.closest('.building-card');
        if (card) {
            const buildingKey = card.dataset.building;
            if (buildingKey) {
                const quantity = shiftPressed ? 10 : 1;
                Core.buyBuilding(buildingKey, quantity);
            }
            return;
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