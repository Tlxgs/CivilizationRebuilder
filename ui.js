// 悬浮提示
let currentTooltip = null;
let shiftPressed = false;
window.addEventListener('keydown', (e) => { if (e.key === 'Shift') shiftPressed = true; });
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') shiftPressed = false; });
window.addEventListener('blur', () => { shiftPressed = false; }); // 窗口失焦时重置
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
    const hasVacuumDecay = GameState.techs["真空衰变"]?.researched || false;
    const scienceCap = GameState.resources["科学"].cap;
    const relicGain = getRelicGain();
    
    let html = '<h3>行动</h3><div class="action-buttons">';
    html += `<button class="action-btn" data-action="collect_wood">收集木头</button>`;
    html += `<button class="action-btn" data-action="collect_stone">收集石头</button>`;
    html += `<button class="action-btn" data-action="research_tech">研究科技</button>`;
    if (hasNuke) {
        html += `<button class="action-btn" data-action="nuke_reset">发射核弹</button>`;
    }
    if (hasVacuumDecay) {
        html += `<button class="action-btn" data-action="vacuum_decay">真空衰变</button>`;
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
                tooltipText = `发动核弹！重置你的所有资源、建筑、科技，并额外获得遗物`;
                break;
            case "vacuum_decay":
                tooltipText = `真空衰变！\n重置游戏，获得更多遗物，并获得暗能量（取决于暗物质研究所数量）`;
                break;
            case "cheat_fill":
                tooltipText = "作弊：将所有资源填满至当前上限";
                break;
        }
        btn.addEventListener('mouseenter', (e) => showTooltip(btn, tooltipText));
    });
}
// ui.js - 按分类渲染建筑面板
function renderBuildingPanel() {
    const panel = document.getElementById('panel-building');
    
    // 定义分类顺序和显示名称
    const categories = [
        { key: "生产", label: "生产建筑" },
        { key: "工厂", label: "工厂建筑" },
        { key: "电力", label: "电力建筑" },
        { key: "科学", label: "科学建筑" },
        { key: "存储", label: "存储建筑" },
        { key: "太空", label: "太空建筑" },
        { key: "其他", label: "其他建筑" }
    ];
    
    // 按分类收集可见建筑
    let categorizedBuildings = {};
    for (let cat of categories) {
        categorizedBuildings[cat.key] = [];
    }
    
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        if (!bd.visible) continue;
        const type = bd.type || "其他"; // 兼容未定义type的情况，默认为其他
        if (categorizedBuildings[type]) {
            categorizedBuildings[type].push(b);
        } else {
            categorizedBuildings["其他"].push(b);
        }
    }
    
    let html = '';
    for (let cat of categories) {
        const buildings = categorizedBuildings[cat.key];
        if (buildings.length === 0) continue;
        
        html += `<div class="building-category" style="margin-bottom: 1rem;">
                    <h3 style="border-left: 4px solid #2a7faa; padding-left: 5px; margin: 0 0 5px 0;">${cat.label}</h3>
                    <div class="building-grid">`;
        
        for (let b of buildings) {
            const bd = GameState.buildings[b];
            html += `<div class="building-card" data-building="${b}">
                        <div class="building-card-info">
                            <strong>${b}</strong>
                            <small>${bd.active}/${bd.count}</small>
                        </div>
                        <div class="btn-group">
                            <button class="btn-square buy-btn" data-building="${b}">买</button>
                            <button class="btn-square plus-btn" data-building="${b}">+</button>
                            <button class="btn-square minus-btn" data-building="${b}">-</button>
                        </div>
                    </div>`;
        }
        
        html += `</div></div>`;
    }
    
    if (html === '') {
        html = '<p>暂无可用建筑</p>';
    }
    
    panel.innerHTML = html;
    
    // 重新绑定悬浮提示 (与原有逻辑保持一致)
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
                        tooltipHtml += `<strong>${det.resource}:</strong> +${formatNumber(det.perBuilding)}/秒<br>`;
                    } else if (det.type === 'cons') {
                        tooltipHtml += `<strong>${det.resource}:</strong> -${formatNumber(det.perBuilding)}/秒<br>`;
                    } else if (det.type === 'cap') {
                        tooltipHtml += `<strong>${det.resource}上限:</strong> +${formatNumber(det.perBuilding)}<br>`;
                    }
                }
            }
            if (bd.modifiers && bd.modifiers.length > 0) {
                tooltipHtml += `<br><strong>提供加成：</strong><br>`;
                for (let mod of bd.modifiers) {
                    if (mod.prodFactor) {
                        tooltipHtml += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
                    }
                    if (mod.consFactor) {
                        let sign = mod.consFactor > 0 ? '+' : '';
                        tooltipHtml += `${mod.target} 消耗 ${sign}${(mod.consFactor * 100).toFixed(0)}%<br>`;
                    }
                    if (mod.capFactor) {
                        tooltipHtml += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
                    }
                }
            }
            if (bName === "博物馆") {
                const relicAmt = GameState.resources["遗物"]?.amount || 0;
                const bonus =  0.1 * Math.log(2.72**5 + relicAmt);
                const sign = bonus > 0 ? '+' : '';
                tooltipHtml += `<br><strong>幸福度影响：</strong> ${sign}${bonus.toFixed(2)}% (该影响基于遗物数量)<br>`;
            } else if (bd.happinessEffect !== undefined && bd.happinessEffect !== 0) {
                const sign = bd.happinessEffect > 0 ? '+' : '';
                const effectPercent = (bd.happinessEffect).toFixed(1);
                tooltipHtml += `<br><strong>幸福度影响：</strong> ${sign}${effectPercent}%<br>`;
            }
            showTooltip(card, tooltipHtml);
        });
    });
    
    // 更新购买按钮颜色
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
        <p>按住shift键可以每次购买/加减10个建筑</p>
        <p>本游戏灵感来源于《猫国建设者》《进化》等优秀放置游戏</p>
        <p>目前游戏还处于开发阶段，存档不稳定，因此请经常导出存档</p>
        <p>如果你发现进度过于缓慢，代表你基本通关了</p>
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
            <div class="trade-name"><strong>${r}</strong> <span style="font-size:0.8rem;"></span></div>
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
    renderHappiness();
    renderResources();
    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderUpgradePanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderResetPanel();
    renderTradePanel();
    renderChangelogPanel();
    renderLogPanel();
    updateTabsVisibility();
}
function bindEvents() {
    // 选项卡切换（关键修复：加入 'trade'）
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            const panels = ['building', 'tech', 'upgrade', 'policy', 'trade', 'permanent',  'reset','changelog'];
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
                const relicGain = getRelicGain();
                if (confirm(`发射核弹！\n将执行软重置，并根据当前科学上限获得 ${relicGain} 遗物。\n确定要发射核弹吗？`)) {
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
            const buildingKey = btn.dataset.building;
            const maxTimes = shiftPressed ? 10 : 1;
            let success = false;
            for (let i = 0; i < maxTimes; i++) {
                if (buyBuilding(buildingKey)) {
                    success = true;
                } else {
                    break; // 买不起或达到上限则停止
                }
            }
            if (success) renderAll();
        } else if (btn.classList.contains('plus-btn')) {
            const buildingKey = btn.dataset.building;
            const bd = GameState.buildings[buildingKey];
            const maxTimes = shiftPressed ? 10 : 1;
            const increase = Math.min(maxTimes, bd.count - bd.active);
            if (increase > 0) {
                bd.active += increase;
                renderAll();
            }
        } else if (btn.classList.contains('minus-btn')) {
            const buildingKey = btn.dataset.building;
            const bd = GameState.buildings[buildingKey];
            const maxTimes = shiftPressed ? 10 : 1;
            const decrease = Math.min(maxTimes, bd.active);
            if (decrease > 0) {
                bd.active -= decrease;
                renderAll();
            }
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
            if (confirm("警告：硬重置将清除所有游戏数据，包括永恒升级，并重新开始。确定吗？")) {
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
// ui.js - 修复资源贡献显示符号
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
            // 关键修复：消耗类型贡献值取负，产出类型保持正
            const value = detail.type === 'cons' ? -detail.total : detail.total;
            contributions.push({
                building: b,
                value: value
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
    const changelogTab = document.querySelector('.tab-btn[data-tab="changelog"]');
    if (changelogTab) changelogTab.style.display = '';
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


// 渲染更新日志面板
function renderChangelogPanel() {
    const panel = document.getElementById('panel-changelog');
    if (!panel) return;
    
    let html = '<div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">';
    
    for (let log of ChangelogData.logs) {
        html += `
            <div style="margin-bottom: 24px; border-left: 3px solid #2a7faa; padding-left: 15px;">
                <h3 style="margin: 0 0 5px 0; color: #1e384b;">${log.version} <span style="font-size: 0.85rem; color: #6c7a8a;">(${log.date})</span></h3>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #2d3f53;">
        `;
        for (let change of log.changes) {
            html += `<li style="margin: 4px 0;">${change}</li>`;
        }
        html += `
                </ul>
            </div>
        `;
    }
    
    panel.innerHTML = html;
}
function renderHappiness() {
    const el = document.getElementById('happiness-display');
    if (el) {
        const happiness = GameState.happiness || 100;
        el.innerHTML = `😊 幸福度: ${happiness.toFixed(1)}%`;
    }
}
