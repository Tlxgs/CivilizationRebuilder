// ui/buildings.js

let currentBuildingClass = null;

function getBuildingTooltip(buildingKey) {
    const bd = GameState.buildings[buildingKey];
    const cfg = BUILDINGS_CONFIG[buildingKey];
    if (!bd || !cfg) return '';

    const priceStr = Object.entries(bd.price).map(([r, amt]) => {
        const hasEnough = (GameState.resources[r]?.amount || 0) >= amt;
        const color = hasEnough ? '' : 'red';
        return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
    }).join(', ');

    let html = `<strong>${buildingKey}</strong><br>${cfg.desc}<br>`;
    html += `数量: ${bd.count} | 激活: ${bd.active}<br>`;
    html += `价格: ${priceStr}<br><br><strong>当前效果 (每座):<br></strong>`;


    const stats = ProductionEngine.getBuildingStats(buildingKey);
    if (stats) {
        // 局域资源
        for (let lrKey in stats.providesLocal) {
            const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
            if (lrCfg && stats.providesLocal[lrKey] !== 0) {
                html += `提供${lrCfg.name}: +${stats.providesLocal[lrKey]}<br>`;
            }
        }
        for (let lrKey in stats.requiresLocal) {
            const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
            if (lrCfg && stats.requiresLocal[lrKey] !== 0) {
                html += `需求${lrCfg.name}: ${stats.requiresLocal[lrKey]}<br>`;
            }
        }
        for (let det of stats.details) {
            if (det.type === 'prod') html += `${det.resource}: +${formatNumber(det.perBuilding)}/秒<br>`;
            else if (det.type === 'cons') html += `${det.resource}: -${formatNumber(det.perBuilding)}/秒<br>`;
            else if (det.type === 'cap') html += `${det.resource}上限: +${formatNumber(det.perBuilding)}<br>`;
        }
        if (stats.happinessPerBuilding !== 0) {
            html += `幸福度: ${stats.happinessPerBuilding > 0 ? '+' : ''}${stats.happinessPerBuilding.toFixed(2)}%<br>`;
        }
    }

    if (cfg.modifiers && cfg.modifiers.length) {
        html += `<br><strong>提供给其他建筑的加成:</strong><br>`;
        for (let mod of cfg.modifiers) {
            if (mod.prodFactor) html += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
            if (mod.consFactor) html += `${mod.target} 消耗 ${mod.consFactor > 0 ? '+' : ''}${(mod.consFactor * 100).toFixed(0)}%<br>`;
            if (mod.capFactor) html += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
        }
    }
    return html;
}

function getAffordabilityStatus(building) {
    const price = building.price;
    let canAffordNow = true, capIssue = false;
    for (let res in price) {
        const amount = GameState.resources[res]?.amount || 0;
        const cap = GameState.resources[res]?.cap || 0;
        if (amount < price[res]) {
            canAffordNow = false;
            if (cap !== Infinity && cap < price[res]) capIssue = true;
        }
    }
    if (canAffordNow) return 'affordable';
    return capIssue ? 'cap-exceeded' : 'insufficient';
}

function getClassName(cls) {
    const map = { ground: '地面', space: '太空', core: '地心', multiverse: '多元宇宙' };
    return map[cls] || cls;
}

// 获取与指定 type 绑定的局域资源（displayLocation === type 且 type 非大类名）
function getLocalResourcesForType(type) {
    const list = [];
    for (let key in LOCAL_RESOURCES_CONFIG) {
        if (LOCAL_RESOURCES_CONFIG[key].displayLocation === type) list.push(key);
    }
    return list;
}

// 获取属于整个大类的局域资源（displayLocation === cls）
function getLocalResourcesForClass(cls) {
    const list = [];
    for (let key in LOCAL_RESOURCES_CONFIG) {
        if (LOCAL_RESOURCES_CONFIG[key].displayLocation === cls) list.push(key);
    }
    return list;
}

// 渲染单个局域资源值的 HTML 片段
function renderLocalResourceValue(lrKey) {
    const lr = GameState.localResources[lrKey];
    const cfg = LOCAL_RESOURCES_CONFIG[lrKey];
    if (!lr || !cfg) return '';

    const usedDisplay = formatLocalNumber(lr.used);
    const capDisplay  = formatLocalNumber(lr.capacity);

    const isOver = (lr.used - lr.capacity) > 1e-6;
    const isEqual = Math.abs(lr.used - lr.capacity) <= 1e-6;
    const color = isOver ? '#c52828' : (isEqual ? '#e6a017' : '#2d3f53');

    return `<span style="background:#f0f4ff; padding:2px 8px; border-radius:4px; color:${color}; font-weight:500; margin-left:8px; font-size:0.9rem;">
        ${cfg.name}: ${usedDisplay} / ${capDisplay}
    </span>`;
}

function switchBuildingClass(cls) {
    const content = document.getElementById('building-class-content');
    if (!content) return;
    currentBuildingClass = cls;

    const typeMap = {};
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        if (!bd.visible) continue;
        const cfg = BUILDINGS_CONFIG[b];
        if (!cfg || cfg.class !== cls) continue;
        const type = cfg.type || '其他';
        if (!typeMap[type]) typeMap[type] = [];
        typeMap[type].push(b);
    }

    let html = '';

    // 大类通用局域资源
    const classResources = getLocalResourcesForClass(cls);
    if (classResources.length > 0) {
        html += '<div class="class-local-resources" style="display:flex; gap:1rem; margin-bottom:0.8rem; flex-wrap:wrap; padding:0.2rem 0;">';
        classResources.forEach(key => {
            html += renderLocalResourceValue(key);
        });
        html += '</div>';
    }

    for (let type in typeMap) {
        const buildings = typeMap[type];
        const typeResources = getLocalResourcesForType(type);
        let resourceHtml = '';
        typeResources.forEach(key => {
            resourceHtml += renderLocalResourceValue(key);
        });

        html += `<div class="building-category" style="margin-bottom:1rem;">
            <div style="display:flex; align-items:center; margin-bottom:5px;">
                <h4 style="border-left:3px solid var(--accent); padding-left:5px; margin:0;">${type}</h4>
                ${resourceHtml}
            </div>
            <div class="building-grid">`;

        for (let b of buildings) {
            const bd = GameState.buildings[b];
            const cfg = BUILDINGS_CONFIG[b];
            const status = getAffordabilityStatus(bd);
            let nameClass = '';
            if (status === 'insufficient') nameClass = 'insufficient-name';
            else if (status === 'cap-exceeded') nameClass = 'unaffordable-name';

            html += `<div class="building-card" data-building="${b}">`;
            if (cfg.modes && cfg.modes.length > 1) {
                const modeName = cfg.modes[bd.mode || 0]?.name || '未知';
                html += `<button class="mode-gear-btn" data-building="${b}" title="当前模式：${modeName}。点击切换模式">⚙️</button>`;
            }
            let effHtml = '';
            if (bd.active > 0 && bd.efficiency !== undefined && bd.efficiency < 0.995) {
                const percent = (bd.efficiency * 100).toFixed(0);
                effHtml = `<span style="color:#e6a017; font-size:0.8rem; margin-left:6px;">效率: ${percent}%</span>`;
            }
            html += `<div class="building-card-info">
                <strong class="${nameClass}">${b}</strong>
                <small>${bd.active}/${bd.count}</small>${effHtml}`;
            if (cfg.modes && cfg.modes.length > 1) {
                html += `<span class="mode-indicator"> | ${cfg.modes[bd.mode || 0].name}</span>`;
            }
            html += `</div>`;
            html += `<div class="btn-group">
                <button class="btn-square plus-btn" data-building="${b}">+</button>
                <button class="btn-square minus-btn" data-building="${b}">-</button>
            </div></div>`;
        }
        html += `</div></div>`;
    }

    if (html === '') html = '<p>该分类下暂无可用建筑</p>';
    content.innerHTML = html;

    // 绑定 tooltip
    document.querySelectorAll('#building-class-content .building-card').forEach(card => {
        const bName = card.dataset.building;
        card.addEventListener('mouseenter', () => {
            showTooltip(card, getBuildingTooltip(bName));
        });
    });
}

function renderBuildingPanel() {
    const panel = document.getElementById('panel-building');
    if (!panel) return;

    const classSet = new Set();
    for (let b in GameState.buildings) {
        if (!GameState.buildings[b].visible) continue;
        const cfg = BUILDINGS_CONFIG[b];
        if (cfg) classSet.add(cfg.class || 'ground');
    }
    const classes = Array.from(classSet);
    if (classes.length === 0) classes.push('ground');

    if (!currentBuildingClass || !classes.includes(currentBuildingClass)) {
        currentBuildingClass = classes[0];
    }

    let html = '<div class="sub-tabs">';
    classes.forEach(cls => {
        const active = cls === currentBuildingClass;
        html += `<button class="sub-tab-btn${active ? ' active' : ''}" data-class="${cls}">${getClassName(cls)}</button>`;
    });
    html += '</div><div id="building-class-content"></div>';
    panel.innerHTML = html;

    switchBuildingClass(currentBuildingClass);

    // 绑定子标签点击事件
    panel.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cls = btn.dataset.class;
            // 移除所有 active 类
            panel.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            // 给当前 btn 添加 active
            btn.classList.add('active');
            switchBuildingClass(cls);
        });
    });
}
window.renderBuildingPanel = renderBuildingPanel;