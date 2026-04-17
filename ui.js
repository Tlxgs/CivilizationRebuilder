// 悬浮提示
let currentTooltip = null;

function showTooltip(element, text) {
    if (currentTooltip) currentTooltip.remove();
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = text;
    document.body.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    currentTooltip = tooltip;
    element.addEventListener('mouseleave', () => {
        if (currentTooltip) currentTooltip.remove();
        currentTooltip = null;
    }, { once: true });
}
// ui.js - 渲染资源栏（只更新数值，不重建 DOM；为每个资源项单独绑定事件）
function renderResources() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;

    // 记录现有资源项（以资源名称为 key）
    const existingItems = new Map();
    for (const child of bar.children) {
        const resName = child.dataset.resource;
        if (resName) existingItems.set(resName, child);
    }

    // 遍历所有资源，更新或创建
    for (let r in GameState.resources) {
        const d = GameState.resources[r];
        if (!d.visible) continue;

        let capDisplay = (d.cap === Infinity) ? "∞" : formatNumber(d.cap);
        const content = `${r}: ${formatNumber(d.amount)}/${capDisplay} (${d.production > 0 ? '+' : ''}${formatNumber(d.production)}/s)`;

        let item = existingItems.get(r);
        if (item) {
            // 更新已有元素的文本内容
            item.textContent = content;
        } else {
            // 创建新元素
            item = document.createElement('div');
            item.className = 'resource-item';
            item.dataset.resource = r;
            item.textContent = content;

            // 直接绑定 mouseenter 事件（每个资源项独立绑定，稳定可靠）
            item.addEventListener('mouseenter', (e) => {
                const resName = item.dataset.resource;
                const resData = GameState.resources[resName];
                if (!resData) return;

                let tooltipHtml = `<strong>${resName}</strong><br>`;
                tooltipHtml += `当前: ${formatNumber(resData.amount)} / ${resData.cap === Infinity ? "∞" : formatNumber(resData.cap)}<br>`;
                tooltipHtml += `净产量: ${resData.production > 0 ? '+' : ''}${formatNumber(resData.production)}/秒<br><br>`;
                tooltipHtml += `<strong>各建筑贡献</strong><br>`;

                const contributions = getResourceContributions(resName);
                if (contributions.length === 0) {
                    tooltipHtml += `无`;
                } else {
                    for (let contrib of contributions) {
                        const sign = contrib.value > 0 ? '+' : '';
                        tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/秒<br>`;
                    }
                }
                showTooltip(item, tooltipHtml);
            });

            bar.appendChild(item);
        }
        existingItems.delete(r);
    }

    // 删除不再可见的资源项
    for (const [resName, elem] of existingItems) {
        elem.remove();
    }
}
// 渲染行动面板
function renderActionsPanel() {
    const container = document.getElementById('actions-panel');
    const hasNuke = GameState.techs["曼哈顿计划"]?.researched || false;
    const scienceCap = GameState.resources["科学"].cap;
    const relicGain = Math.floor(Math.log(scienceCap)**2);
    
    let html = '<h3>行动</h3><div class="action-buttons">';
    html += `<button class="action-btn" data-action="collect_wood">收集木头</button>`;
    html += `<button class="action-btn" data-action="collect_stone">收集石头</button>`;
    html += `<button class="action-btn" data-action="research_tech">研究科技</button>`;
    if (hasNuke) {
        html += `<button class="action-btn" data-action="nuke_reset">发射核弹</button>`;
    }
    //html += `<button class="action-btn" data-action="cheat_fill">作弊：填满资源</button>`;
    html += '</div>';
    container.innerHTML = html;
    
    document.querySelectorAll('.action-btn').forEach(btn => {
        const action = btn.dataset.action;
        let tooltipText = '';
        switch(action) {
            case "collect_wood":
                tooltipText = "立即获得 <strong>+1 木头</strong><br>";
                break;
            case "collect_stone":
                tooltipText = "立即获得 <strong>+1 石头</strong><br>";
                break;
            case "research_tech":
                tooltipText = "立即获得 <strong>+1 科学</strong><br>";
                break;
            case "nuke_reset":
                tooltipText = `发动核弹！<br>效果：重置你的所有资源、建筑、科技，并额外获得 <strong>${relicGain} 遗物</strong><br>`;
                break;
            case "cheat_fill":
                tooltipText = "作弊：将所有资源（除遗物外）填满至当前上限";
                break;
        }
        btn.addEventListener('mouseenter', (e) => showTooltip(btn, tooltipText));
    });
}
function renderBuildingPanel() {
    const panel = document.getElementById('panel-building');
    let html = '<div class="building-grid">';
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        if (!bd.visible) continue;
        html += `<div class="building-card" data-building="${b}">
            <div class="building-card-info">
                <strong>${b}</strong><br>
                <small>${bd.active}/${bd.count}</small>
            </div>
            <div class="btn-group">
                <button class="btn-square buy-btn" data-building="${b}">买</button>
                <button class="btn-square plus-btn" data-building="${b}">+</button>
                <button class="btn-square minus-btn" data-building="${b}">-</button>
            </div>
        </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;

    document.querySelectorAll('.building-card').forEach(card => {
        const bName = card.dataset.building;
        const bd = GameState.buildings[bName];
        const stats = getBuildingStats(bName);
        card.addEventListener('mouseenter', (e) => {
            const priceStr = Object.entries(bd.price)
                .map(([r, amt]) => `${r} ${formatNumber(amt)}`)
                .join(', ');
            let tooltipHtml = `<strong>${bName}</strong><br>${bd.desc}<br>数量: ${bd.count} | 激活: ${bd.active}<br>价格: ${priceStr}<br><br>`;

            if (stats && stats.details) {
                for (let det of stats.details) {
                    if (det.type === 'prod') {
                        const sign = '+';
                        tooltipHtml += `<strong>${det.resource}:</strong> ${sign}${formatNumber(det.perBuilding)}/秒<br>`;
                    } else if (det.type === 'cons') {
                        const sign = '-';
                        tooltipHtml += `<strong>${det.resource}:</strong> ${sign}${formatNumber(det.perBuilding)}/秒<br>`;
                    } else if (det.type === 'cap') {
                        tooltipHtml += `<strong>${det.resource}上限:</strong> +${formatNumber(det.perBuilding)}<br>`;
                    }
                }
            }
            showTooltip(card, tooltipHtml);
        });
    });
    updateBuyButtonsColor();
}

// 渲染科技面板
function renderTechPanel() {
    const panel = document.getElementById('panel-tech');
    let html = '<div class="grid-list">';
    let hasUnresearched = false;
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (tech.researched) continue;
        let canResearch = true;
        if (tech.prereq) {
            for (let p of tech.prereq) {
                if (!GameState.techs[p]?.researched) canResearch = false;
            }
        }
        if (!canResearch) continue;
        hasUnresearched = true;
        html += `<button class="card-btn tech-btn" data-tech="${t}"><b>${t}</b></button>`;
    }
    if (!hasUnresearched) html = '<p>暂无可用科技</p>';
    else html += '</div>';
    
    html += '<h3>已研究</h3><div class="grid-list">';
    let hasResearched = false;
    for (let t in GameState.techs) {
        if (GameState.techs[t].researched) {
            hasResearched = true;
            html += `<span class="card-btn researched-item" data-tech="${t}" style="background:#3a5a30">${t}</span>`;
        }
    }
    if (!hasResearched) html += '<p>暂无已研究科技</p>';
    html += '</div>';
    panel.innerHTML = html;

    document.querySelectorAll('.tech-btn, .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;
        let text = `<strong>${techName}</strong><br>${tech.desc}<br>消耗: ${Object.entries(tech.price).map(([r,amt]) => `${r} ${formatNumber(amt)}`).join(', ')}`;
        if (tech.researched) text += '<br>✓ 已研究</span>';
        el.addEventListener('mouseenter', (e) => showTooltip(el, text));
    });
}

// 渲染升级面板
function renderUpgradePanel() {
    const panel = document.getElementById('panel-upgrade');
    let hasAny = false;
    let html = '<div class="grid-list">';
    for (let u in GameState.upgrades) {
        const up = GameState.upgrades[u];
        if (!up.visible) continue;
        hasAny = true;
        html += `<button class="card-btn upgrade-btn" data-upgrade="${u}"><b>${u} Lv.${up.level}</b></button>`;
    }
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用升级</p>';
        return;
    }
    html += '</div>';
    panel.innerHTML = html;
    
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upName = btn.dataset.upgrade;
        const up = GameState.upgrades[upName];
        const priceStr = Object.entries(up.price).map(([r, amt]) => `${r} ${formatNumber(amt)}`).join(', ');
        let effectText = '';
        for (let b in up.effect) {
            effectText += `${b} 效率 +${(up.effect[b]*100).toFixed(0)}%<br>`;
        }
        let text = `<strong>${upName}</strong><br>${up.desc}<br>等级: ${up.level}<br>价格: ${priceStr}<br>效果:<br>${effectText}`;
        btn.addEventListener('mouseenter', (e) => showTooltip(btn, text));
    });
}
// 辅助函数：生成政策选项的 tooltip 文本
function getPolicyOptionTooltip(policyGroup, optionKey) {
    const policy = GameState.policies[policyGroup];
    if (!policy) return "";
    const option = policy.options[optionKey];
    if (!option) return "";
    
    const cost = option.price || 0;
    let html = `<strong>${optionKey}</strong><br>`;
    if (cost > 0) html += `消耗: ${cost} 政策点<br>`;
    else html += `消耗: 0 政策点<br>`;
    
    // 收集所有效果
    const effects = [];
    
    // 产量加成 (prodFactor)
    if (option.prodFactor) {
        for (let [building, factor] of Object.entries(option.prodFactor)) {
            if (factor > 0) effects.push(`${building} 产量 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 产量 ${(factor * 100).toFixed(0)}%`);
        }
    }
    // 消耗加成 (consFactor) — 影响建筑的消耗量
    if (option.consFactor) {
        for (let [building, factor] of Object.entries(option.consFactor)) {
            if (factor > 0) effects.push(`${building} 消耗 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 消耗 ${(factor * 100).toFixed(0)}%`);
        }
    }
    // 上限加成 (capFactor)
    if (option.capFactor) {
        for (let [building, factor] of Object.entries(option.capFactor)) {
            if (factor > 0) effects.push(`${building} 上限 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 上限 ${(factor * 100).toFixed(0)}%`);
        }
    }
    
    if (effects.length === 0) {
        html += "无特殊效果";
    } else {
        html += "<br><strong>效果：</strong><br>" + effects.join("<br>");
    }
    return html;
}

function renderPolicyPanel() {
    const panel = document.getElementById('panel-policy');
    let hasAny = false;
    let html = '';
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        if (!pol.visible) continue;
        hasAny = true;
        html += `<div class="policy-group"><div class="policy-title">${p}</div>`;
        for (let opt in pol.options) {
            const optData = pol.options[opt];
            const isActive = (pol.activePolicy === opt);
            html += `<div class="policy-option" data-group="${p}" data-option="${opt}">
                        <label class="radio-label">
                            <input type="radio" name="${p}" value="${opt}" ${isActive ? 'checked' : ''}>
                            <span class="policy-option-name">${opt}</span>
                        </label>
                    </div>`;
        }
        html += '</div>';
    }
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用政策</p>';
        return;
    }
    panel.innerHTML = html;
    
    // 为每个政策选项绑定 tooltip
    document.querySelectorAll('.policy-option').forEach(container => {
        const group = container.dataset.group;
        const option = container.dataset.option;
        const tooltipText = getPolicyOptionTooltip(group, option);
        container.addEventListener('mouseenter', (e) => {
            showTooltip(container, tooltipText);
        });
    });
}

// 渲染永恒面板
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
        el.addEventListener('mouseenter', (e) => showTooltip(el, text));
    });
}

// 渲染重置面板
function renderResetPanel() {
    const panel = document.getElementById('panel-reset');
    panel.innerHTML = `
        <div class="reset-area">
            <button class="btn-rect" id="hard-reset" title="彻底清除存档，重新开始游戏">硬重置</button>
            <button class="btn-rect" id="manual-save">手动保存</button>
            <button class="btn-rect" id="export-save">导出存档</button>
            <button class="btn-rect" id="import-save">导入存档</button>
        </div>
        <p>每10秒自动保存</p>
    `;
}

// 渲染贸易面板
function renderTradePanel() {
    const panel = document.getElementById('panel-trade');
    const market = GameState.buildings["市场"];
    const marketUnlocked = market && market.visible;
    
    if (!marketUnlocked) {
        panel.innerHTML = '<p>暂未解锁</p>';
        return;
    }
    
    const volume = getMarketTradeVolume();
    let html = `<div style="margin-bottom:10px;">当前交易量: ${formatNumber(volume)} 金等值/次<br>`;
    html += `提示: 增加市场激活数量来提高单次交易量。</div>`;
    html += '<div class="trade-grid">';
    
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (r === "金") continue;
        if (!res.hasOwnProperty('value')) continue;
        if (!res.visible && res.amount === 0) continue;
        
        const heat = res.heat || 1;
        const buyCost = volume * heat;
        const buyGet = volume / res.value;
        const sellGet = volume * heat * 0.8;
        const sellCost = volume / res.value;
        
        html += `<div class="trade-card">
            <div class="trade-name"><strong>${r}</strong> <span style="font-size:0.8rem;">🔥: ${heat.toFixed(3)}</span></div>
            <div class="trade-buttons">
                <button class="trade-buy-btn" data-resource="${r}">买 ${formatNumber(buyGet)} ${r} (${formatNumber(buyCost)} 金)</button>
                <button class="trade-sell-btn" data-resource="${r}">卖 ${formatNumber(sellCost)} ${r} (${formatNumber(sellGet)} 金)</button>
            </div>
        </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
    
    // 绑定交易按钮事件
    document.querySelectorAll('.trade-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            if (buyResource(resource)) {
                renderAll();
                saveGame();
            } else {
                alert("交易失败：金不足或市场未解锁");
            }
        });
        btn.addEventListener('mouseenter', (e) => {
            const resource = btn.dataset.resource;
            const res = GameState.resources[resource];
            const volume = getMarketTradeVolume();
            const heat = res.heat || 1;
            const buyCost = volume * heat;
            const buyGet = volume / res.value;
            showTooltip(btn, `购买 ${formatNumber(buyGet)} ${resource}<br>消耗 ${formatNumber(buyCost)} 金<br>`);
        });
    });
    document.querySelectorAll('.trade-sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            if (sellResource(resource)) {
                renderAll();
                saveGame();
            } else {
                alert("交易失败：资源不足或市场未解锁");
            }
        });
        btn.addEventListener('mouseenter', (e) => {
            const resource = btn.dataset.resource;
            const res = GameState.resources[resource];
            const volume = getMarketTradeVolume();
            const heat = res.heat || 1;
            const sellGet = volume * heat * 0.8;
            const sellCost = volume / res.value;
            showTooltip(btn, `出售 ${formatNumber(sellCost)} ${resource}<br>获得 ${formatNumber(sellGet)} 金<br>`);
        });
    });
}

function renderAll() {
    renderResources();
    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderUpgradePanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderResetPanel();
    renderTradePanel();
    updateTabsVisibility();  // 新增：更新标签可见性
}
function bindEvents() {
    // 选项卡切换（关键修复：加入 'trade'）
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            const panels = ['building', 'tech', 'upgrade', 'policy', 'trade', 'permanent', 'reset'];
            panels.forEach(p => {
                const panelEl = document.getElementById(`panel-${p}`);
                if (panelEl) {
                    panelEl.style.display = p === tab ? 'block' : 'none';
                }
            });
            renderAll();
        });
    });

    // 全局点击事件
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        if (btn.dataset.action) {
            if (btn.dataset.action === 'nuke_reset') {
                const scienceCap = GameState.resources["科学"].cap;
                const relicGain = Math.floor(Math.log(scienceCap)**2);
                if (confirm(`发射核弹！\n将执行软重置（保留遗物和永恒升级），并根据当前科学上限获得 ${relicGain} 遗物。\n确定要发射核弹吗？`)) {
                    performAction(btn.dataset.action);
                    renderAll();
                }
            } else {
                performAction(btn.dataset.action);
                renderAll();
            }
            return;
        }
        
        // 建筑按钮
        if (btn.classList.contains('buy-btn')) {
            buyBuilding(btn.dataset.building);
            renderAll();
        } else if (btn.classList.contains('plus-btn')) {
            const b = btn.dataset.building;
            const bd = GameState.buildings[b];
            if (bd.active < bd.count) bd.active++;
            renderAll();
        } else if (btn.classList.contains('minus-btn')) {
            const b = btn.dataset.building;
            const bd = GameState.buildings[b];
            if (bd.active > 0) bd.active--;
            renderAll();
        } else if (btn.classList.contains('tech-btn')) {
            researchTech(btn.dataset.tech);
            renderAll();
        } else if (btn.classList.contains('upgrade-btn')) {
            buyUpgrade(btn.dataset.upgrade);
            renderAll();
        } else if (btn.classList.contains('perm-btn')) {
            buyPermanent(btn.dataset.permanent);
            renderAll();
        
        // ========= 重置按钮（硬重置加确认） =========
        } else if (btn.id === 'hard-reset') {
            if (confirm("警告：硬重置将清除所有游戏数据，包括永恒和遗物，并重新开始。确定吗？")) {
                hardReset();
            }
        } else if (btn.id === 'manual-save') {
            saveGame();
        } else if (btn.id === 'export-save') {
            exportGame();
        } else if (btn.id === 'import-save') {
            document.getElementById('import-modal').style.display = 'flex';
        }
    });
    
    // 政策切换（radio change）
    document.addEventListener('change', (e) => {
        if (e.target.type === 'radio') {
            const name = e.target.name;
            const value = e.target.value;
            const success = switchPolicy(name, value);
            if (!success) {
                const pol = GameState.policies[name];
                if (pol) {
                    e.target.checked = false;
                    document.querySelector(`input[name="${name}"][value="${pol.activePolicy}"]`).checked = true;
                }
                alert("政策点不足！");
            }
            renderAll();
        }
    });
    
    // 导入模态框
    const closeModal = () => document.getElementById('import-modal').style.display = 'none';
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.getElementById('cancel-import')?.addEventListener('click', closeModal);
    document.getElementById('confirm-import')?.addEventListener('click', () => {
        const text = document.getElementById('import-text').value;
        importGame(text);
        closeModal();
        renderAll();
    });
}

function updateBuyButtonsColor() {
    const buyBtns = document.querySelectorAll('.buy-btn');
    for (let btn of buyBtns) {
        const buildingKey = btn.dataset.building;
        if (!buildingKey) continue;
        const building = GameState.buildings[buildingKey];
        if (!building) continue;
        if (canAfford(building.price)) {
            btn.style.color = '';          // 可购买，恢复默认颜色
        } else {
            btn.style.color = 'red';       // 买不起，红色字体
        }
    }
}
function getResourceContributions(resourceName) {
    const contributions = [];
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        if (bd.active === 0) continue;
        const stats = getBuildingStats(b);
        if (!stats) continue;
        // 只取产出或消耗类型的详情，忽略上限类型
        const detail = stats.details.find(d => d.resource === resourceName && (d.type === 'prod' || d.type === 'cons'));
        if (detail && Math.abs(detail.total) > 0.0001) {
            contributions.push({
                building: b,
                value: detail.total
            });
        }
    }
    return contributions;
}
// ui.js - 更新选项卡标签的可见性
function updateTabsVisibility() {
    // 升级标签：有任意可见的升级项
    let hasUpgrade = false;
    for (let u in GameState.upgrades) {
        if (GameState.upgrades[u].visible) {
            hasUpgrade = true;
            break;
        }
    }
    const upgradeTab = document.querySelector('.tab-btn[data-tab="upgrade"]');
    if (upgradeTab) upgradeTab.style.display = hasUpgrade ? '' : 'none';

    // 政策标签：有任意可见的政策组
    let hasPolicy = false;
    for (let p in GameState.policies) {
        if (GameState.policies[p].visible) {
            hasPolicy = true;
            break;
        }
    }
    const policyTab = document.querySelector('.tab-btn[data-tab="policy"]');
    if (policyTab) policyTab.style.display = hasPolicy ? '' : 'none';

    // 贸易标签：市场建筑已解锁（visible为true）
    const market = GameState.buildings["市场"];
    const hasTrade = market && market.visible;
    const tradeTab = document.querySelector('.tab-btn[data-tab="trade"]');
    if (tradeTab) tradeTab.style.display = hasTrade ? '' : 'none';

    // 永恒标签：遗物数量大于0 或者 存在任何已研究的永恒升级
    const relicAmount = GameState.resources["遗物"]?.amount || 0;
    let hasResearchedPermanent = false;
    for (let p in GameState.permanent) {
        if (GameState.permanent[p].researched) {
            hasResearchedPermanent = true;
            break;
        }
    }
    const hasPermanent = (relicAmount > 0) || hasResearchedPermanent;
    const permanentTab = document.querySelector('.tab-btn[data-tab="permanent"]');
    if (permanentTab) permanentTab.style.display = hasPermanent ? '' : 'none';

    // 如果当前激活的标签被隐藏，自动切换到第一个可见标签
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.style.display === 'none') {
        const firstVisibleTab = document.querySelector('.tab-btn:not([style*="display: none"])');
        if (firstVisibleTab) {
            firstVisibleTab.click();
        } else {
            // 默认显示建筑标签（建筑始终可见）
            const buildingTab = document.querySelector('.tab-btn[data-tab="building"]');
            if (buildingTab) buildingTab.click();
        }
    }
}