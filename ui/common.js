// 公共变量与函数
let currentTooltip = null;
let shiftPressed = false;

let ctrlPressed = false;          // 新增

// 监听键盘修饰键
addEventListener('keydown', e => {
    if (e.key === 'Shift') shiftPressed = true;
    if (e.key === 'Control') ctrlPressed = true;
});
addEventListener('keyup', e => {
    if (e.key === 'Shift') shiftPressed = false;
    if (e.key === 'Control') ctrlPressed = false;
});
addEventListener('blur', () => { 
    shiftPressed = false;
    ctrlPressed = false;         // 防止切走后一直生效
});

// 工具：根据当前修饰键返回操作数量
function getMultiplier() {
    if (shiftPressed && ctrlPressed) return 1000;
    if (ctrlPressed) return 100;
    if (shiftPressed) return 10;
    return 1;
}

function showTooltip(el, text) {
    if (currentTooltip) currentTooltip.remove();
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = text;
    document.body.appendChild(tip);

    const rect = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    
    // 默认显示在元素下方
    let top = rect.bottom + 5;
    let left = rect.left;

    // 如果下方空间不足，则显示在元素上方
    if (top + tipRect.height > window.innerHeight) {
        top = rect.top - tipRect.height - 5;
        if (top < 0) top = 5; // 以防上方也不够，强制顶部留 5px
    }

    // 横向边界适配：不超出左右边界
    if (left + tipRect.width > window.innerWidth) {
        left = window.innerWidth - tipRect.width - 5;
    }
    if (left < 0) left = 5;

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    currentTooltip = tip;

    el.addEventListener('mouseleave', () => {
        tip.remove();
        currentTooltip = null;
    }, { once: true });
}
// 事件绑定
function bindEvents() {
    // 选项卡切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            const panels = ['building', 'tech',  'policy', 'trade', 'crystal', 'permanent','achievements', 'reset', 'changelog'];
            panels.forEach(p => {
                const panelEl = document.getElementById(`panel-${p}`);
                if (panelEl) panelEl.style.display = p === tab ? 'block' : 'none';
            });
            refreshUI();
            
        });
    });
    document.addEventListener('click', e => {
        if (e.ctrlKey) e.preventDefault();
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
                const max = getMultiplier();
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
                const max = getMultiplier();
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
                const techId = btn.dataset.tech;
                if (!Core.researchTech(techId)) {
                    const tech = GameState.techs[techId];
                    if (tech && !tech.researched && !canAfford(tech.price)) {
                        addToQueue('tech', techId);
                    }
                }
                return;
            }
            if (btn.classList.contains('upgrade-btn')) {
                const upId = btn.dataset.upgrade;
                const q = getMultiplier();
                if (!Core.buyUpgrade(upId, q)) {
                    const up = GameState.upgrades[upId];
                    if (up && up.visible && !canAfford(up.price)) {
                        addToQueue('upgrade', upId);
                    }
                }
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
                const bld = GameState.buildings[buildingKey];
                if (!bld) return;
                const quantity =getMultiplier();
                // 若当前完全买不起，直接加入队列
                if (!canAfford(bld.price)) {
                    addToQueue('building', buildingKey);
                    return;
                }
                const success = Core.buyBuilding(buildingKey, quantity);
                // 即使部分购买成功，剩余未购部分暂不处理
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
    let currentHighlightedCard = null;   // 当前高亮的建筑卡片元素

    function highlightResourcesForCard(card) {
        const bKey = card.dataset.building;
        if (!bKey || !GameState.buildings[bKey]) return;
        const price = GameState.buildings[bKey].price;
        for (let res in price) {
            const resItem = document.querySelector(`.resource-item[data-resource="${res}"]`);
            if (resItem) resItem.classList.add('highlight');
        }
    }

    function clearAllResourceHighlights() {
        document.querySelectorAll('.resource-item.highlight').forEach(el => el.classList.remove('highlight'));
    }

    document.body.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.building-card');
        if (!card) {
            // 鼠标移到了任何建筑卡片之外
            if (currentHighlightedCard) {
                clearAllResourceHighlights();
                currentHighlightedCard = null;
            }
            return;
        }
        if (card !== currentHighlightedCard) {
            // 进入了一个新的卡片（或从无到有）
            if (currentHighlightedCard) clearAllResourceHighlights();
            currentHighlightedCard = card;
            highlightResourcesForCard(card);
        }
        // 如果仍在同一卡片内（子元素切换），不做任何事
    });

    document.body.addEventListener('mouseout', (e) => {
        // 只有当鼠标真正离开卡片时才清除
        if (!currentHighlightedCard) return;
        const card = e.target.closest('.building-card');
        const related = e.relatedTarget;
        // 如果 relatedTarget 不在当前卡片内，说明离开了卡片
        if (!related || !related.closest('.building-card') || related.closest('.building-card') !== currentHighlightedCard) {
            clearAllResourceHighlights();
            currentHighlightedCard = null;
        }
    });

    // 资源悬停 → 高亮建筑
    document.body.addEventListener('mouseenter', (e) => {
        const resItem = e.target.closest('.resource-item');
        if (resItem && !resItem._highlightActive) {
            document.querySelectorAll('.building-card.highlight').forEach(el => el.classList.remove('highlight'));
            const resource = resItem.dataset.resource;
            if (resource) {
                document.querySelectorAll('.building-card').forEach(card => {
                    const bKey = card.dataset.building;
                    if (bKey && GameState.buildings[bKey]?.price?.[resource] !== undefined) {
                        card.classList.add('highlight');
                    }
                });
                resItem._highlightActive = true;
            }
        }
    }, true);

    document.body.addEventListener('mouseleave', (e) => {
        const resItem = e.target.closest('.resource-item');
        if (resItem) {
            resItem._highlightActive = false;
            document.querySelectorAll('.building-card.highlight').forEach(el => el.classList.remove('highlight'));
        }
    }, true);
    

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

        if (lrKey === 'population') {
            const container = document.getElementById('population-info');
            if (container) {
                container.innerHTML = displayText;
                container.classList.remove('pop-danger', 'pop-warning');
                if (isOver) container.classList.add('pop-danger');
                else if (isEqual) container.classList.add('pop-warning');
            }
        } else {
            document.querySelectorAll(`[data-local-resource="${lrKey}"]`).forEach(el => {
                el.textContent = displayText;
                el.classList.remove('local-over', 'local-equal', 'local-normal');
                if (isOver) {
                    el.classList.add('local-over');
                } else if (isEqual) {
                    el.classList.add('local-equal');
                } else {
                    el.classList.add('local-normal');
                }
            });
        }
    }
}
// 全局刷新动态颜色（每 tick 调用）
function refreshUI() {
    renderHappiness();
    if (typeof refreshBuildingPanel === 'function') refreshBuildingPanel();
    if (typeof refreshTechPanel === 'function') refreshTechPanel();
    if (typeof refreshUpgradePanel === 'function') refreshUpgradePanel();
    if (typeof refreshPermanentPanel === 'function') refreshPermanentPanel();
    if (typeof refreshTradePanel === 'function') refreshTradePanel();
    refreshResourceBars();
    refreshLocalResourcesDisplay();
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

        const valueSpan = item.querySelector('.res-value');
        if (valueSpan) valueSpan.textContent = `${formatNumber(amount)}/${capDisplay}`;

        const prodSpan = item.querySelector('.res-prod');
        const nameSpan = item.querySelector('.res-name');
        if (prodSpan) {
            if (Math.abs(prod) > 1e-9) {
                const sign = prod > 0 ? '+' : '';
                prodSpan.textContent = `${sign}${formatNumber(prod)}`;
                if (Math.abs(prod) > 1e-3){
                    prodSpan.style.color = prod < 0 ? 'var(--red)' : '';
                    valueSpan.style.color = prod < 0 ? 'var(--red)' : '';
                    nameSpan.style.color = prod < 0 ? 'var(--red)' : '';
                }
            } else {
                prodSpan.textContent = '';
            }
        }

        let percent = 0;
        if (cap !== Infinity && cap > 0) percent = Math.min(100, (amount / cap) * 100);
        const progressDiv = item.querySelector('.resource-progress');
        if (progressDiv) progressDiv.style.width = `${percent}%`;
    }
}
// 确保这些函数全局可用
refreshUI = refreshUI;
bindEvents = bindEvents;
showTooltip = showTooltip;
// shiftPressed 作为全局变量可直接访问，无需挂载