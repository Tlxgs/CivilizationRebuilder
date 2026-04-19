// ui/buildingDetail.js
// 建筑详情面板 - 适配新配置架构（produces/consumes/caps/happiness 可为函数）

/**
 * 获取建筑详细加成数据
 * @param {string} buildingId
 * @returns {Object|null}
 */
function getBuildingDetailData(buildingId) {
    const state = GameState;
    const building = state.buildings[buildingId];
    const cfg = BUILDINGS_CONFIG[buildingId];
    if (!building || !cfg) return null;

    const modData = ModifierSystem.collectModifiers(state);
    const happinessFactor = state.happiness / 100;
    const eventMultipliers = modData.eventMultipliers || {};

    // 基础信息
    const baseInfo = {
        name: buildingId,
        desc: cfg.desc,
        count: building.count,
        active: building.active,
        type: cfg.type
    };

    // 获取单建筑基础值（处理函数型配置）
    const baseProduces = typeof cfg.produces === 'function' ? cfg.produces(state) : (cfg.produces || {});
    const baseConsumes = typeof cfg.consumes === 'function' ? cfg.consumes(state) : (cfg.consumes || {});
    const baseCaps = typeof cfg.caps === 'function' ? cfg.caps(state) : (cfg.caps || {});
    const baseHappiness = typeof cfg.happiness === 'function' ? cfg.happiness(state) : (cfg.happiness || 0);

    // 倍率
    const prodMult = ModifierSystem.calcProdMultiplier(modData, buildingId, cfg.type);
    const consMult = ModifierSystem.calcConsMultiplier(modData, buildingId);

    // 单建筑实际产出/消耗/上限（已应用倍率、幸福度、事件）
    const perActive = {
        production: {},
        consumption: {},
        cap: {},
        happiness: baseHappiness
    };

    for (let r in baseProduces) {
        const eventMul = eventMultipliers[r] || 1;
        perActive.production[r] = baseProduces[r] * prodMult * happinessFactor * eventMul;
    }
    for (let r in baseConsumes) {
        perActive.consumption[r] = baseConsumes[r] * consMult;
    }
    for (let r in baseCaps) {
        const capMult = ModifierSystem.calcCapMultiplier(modData, buildingId, r);
        perActive.cap[r] = baseCaps[r] * capMult;
    }

    // 总效果（所有激活建筑）
    const total = {
        production: {},
        consumption: {},
        cap: {},
        happiness: baseHappiness * building.active
    };
    for (let r in perActive.production) total.production[r] = perActive.production[r] * building.active;
    for (let r in perActive.consumption) total.consumption[r] = perActive.consumption[r] * building.active;
    for (let r in perActive.cap) total.cap[r] = perActive.cap[r] * building.active;

    // 加成来源分解
    const modifiers = modData.list;
    const prodSources = {
        tech: sumModifiers(modifiers, 'tech', buildingId, 'prod'),
        upgrade: sumModifiers(modifiers, 'upgrade', buildingId, 'prod'),
        policy: sumModifiers(modifiers, 'policy', buildingId, 'prod'),
        building: sumModifiers(modifiers, 'building', buildingId, 'prod'),
        crystal: sumModifiers(modifiers, 'crystal', buildingId, 'prod'),
        globalProd: modData.globalProdAdd,
        globalSpeed: modData.globalSpeedAdd,
        space: (cfg.type === '太空' ? modData.spaceProdAdd : 0)
    };
    const consSources = {
        tech: sumModifiers(modifiers, 'tech', buildingId, 'cons'),
        upgrade: sumModifiers(modifiers, 'upgrade', buildingId, 'cons'),
        policy: sumModifiers(modifiers, 'policy', buildingId, 'cons'),
        building: sumModifiers(modifiers, 'building', buildingId, 'cons'),
        crystal: sumModifiers(modifiers, 'crystal', buildingId, 'cons'),
        global: modData.globalSpeedAdd
    };

    return {
        baseInfo,
        multipliers: { prod: prodMult, cons: consMult },
        sources: { prod: prodSources, cons: consSources },
        perActive,
        total,
        activeCount: building.active
    };
}

function sumModifiers(modifiers, source, buildingId, field) {
    return modifiers
        .filter(m => m.source === source && (m.target === buildingId || m.target === 'global'))
        .reduce((sum, m) => sum + (m[field] || 0), 0);
}

function showBuildingDetail(buildingId) {
    const data = getBuildingDetailData(buildingId);
    if (!data) return;

    const panel = document.getElementById('building-detail-panel');
    const nameSpan = document.getElementById('detail-building-name');
    const contentDiv = document.getElementById('detail-content');

    nameSpan.textContent = `${data.baseInfo.name} (${data.baseInfo.active}/${data.baseInfo.count})`;

    let html = `
        <div class="detail-section">
            <p><strong>${data.baseInfo.desc}</strong></p>
            <p>类型：${data.baseInfo.type} | 数量：${data.baseInfo.count} | 激活：${data.baseInfo.active}</p>
        </div>
    `;

    // 单建筑数值
    html += `<div class="detail-section"><h4>单建筑数值（每秒）</h4>`;
    for (let r in data.perActive.production) {
        const val = data.perActive.production[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 产量</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    for (let r in data.perActive.consumption) {
        const val = data.perActive.consumption[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 消耗</span><span class="value">-${formatNumber(val)}</span></div>`;
    }
    for (let r in data.perActive.cap) {
        const val = data.perActive.cap[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 上限</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    if (data.perActive.happiness !== 0) {
        html += `<div class="detail-row"><span class="label">幸福度</span><span class="value">${data.perActive.happiness > 0 ? '+' : ''}${data.perActive.happiness.toFixed(2)}%</span></div>`;
    }
    html += `</div>`;

    // 总效果
    html += `<div class="detail-section"><h4>总效果（${data.activeCount} 座）</h4>`;
    for (let r in data.total.production) {
        const val = data.total.production[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 产量</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    for (let r in data.total.consumption) {
        const val = data.total.consumption[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 消耗</span><span class="value">-${formatNumber(val)}</span></div>`;
    }
    for (let r in data.total.cap) {
        const val = data.total.cap[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 上限</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    if (data.total.happiness !== 0) {
        html += `<div class="detail-row"><span class="label">幸福度</span><span class="value">${data.total.happiness > 0 ? '+' : ''}${data.total.happiness.toFixed(2)}%</span></div>`;
    }
    html += `</div>`;

    // 产量倍率分解
    html += `<div class="detail-section"><h4>产量倍率组成</h4>`;
    html += `<div class="detail-row"><span class="label">基础</span><span class="value">1.00</span></div>`;
    const prodLabelMap = { tech:'科技', upgrade:'升级', policy:'政策', building:'建筑间加成', crystal:'晶体', globalProd:'永恒产量', globalSpeed:'永恒速度', space:'太空加成' };
    for (let src in data.sources.prod) {
        const val = data.sources.prod[src];
        if (val !== 0) {
            html += `<div class="detail-row"><span class="label">${prodLabelMap[src] || src}</span><span class="value">${val > 0 ? '+' : ''}${(val * 100).toFixed(1)}%</span></div>`;
        }
    }
    html += `<div class="detail-row"><span class="label"><strong>总倍率</strong></span><span class="value"><strong>${data.multipliers.prod.toFixed(3)}x</strong></span></div>`;
    html += `</div>`;

    // 消耗倍率分解
    html += `<div class="detail-section"><h4>消耗倍率组成</h4>`;
    html += `<div class="detail-row"><span class="label">基础</span><span class="value">1.00</span></div>`;
    const consLabelMap = { tech:'科技', upgrade:'升级', policy:'政策', building:'建筑间加成', crystal:'晶体', global:'永恒速度' };
    for (let src in data.sources.cons) {
        const val = data.sources.cons[src];
        if (val !== 0) {
            html += `<div class="detail-row"><span class="label">${consLabelMap[src] || src}</span><span class="value">${val > 0 ? '+' : ''}${(val * 100).toFixed(1)}%</span></div>`;
        }
    }
    html += `<div class="detail-row"><span class="label"><strong>总倍率</strong></span><span class="value"><strong>${data.multipliers.cons.toFixed(3)}x</strong></span></div>`;
    html += `</div>`;

    contentDiv.innerHTML = html;
    panel.style.display = 'flex';
}

function hideBuildingDetail() {
    document.getElementById('building-detail-panel').style.display = 'none';
}

function bindBuildingDetailEvents() {
    document.getElementById('close-detail-panel')?.addEventListener('click', hideBuildingDetail);
}

// 导出
window.getBuildingDetailData = getBuildingDetailData;
window.showBuildingDetail = showBuildingDetail;
window.hideBuildingDetail = hideBuildingDetail;
window.bindBuildingDetailEvents = bindBuildingDetailEvents;