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

    // 局域资源供需
    const provides = cfg.providesLocal || {};
    const requires = cfg.requiresLocal || {};
    for (let lrKey in provides) {
        const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
        if (lrCfg && provides[lrKey] !== 0) {
            html += `提供${lrCfg.name}: +${provides[lrKey]}<br>`;
        }
    }
    for (let lrKey in requires) {
        const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
        if (lrCfg && requires[lrKey] !== 0) {
            html += `需求${lrCfg.name}: ${requires[lrKey]}<br>`;
        }
    }

    const stats = ProductionEngine.getBuildingStats(buildingKey);
    if (stats) {
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

    // 1. 大类通用局域资源（如太空宜居度对整个 space 类生效）
    const classResources = getLocalResourcesForClass(cls);
    if (classResources.length > 0) {
        html += '<div class="class-local-resources" style="display:flex; gap:1rem; margin-bottom:0.8rem; flex-wrap:wrap; padding:0.2rem 0;">';
        classResources.forEach(key => {
            html += renderLocalResourceValue(key);
        });
        html += '</div>';
    }

    // 2. 按 type 渲染子类
    for (let type in typeMap) {
        const buildings = typeMap[type];
        // 子类专属局域资源（如月球的氧气）
        const typeResources = getLocalResourcesForType(type);
        let resourceHtml = '';
        typeResources.forEach(key => {
            resourceHtml += renderLocalResourceValue(key);
        });

        // 子类标题行，右侧带局域资源值
        html += `<div class="building-category" style="margin-bottom:1rem;">
            <div style="display:flex; align-items:center; margin-bottom:5px;">
                <h4 style="border-left:3px solid #2a7faa; padding-left:5px; margin:0;">${type}</h4>
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
            if (bd.active > 0 && bd.efficiency !== undefined && bd.efficiency < 0.9999) {
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

    let html = '<div class="sub-tabs" style="margin-bottom:0.8rem; display:flex; gap:0.3rem; border-bottom:2px solid #e9ecef;">';
    classes.forEach(cls => {
        const active = cls === currentBuildingClass;
        html += `<button class="sub-tab-btn ${active ? 'active' : ''}" data-class="${cls}" style="
            background:${active ? '#fff' : '#f1f5f9'}; color:${active ? '#0a3144' : '#2c3e50'};
            border:1px solid ${active ? '#dee2e6' : 'transparent'}; border-bottom:${active ? '2px solid #2a7faa' : 'none'};
            padding:0.4rem 1rem; border-radius:0.5rem 0.5rem 0 0; cursor:pointer; font-weight:600; font-size:0.9rem;">
            ${getClassName(cls)}</button>`;
    });
    html += '</div><div id="building-class-content"></div>';
    panel.innerHTML = html;

    switchBuildingClass(currentBuildingClass);

    panel.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cls = btn.dataset.class;
            panel.querySelectorAll('.sub-tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = '#f1f5f9';
                b.style.color = '#2c3e50';
                b.style.border = '1px solid transparent';
                b.style.borderBottom = 'none';
            });
            btn.classList.add('active');
            btn.style.background = '#fff';
            btn.style.color = '#0a3144';
            btn.style.border = '1px solid #dee2e6';
            btn.style.borderBottom = '2px solid #2a7faa';
            switchBuildingClass(cls);
        });
    });
}

window.renderBuildingPanel = renderBuildingPanel;