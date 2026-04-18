// ui/buildingDetail.js

/**
 * 获取建筑详细加成数据
 * @param {string} buildingId
 * @returns {Object} 包含基础信息、当前倍率、各加成来源明细
 */
function getBuildingDetailData(buildingId) {
    const state = GameState;
    const building = state.buildings[buildingId];
    const cfg = BUILDINGS_CONFIG[buildingId];
    if (!building || !cfg) return null;

    const modData = ModifierSystem.collectModifiers(state);
    const happinessFactor = state.happiness / 100;
    const eventMultipliers = state.activeRandomEvent?.effects || {};

    // 基础信息
    const baseInfo = {
        name: buildingId,
        desc: cfg.desc,
        count: building.count,
        active: building.active,
        type: cfg.type
    };

    // 当前倍率
    const prodMult = ModifierSystem.calcProdMultiplier(modData, buildingId, cfg.type);
    const consMult = ModifierSystem.calcConsMultiplier(modData, buildingId);

    // 分解加成来源
    const modifiers = modData.list;

    // 产量加成来源
    const prodSources = {
        tech: sumModifiers(modifiers, 'tech', buildingId, 'prod'),
        upgrade: sumModifiers(modifiers, 'upgrade', buildingId, 'prod'),
        policy: sumModifiers(modifiers, 'policy', buildingId, 'prod'),
        building: sumModifiers(modifiers, 'building', buildingId, 'prod'),
        crystal: sumModifiers(modifiers, 'crystal', buildingId, 'prod'),
        globalProd: modData.globalProdAdd,
        globalSpeed: modData.globalSpeedAdd,   // ← 新增    
        space: (cfg.type === '太空' ? modData.spaceProdAdd : 0)
    };

    // 消耗加成来源
    const consSources = {
        tech: sumModifiers(modifiers, 'tech', buildingId, 'cons'),
        upgrade: sumModifiers(modifiers, 'upgrade', buildingId, 'cons'),
        policy: sumModifiers(modifiers, 'policy', buildingId, 'cons'),
        building: sumModifiers(modifiers, 'building', buildingId, 'cons'),
        crystal: sumModifiers(modifiers, 'crystal', buildingId, 'cons'),
        global: modData.globalSpeedAdd
    };

    // 上限加成来源（针对每种资源单独计算较复杂，这里展示建筑整体的上限倍率组成）
    const capSources = {
        tech: sumModifiers(modifiers, 'tech', buildingId, 'cap'),
        upgrade: sumModifiers(modifiers, 'upgrade', buildingId, 'cap'),
        policy: sumModifiers(modifiers, 'policy', buildingId, 'cap'),
        building: sumModifiers(modifiers, 'building', buildingId, 'cap'),
        crystal: sumModifiers(modifiers, 'crystal', buildingId, 'cap'),
        relic: modData.relic
    };

    // 单建筑产出/消耗/上限数值（按当前激活数平均）
    const perActive = building.active > 0 ? 1 / building.active : 1;
    const effects = {};
    if (typeof cfg.calc === 'function') {
        const virtual = { ...building, active: 1 };
        effects.raw = cfg.calc(state, buildingId, virtual, cfg, modData, happinessFactor, eventMultipliers);
    } else {
        effects.raw = ProductionEngine.defaultCalc(state, buildingId, { ...building, active: 1 }, cfg, modData, happinessFactor, eventMultipliers);
    }

    return {
        baseInfo,
        multipliers: { prod: prodMult, cons: consMult },
        sources: { prod: prodSources, cons: consSources, cap: capSources },
        perActiveEffects: effects.raw,
        activeCount: building.active,
        totalEffects: {
            production: multiplyEffects(effects.raw.production, building.active),
            consumption: multiplyEffects(effects.raw.consumption, building.active),
            cap: multiplyEffects(effects.raw.cap, building.active)
        }
    };
}

// 辅助：汇总特定来源的加成值
function sumModifiers(modifiers, source, buildingId, field) {
    return modifiers
        .filter(m => m.source === source && (m.target === buildingId || m.target === 'global'))
        .reduce((sum, m) => sum + (m[field] || 0), 0);
}

function multiplyEffects(effects, mult) {
    const result = {};
    for (let r in effects) result[r] = effects[r] * mult;
    return result;
}

/**
 * 显示建筑详情面板
 */
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

    // 当前产量/消耗
    html += `<div class="detail-section"><h4>单建筑数值（每秒）</h4>`;
    for (let r in data.perActiveEffects.production) {
        const val = data.perActiveEffects.production[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 产量</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    for (let r in data.perActiveEffects.consumption) {
        const val = data.perActiveEffects.consumption[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 消耗</span><span class="value">-${formatNumber(val)}</span></div>`;
    }
    for (let r in data.perActiveEffects.cap) {
        const val = data.perActiveEffects.cap[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 上限</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    html += `</div>`;

    // 总效果（所有激活建筑）
    html += `<div class="detail-section"><h4>总效果（${data.activeCount} 座）</h4>`;
    for (let r in data.totalEffects.production) {
        const val = data.totalEffects.production[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 产量</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    for (let r in data.totalEffects.consumption) {
        const val = data.totalEffects.consumption[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 消耗</span><span class="value">-${formatNumber(val)}</span></div>`;
    }
    for (let r in data.totalEffects.cap) {
        const val = data.totalEffects.cap[r];
        if (val !== 0) html += `<div class="detail-row"><span class="label">${r} 上限</span><span class="value">+${formatNumber(val)}</span></div>`;
    }
    html += `</div>`;

    // 产量倍率分解
    html += `<div class="detail-section"><h4>产量倍率组成</h4>`;
    html += `<div class="detail-row"><span class="label">基础</span><span class="value">1.00</span></div>`;

    for (let src in data.sources.prod) {
        const val = data.sources.prod[src];
        if (val !== 0) {
            const label = { 
                tech: '科技', 
                upgrade: '升级', 
                policy: '政策', 
                building: '建筑间加成', 
                crystal: '晶体', 
                globalProd: '永恒产量', 
                globalSpeed: '永恒速度',   // ← 新增
                space: '太空加成' 
            }[src] || src;
            html += `<div class="detail-row"><span class="label">${label}</span><span class="value">${val > 0 ? '+' : ''}${(val * 100).toFixed(1)}%</span></div>`;
        }
    }
    html += `<div class="detail-row"><span class="label"><strong>总倍率</strong></span><span class="value"><strong>${data.multipliers.prod.toFixed(3)}x</strong></span></div>`;
    html += `</div>`;

    html += `<div class="detail-section"><h4>消耗倍率组成</h4>`;
    html += `<div class="detail-row"><span class="label">基础</span><span class="value">1.00</span></div>`;
    for (let src in data.sources.cons) {
        const val = data.sources.cons[src];
        if (val !== 0) {
            const label = { tech: '科技', upgrade: '升级', policy: '政策', building: '建筑', crystal: '晶体', global: '永恒速度' }[src] || src;
            html += `<div class="detail-row"><span class="label">${label}</span><span class="value">${val > 0 ? '+' : ''}${(val * 100).toFixed(1)}%</span></div>`;
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

// 绑定事件（由 bindEvents 调用）
function bindBuildingDetailEvents() {
    // 关闭按钮
    document.getElementById('close-detail-panel')?.addEventListener('click', hideBuildingDetail);
    // 点击遮罩（可自行扩展）
}

window.showBuildingDetail = showBuildingDetail;
window.hideBuildingDetail = hideBuildingDetail;
window.getBuildingDetailData = getBuildingDetailData;