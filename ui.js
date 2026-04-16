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

// 渲染资源栏
function renderResources() {
    const bar = document.getElementById('resource-bar');
    let html = '';
    for (let r in GameState.resources) {
        const d = GameState.resources[r];
        if (!d.visible) continue;
        let capDisplay = (d.cap === Infinity) ? "∞" : formatNumber(d.cap);
        html += `<div class="resource-item" data-resource="${r}">${r}: ${formatNumber(d.amount)}/${capDisplay} (${d.production > 0 ? '+' : ''}${formatNumber(d.production)}/s)</div>`;
    }
    bar.innerHTML = html || '<div>暂无资源</div>';
    
    document.querySelectorAll('.resource-item').forEach(el => {
        const resName = el.dataset.resource;
        el.addEventListener('mouseenter', (e) => {
            const d = GameState.resources[resName];
            let text = `<strong>${resName}</strong><br>当前: ${formatNumber(d.amount)} / ${d.cap === Infinity ? "∞" : formatNumber(d.cap)}<br>净产量: ${d.production > 0 ? '+' : ''}${formatNumber(d.production)}/秒`;
            showTooltip(el, text);
        });
    });
}

// 渲染行动面板
function renderActionsPanel() {
    const container = document.getElementById('actions-panel');
    const hasNuke = GameState.techs["曼哈顿计划"]?.researched || false;
    const scienceCap = GameState.resources["科学"].cap;
    const relicGain = Math.floor(Math.log(scienceCap))**2;
    
    let html = '<h3>行动</h3><div class="action-buttons">';
    html += `<button class="action-btn" data-action="collect_wood">🌲 收集木头</button>`;
    html += `<button class="action-btn" data-action="collect_stone">🪨 收集石头</button>`;
    html += `<button class="action-btn" data-action="research_tech">🔬 研究科技</button>`;
    if (hasNuke) {
        html += `<button class="action-btn" data-action="nuke_reset">💣 发射核弹</button>`;
    }
    //html += `<button class="action-btn" data-action="cheat_fill">🎮 作弊：填满资源</button>`;
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
        const priceStr = Object.entries(bd.price).map(([r, amt]) => `${r} ${formatNumber(amt)}`).join(', ');
        
        card.addEventListener('mouseenter', (e) => {
            let tooltipHtml = `<strong>${bName}</strong><br>${bd.desc || ''}<br>`;
            tooltipHtml += `数量: ${bd.count} | 激活: ${bd.active}<br>`;
            tooltipHtml += `效率: ${(bd.efficiency * 100).toFixed(0)}%<br>`;
            tooltipHtml += `价格: ${priceStr}<br>`;
            
            if (stats && stats.details.length > 0) {
                tooltipHtml += '<hr><strong>产出/消耗</strong><br>';
                for (let det of stats.details) {
                    if (det.resource === "储存") continue;
                    tooltipHtml += `<strong>${det.resource}:</strong><br>`;
                    tooltipHtml += det.bonusText.replace(/\n/g, '<br>') + '<br>';
                    tooltipHtml += '<hr>';
                }
            } else {
                tooltipHtml += '<hr><small>无产出/消耗</small><br>';
            }
            
            if (bd.capProvide && Object.keys(bd.capProvide).length > 0) {
                tooltipHtml += '<strong>提供上限</strong><br>';
                const techCapBonus = getTechCapBonusForBuilding(bName);
                for (let [res, val] of Object.entries(bd.capProvide)) {
                    let baseProvide = val;
                    let techBonus = techCapBonus[res] || 0;
                    let effectiveProvide = (baseProvide + techBonus) * bd.efficiency;
                    let totalCap = effectiveProvide * bd.active;
                    let effPercent = (bd.efficiency * 100).toFixed(0);
                    
                    tooltipHtml += `<strong>${res}:</strong><br>`;
                    tooltipHtml += `&nbsp;&nbsp;基础: +${formatNumber(baseProvide)}/建筑<br>`;
                    if (techBonus !== 0) {
                        tooltipHtml += `&nbsp;&nbsp;科技加成: +${formatNumber(techBonus)}/建筑<br>`;
                    }
                    tooltipHtml += `&nbsp;&nbsp;效率: ${effPercent}% → +${formatNumber(effectiveProvide)}/建筑<br>`;
                    tooltipHtml += `&nbsp;&nbsp;<span style="color:#ffdd99;">总计: +${formatNumber(totalCap)}</span><br>`;
                }
                tooltipHtml += '<hr>';
            }
            
            const mult = getPermanentMultipliers();
            if (mult.capRatio !== 1 || mult.sciCapRatio !== 1) {
                tooltipHtml += '<small>遗物加成：非科学上限 ×' + formatNumber(mult.capRatio) + '，科学上限 ×' + formatNumber(mult.sciCapRatio) + '</small><br>';
            }
            
            tooltipHtml = tooltipHtml.replace(/(<hr>)+$/, '');
            showTooltip(card, tooltipHtml);
        });
    });
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
    
    html += '<h3>✅ 已研究</h3><div class="grid-list">';
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
        if (tech.researched) text += '<br><span style="color:#aaffaa">✓ 已研究</span>';
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
        let text = `<strong>${upName}</strong><br>${up.desc}<br>等级: ${up.level}<br>💰 价格: ${priceStr}<br>效果:<br>${effectText}`;
        btn.addEventListener('mouseenter', (e) => showTooltip(btn, text));
    });
}

// 渲染政策面板
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
            const cost = optData.price || 0;
            let costText = cost > 0 ? ` (消耗 ${cost} 政策点)` : '';
            html += `<label class="radio-label"><input type="radio" name="${p}" value="${opt}" ${pol.activePolicy === opt ? 'checked' : ''}> ${opt} - ${optData.desc || ''}${costText}</label>`;
        }
        html += '</div>';
    }
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用政策</p>';
        return;
    }
    panel.innerHTML = html;
}

// 渲染永久科技面板
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
        html += '<h3>已研究永久科技</h3><div class="grid-list">';
        for (let p of researched) {
            html += `<span class="card-btn researched-perm" data-permanent="${p}" style="background:#3a5a30">${p}</span>`;
        }
        html += '</div>';
    }
    if (notResearched.length === 0 && researched.length === 0) {
        html = '<p>暂无永久科技</p>';
    }
    panel.innerHTML = html;

    document.querySelectorAll('.perm-btn, .researched-perm').forEach(el => {
        const permName = el.dataset.permanent;
        const perm = GameState.permanent[permName];
        if (!perm) return;
        let text = `<strong>${permName}</strong><br>${perm.desc}<br>消耗: ${Object.entries(perm.price).map(([r,amt]) => `${r} ${formatNumber(amt)}`).join(', ')}`;
        if (perm.researched) text += '<br><span style="color:#aaffaa">✓ 已获得</span>';
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
        <p>自动保存每10秒</p>
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
            <div class="trade-name"><strong>${r}</strong> <span style="font-size:0.8rem;">🔥: ${heat.toFixed(2)}</span></div>
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
            showTooltip(btn, `购买 ${formatNumber(buyGet)} ${resource}<br>消耗 ${formatNumber(buyCost)} 金<br>当前热度: ${heat.toFixed(2)}`);
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
            showTooltip(btn, `出售 ${formatNumber(sellCost)} ${resource}<br>获得 ${formatNumber(sellGet)} 金<br>当前热度: ${heat.toFixed(2)}`);
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
    renderTradePanel();  // 确保贸易面板被渲染
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
                const relicGain = Math.floor(Math.log(scienceCap))**2;
                if (confirm(`发射核弹！\n将执行软重置（保留遗物和永久科技），并根据当前科学上限获得 ${relicGain} 遗物。\n确定要发射核弹吗？`)) {
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
            if (confirm("警告：硬重置将清除所有游戏数据，包括永久科技和遗物，并重新开始。确定吗？")) {
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