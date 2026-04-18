// ui/buildings.js
function getBuildingTooltip(buildingKey) {
    const bd = GameState.buildings[buildingKey];
    const stats = getBuildingStats(buildingKey);
    const priceStr = Object.entries(bd.price)
        .map(([r, amt]) => `${r} ${formatNumber(amt)}`)
        .join(', ');
    let html = `<strong>${buildingKey}</strong><br>${bd.desc}<br>数量: ${bd.count} | 激活: ${bd.active}<br>价格: ${priceStr}<br><br>`;
    
    if (stats && stats.details) {
        for (let det of stats.details) {
            if (det.type === 'prod') {
                html += `<strong>${det.resource}:</strong> +${formatNumber(det.perBuilding)}/秒<br>`;
            } else if (det.type === 'cons') {
                html += `<strong>${det.resource}:</strong> -${formatNumber(det.perBuilding)}/秒<br>`;
            } else if (det.type === 'cap') {
                html += `<strong>${det.resource}上限:</strong> +${formatNumber(det.perBuilding)}<br>`;
            }
        }
    }
    
    if (bd.modifiers && bd.modifiers.length > 0) {
        html += `<br><strong>提供加成：</strong><br>`;
        for (let mod of bd.modifiers) {
            if (mod.prodFactor) {
                html += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
            }
            if (mod.consFactor) {
                let sign = mod.consFactor > 0 ? '+' : '';
                html += `${mod.target} 消耗 ${sign}${(mod.consFactor * 100).toFixed(0)}%<br>`;
            }
            if (mod.capFactor) {
                html += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
            }
        }
    }
    
    if (buildingKey === "博物馆") {
        const relicAmt = GameState.resources["遗物"]?.amount || 0;
        const bonus = 0.1 * Math.log(Math.pow(2.72, 5) + relicAmt);
        const sign = bonus > 0 ? '+' : '';
        html += `<br><strong>幸福度影响：</strong> ${sign}${bonus.toFixed(2)}% (该影响基于遗物数量)<br>`;
    } else if (bd.happinessEffect !== undefined && bd.happinessEffect !== 0) {
        const sign = bd.happinessEffect > 0 ? '+' : '';
        const effectPercent = bd.happinessEffect.toFixed(1);
        html += `<br><strong>幸福度影响：</strong> ${sign}${effectPercent}%<br>`;
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
        const type = bd.type || "其他";
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