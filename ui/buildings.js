
// ui/buildings.js
function getBuildingTooltip(buildingKey) {
    const bd = GameState.buildings[buildingKey];
    const cfg = BUILDINGS_CONFIG[buildingKey];
    if (!bd || !cfg) return '';

    // 价格显示（缺少资源变红）
    const priceStr = Object.entries(bd.price).map(([r, amt]) => {
        const hasEnough = (GameState.resources[r]?.amount || 0) >= amt;
        const color = hasEnough ? '' : 'red';
        return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
    }).join(', ');

    let html = `<strong>${buildingKey}</strong><br>${cfg.desc}<br>`;
    html += `数量: ${bd.count} | 激活: ${bd.active}<br>`;
    html += `价格: ${priceStr}<br><br>`;

    // 当前效果（每座）
    const stats = ProductionEngine.getBuildingStats(buildingKey);
    html += `<strong>当前效果 (每座):<br></strong>`;
    if (cfg.populationProvided !== undefined && cfg.populationProvided !== 0) {
    html += `提供人口: +${cfg.populationProvided}<br>`;
    }
    if (cfg.populationRequired !== undefined && cfg.populationRequired !== 0) {
        html += `占用人口: ${cfg.populationRequired}<br>`;
    }
    if (cfg.populationRequired == undefined){
        html += `占用人口: ${1}<br>`;
    }
    if (stats) {
        
        
        for (let det of stats.details) {
            if (det.type === 'prod') {
                html += `${det.resource}: +${formatNumber(det.perBuilding)}/秒<br>`;
            } else if (det.type === 'cons') {
                html += `${det.resource}: -${formatNumber(det.perBuilding)}/秒<br>`;
            } else if (det.type === 'cap') {
                html += `${det.resource}上限: +${formatNumber(det.perBuilding)}<br>`;
            }
        }
        if (stats.happinessPerBuilding !== 0) {
            const sign = stats.happinessPerBuilding > 0 ? '+' : '';
            html += `幸福度: ${sign}${stats.happinessPerBuilding.toFixed(2)}%<br>`;
        }
    } else {
        html += `<em>暂无详细数据</em><br>`;
    }

    // 提供给其他建筑的加成
    if (cfg.modifiers && cfg.modifiers.length) {
        html += `<br><strong>提供给其他建筑的加成:</strong><br>`;
        for (let mod of cfg.modifiers) {
            if (mod.prodFactor) {
                html += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
            }
            if (mod.consFactor) {
                const sign = mod.consFactor > 0 ? '+' : '';
                html += `${mod.target} 消耗 ${sign}${(mod.consFactor * 100).toFixed(0)}%<br>`;
            }
            if (mod.capFactor) {
                html += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
            }
        }
    }

    return html;
}
function getAffordabilityStatus(building) {
    const price = building.price;
    let hasUnlimitedCapIssue = false;
    let canAffordNow = true;
    for (let res in price) {
        const amount = GameState.resources[res]?.amount || 0;
        const cap = GameState.resources[res]?.cap || 0;
        const needed = price[res];
        if (amount < needed) {
            canAffordNow = false;
            // 上限不足（且上限不是无限）
            if (cap !== Infinity && cap < needed) {
                hasUnlimitedCapIssue = true;
            }
        }
    }
    if (canAffordNow) return 'affordable'; // 黑色
    if (hasUnlimitedCapIssue) return 'cap-exceeded'; // 红色
    return 'insufficient'; // 灰色
}

function renderBuildingPanel() {
    const panel = document.getElementById('panel-building');
    
    const categories = [
        { key: "住房", label: "住房建筑" },
        { key: "生产", label: "生产建筑" },
        { key: "工厂", label: "工厂建筑" },
        { key: "电力", label: "电力建筑" },
        { key: "科学", label: "科学建筑" },
        { key: "存储", label: "存储建筑" },
        { key: "太空", label: "太空建筑" },
        { key: "军事", label: "军事建筑" },
        { key: "其他", label: "其他建筑" }
    ];
    
    let categorizedBuildings = {};
    for (let cat of categories) {
        categorizedBuildings[cat.key] = [];
    }
    
    for (let b in GameState.buildings) {
        const bd = GameState.buildings[b];
        if (!bd.visible) continue;
        const cfg = BUILDINGS_CONFIG[b];
        const type = cfg ? cfg.type : "其他";
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
            const cfg = BUILDINGS_CONFIG[b];
            
            const status = getAffordabilityStatus(bd);
            let nameColorClass = '';
            if (status === 'insufficient') nameColorClass = 'insufficient-name'; // 灰色
            else if (status === 'cap-exceeded') nameColorClass = 'unaffordable-name'; // 红色
            
            html += `<div class="building-card" data-building="${b}">`;
            
            if (cfg.modes && cfg.modes.length > 1) {
                const currentMode = cfg.modes[bd.mode || 0];
                const modeName = currentMode ? currentMode.name : "未知";
                html += `<button class="mode-gear-btn" data-building="${b}" title="当前模式：${modeName}。点击切换模式">⚙️</button>`;
            }
            
            html += `<div class="building-card-info">
                        <strong class="${nameColorClass}">${b}</strong>
                        <small>${bd.active}/${bd.count}</small>`;
            
            if (cfg.modes && cfg.modes.length > 1) {
                const currentMode = cfg.modes[bd.mode || 0];
                const modeName = currentMode ? currentMode.name : "未知";
                html += `<span class="mode-indicator"> | ${modeName}</span>`;
            }
            
            html += `</div>
                     <div class="btn-group">
                         <button class="btn-square plus-btn" data-building="${b}">+</button>
                         <button class="btn-square minus-btn" data-building="${b}">-</button>
                     </div>
                  </div>`;
        }
        
        html += `</div></div>`;
    }
    
    if (html === '') {
        html = '<p>请先研究科技以解锁建筑</p>';
    }
    
    panel.innerHTML = html;
    
    document.querySelectorAll('.building-card').forEach(card => {
        const bName = card.dataset.building;
        card.addEventListener('mouseenter', () => {
            showTooltip(card, getBuildingTooltip(bName));
        });
    });
    
}