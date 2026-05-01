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
            const panels = ['building', 'tech', 'upgrade', 'policy', 'trade', 'crystal', 'permanent','achievements', 'reset', 'changelog'];
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
function refreshLocalResourcesDisplay() {
    for (let lrKey in GameState.localResources) {
        const lr = GameState.localResources[lrKey];
        const cfg = LOCAL_RESOURCES_CONFIG[lrKey];
        if (!lr || !cfg) continue;

        const usedDisplay = (lrKey === 'population') ? Math.floor(lr.used) : formatLocalNumber(lr.used);
        const capDisplay = (lrKey === 'population') ? Math.floor(lr.capacity) : formatLocalNumber(lr.capacity);
        const displayText = `${cfg.name}: ${usedDisplay} / ${capDisplay}`;

        const isOver = (lr.used - lr.capacity) > 1;
        const isEqual = Math.abs(lr.used - lr.capacity) <= 1;
        
        // 人口使用 CSS 类控制颜色，其他局域资源使用内联 style
        if (lrKey === 'population') {
            const container = document.getElementById('population-info');
            if (container) {
                container.innerHTML = displayText;
                container.classList.remove('pop-danger', 'pop-warning');
                if (isOver) container.classList.add('pop-danger');
                else if (isEqual) container.classList.add('pop-warning');
            }
        } else {
            const color = isOver ? '#c52828' : (isEqual ? '#e6a017' : '#2d3f53');
            document.querySelectorAll(`[data-local-resource="${lrKey}"]`).forEach(el => {
                el.textContent = displayText;
                el.style.color = color;
            });
        }
    }
}
// 全局刷新动态颜色（每 tick 调用）
function refreshAllDynamicColors() {
    // 刷新建筑卡片
    document.querySelectorAll('.building-card').forEach(card => {
        const buildingKey = card.dataset.building;
        if (!buildingKey) return;
        const bld = GameState.buildings[buildingKey];
        if (!bld) return;
        
        // 更新价格颜色
        const price = bld.price;
        const status = getBuildingAffordabilityStatus(price);
        const nameStrong = card.querySelector('.building-card-info strong');
        if (nameStrong) {
            nameStrong.classList.remove('insufficient-name', 'unaffordable-name');
            if (status === 'insufficient') nameStrong.classList.add('insufficient-name');
            else if (status === 'cap-exceeded') nameStrong.classList.add('unaffordable-name');
        }

        // 更新效率显示（实时刷新百分比）
        const infoDiv = card.querySelector('.building-card-info');
        const effSpan = infoDiv ? infoDiv.querySelector('.building-efficiency') : null;
        if (bld.active > 0 && bld.efficiency !== undefined && bld.efficiency < 0.995) {
            const percent = (bld.efficiency * 100).toFixed(0);
            if (effSpan) {
                effSpan.textContent = `效率: ${percent}%`;
            } else if (infoDiv) {
                const newSpan = document.createElement('span');
                newSpan.className = 'building-efficiency';
                newSpan.style.cssText = 'color:#e6a017; font-size:0.8rem; margin-left:6px;';
                newSpan.textContent = `效率: ${percent}%`;
                infoDiv.appendChild(newSpan);
            }
        } else {
            if (effSpan) effSpan.remove();
        }
    });

    // 2. 刷新科技按钮
    document.querySelectorAll('.tech-btn:not(.researched-item)').forEach(btn => {
        const techKey = btn.dataset.tech;
        if (!techKey) return;
        const tech = GameState.techs[techKey];
        if (!tech || tech.researched) return;
        const status = getTechAffordabilityStatus(tech);
        btn.classList.remove('insufficient-name', 'unaffordable-name');
        if (status === 'insufficient') btn.classList.add('insufficient-name');
        else if (status === 'cap-exceeded') btn.classList.add('unaffordable-name');
    });

    // 3. 刷新升级按钮
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upKey = btn.dataset.upgrade;
        if (!upKey) return;
        const up = GameState.upgrades[upKey];
        if (!up) return;
        const status = getUpgradeAffordabilityStatus(up);
        btn.classList.remove('insufficient-name', 'unaffordable-name');
        if (status === 'insufficient') btn.classList.add('insufficient-name');
        else if (status === 'cap-exceeded') btn.classList.add('unaffordable-name');
    });

    // 4. 刷新永恒升级按钮
    document.querySelectorAll('.perm-btn').forEach(btn => {
        const permKey = btn.dataset.permanent;
        if (!permKey) return;
        const perm = GameState.permanent[permKey];
        if (!perm || perm.researched) return;
        const status = getPermanentAffordabilityStatus(perm);
        btn.classList.remove('insufficient-name', 'unaffordable-name');
        if (status === 'insufficient') btn.classList.add('insufficient-name');
        else if (status === 'cap-exceeded') btn.classList.add('unaffordable-name');
    });

    // 5. 刷新资源数值和进度条（轻量）
    refreshResourceBars();
    refreshLocalResourcesDisplay();
}

// 辅助：判断建筑价格是否买得起（基于价格对象）
function getBuildingAffordabilityStatus(price) {
    let capExceeded = false;
    let canAfford = true;
    for (let res in price) {
        const amount = GameState.resources[res]?.amount || 0;
        const cap = GameState.resources[res]?.cap || 0;
        const needed = price[res];
        if (amount < needed) {
            canAfford = false;
            if (cap !== Infinity && cap < needed) capExceeded = true;
        }
    }
    if (canAfford) return 'affordable';
    if (capExceeded) return 'cap-exceeded';
    return 'insufficient';
}

function refreshResourceBars() {
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (!res.visible) continue;
        const item = document.querySelector(`.resource-item[data-resource="${r}"]`);
        if (!item) continue;
        const amount = res.amount;
        const cap = res.cap;
        const capDisplay = cap === Infinity ? '∞' : formatNumber(cap);
        const prod = res.production;
        const prodText = (prod > 0 ? '+' : '') + formatNumber(prod);
        
        let text = `${r}: ${formatNumber(amount)}/${capDisplay}`;
        if (Math.abs(prod) > 1e-9) {
            text += ` (${prodText}/s)`;
        }
        
        const textDiv = item.querySelector('.resource-text');
        if (textDiv) textDiv.textContent = text;
        let percent = 0;
        if (cap !== Infinity && cap > 0) percent = Math.min(100, (amount / cap) * 100);
        const progressDiv = item.querySelector('.resource-progress');
        if (progressDiv) progressDiv.style.width = `${percent}%`;
    }
}

// 确保这些函数全局可用
window.refreshAllDynamicColors = refreshAllDynamicColors;
window.bindEvents = bindEvents;
window.showTooltip = showTooltip;
// shiftPressed 作为全局变量可直接访问，无需挂载