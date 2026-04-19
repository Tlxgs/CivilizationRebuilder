
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
    if (stats) {
        html += `<strong>当前效果 (每座):</strong><br>`;
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
function renderBuildingPanel() {
    const panel = document.getElementById('panel-building');
    
    const categories = [
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
        const type = cfg ? cfg.type : "其他";  // 改为从配置获取类型
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
        html = '<p>请先研究科技以解锁建筑</p>';
    }
    
    panel.innerHTML = html;
    
    document.querySelectorAll('.building-card').forEach(card => {
        const bName = card.dataset.building;
        card.addEventListener('mouseenter', () => {
            showTooltip(card, getBuildingTooltip(bName));
        });
    });
        
    updateBuyButtonsColor();
}

function updateBuyButtonsColor() {
    const buyBtns = document.querySelectorAll('.buy-btn');
    for (let btn of buyBtns) {
        const buildingKey = btn.dataset.building;
        if (!buildingKey) continue;
        const building = GameState.buildings[buildingKey];
        if (!building) continue;
        if (canAfford(building.price)) {
            btn.style.color = '';
        } else {
            btn.style.color = 'red';
        }
    }
}
window.getBuildingTooltip = getBuildingTooltip;
window.renderBuildingPanel = renderBuildingPanel;