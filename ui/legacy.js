// ui/legacy.js - 辅助函数（包含 getMultiplier 等）
let currentTooltip = null;

// ========== 快捷键修饰键状态 ==========
window.shiftPressed = false;
window.ctrlPressed = false;

window.addEventListener('keydown', e => {
    if (e.key === 'Shift') window.shiftPressed = true;
    if (e.key === 'Control') window.ctrlPressed = true;
});
window.addEventListener('keyup', e => {
    if (e.key === 'Shift') window.shiftPressed = false;
    if (e.key === 'Control') window.ctrlPressed = false;
});
window.addEventListener('blur', () => {
    window.shiftPressed = false;
    window.ctrlPressed = false;
});
window.formatNumber = function(n) {
    if (n === undefined || n === null || isNaN(n)) return "0";
    if (n === Infinity) return "∞";
    if (n === -Infinity) return "-∞";
    const absN = Math.abs(n);
    if (absN < 1e3) return n.toFixed(2);
    if (absN < 1e6) return (n / 1e3).toFixed(2) + "K";
    if (absN < 1e9) return (n / 1e6).toFixed(2) + "M";
    if (absN < 1e12) return (n / 1e9).toFixed(2) + "G";
    return (n / 1e12).toFixed(2) + "T";
};
// ========== 获取购买/加减倍数 ==========
window.getMultiplier = function() {
    if (window.shiftPressed && window.ctrlPressed) return 1000;
    if (window.ctrlPressed) return 100;
    if (window.shiftPressed) return 10;
    return 1;
};
// ==================== 行动面板配置 ====================
window.actionMetaList = [
    {
        id: 'toggle_speed',
        text: () => GameState.speed === 2 ? '恢复1倍速' : '开启2倍速',
        tooltip: () => GameState.speed === 2
            ? '恢复1倍速游戏'
            : `消耗时间晶体开启2倍速\n当前时间晶体: ${window.formatNumber(GameState.resources['时间晶体']?.amount || 0)}`,
        condition: () => GameState.speed === 2 || (GameState.resources['时间晶体']?.amount || 0) >= 0.1
    },
    { id: 'collect_wood', text: '收集木头', tooltip: '立即获得 +1 木头' },
    { id: 'collect_stone', text: '收集石头', tooltip: '立即获得 +1 石头' },
    { 
        id: 'war', 
        text: '发动战争', 
        tooltip: '消耗所有军备，随机获得晶体。消耗的军备越多，越容易获得高品质晶体', 
        condition: () => GameState.techs["军事理论"]?.researched 
    },
    { 
        id: 'nuke_reset', 
        text: '发射核弹', 
        tooltip: '重置并获遗物', 
        condition: () => GameState.techs["曼哈顿计划"]?.researched 
    },
    { 
        id: 'vacuum_decay', 
        text: '真空衰变', 
        tooltip: '重置获更多遗物与暗能量', 
        condition: () => GameState.techs["真空衰变"]?.researched 
    },
    { 
        id: 'symbiote_reset', 
        text: '共生重置', 
        tooltip: '与外星微生物共生，获得大量遗物和孢子', 
        condition: () => GameState.techs["生物移植"]?.researched 
    },
    { 
        id: 'singularity_reset', 
        text: '奇点重置', 
        tooltip: '巨大的能量撕裂了时空，重置获取遗物、暗物质和奇点', 
        condition: () => GameState.techs["奇点转换"]?.researched 
    },
    { 
        id: 'conscious_reset', 
        text: '意识上传', 
        tooltip: '将全人类的意识上传到高维计算机中。', 
        condition: () => GameState.techs["意识上传"]?.researched 
    }
];
// ========== Tooltip 函数 ==========
window.showTooltip = function(el, text) {
    if (currentTooltip) currentTooltip.remove();
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = text;
    document.body.appendChild(tip);
    const rect = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let top = rect.bottom + 5;
    let left = rect.left;
    if (top + tipRect.height > window.innerHeight) {
        top = rect.top - tipRect.height - 5;
        if (top < 0) top = 5;
    }
    if (left + tipRect.width > window.innerWidth) left = window.innerWidth - tipRect.width - 5;
    if (left < 0) left = 5;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    currentTooltip = tip;
    el.addEventListener('mouseleave', () => { tip.remove(); currentTooltip = null; }, { once: true });
};

// ========== 资源贡献提示内容 ==========
window.getResourceTooltipHtml = function(resourceName) {
    const contributions = ProductionEngine.getResourceContributions(resourceName);
    let html = `<strong>${resourceName}</strong><hr>`;
    for (const c of contributions) {
        const sign = c.value > 0 ? '+' : '';
        html += `${c.building}: ${sign}${formatNumber(c.value)}/s<br>`;
    }

    const res = GameState.resources[resourceName];
    if (typeof(res.getDescription)=='function'){
        let desc = res.getDescription(GameState);
        html +=`${desc}<br>`
    }
    if (res && Math.abs(res.production) > 1e-9) {
        if (res.production > 0 && res.cap !== Infinity) {
            const sec = (res.cap - res.amount) / res.production;
            if (isFinite(sec) && sec > 0) html += `<hr>预计充满: ${formatTime(sec)}`;
        } else if (res.production < 0 && res.amount > 0) {
            const sec = res.amount / Math.abs(res.production);
            if (isFinite(sec)) html += `<hr>预计耗尽: ${formatTime(sec)}`;
        }
    }
    return html;
};

window.getHappinessTooltipHtml = function(state) {
    const breakdown = EffectsManager.getHappinessBreakdown();
    let html = '<strong>幸福度组成</strong><br>基础: 100%<br>';
    for (const c of breakdown) {
        const sign = c.value > 0 ? '+' : '';
        html += `${c.sourceName}: ${sign}${c.value.toFixed(2)}%<br>`;
    }
    html += `<br>总计: ${state.happiness.toFixed(1)}%`;
    const softCap = Formulas.calcHappinessSoftCapBase(state);
    html += ` (软上限: ${softCap.toFixed(1)}%)`;
    return html;
};

window.getBuildingTooltip=function(buildingKey) {
    const bd = GameState.buildings[buildingKey];
    const cfg = BUILDINGS_CONFIG[buildingKey];
    let desc = cfg.desc;
    if (typeof(cfg.desc)=='function') desc = cfg.desc(GameState);
    if (!bd || !cfg) return '';

    const priceStr = Object.entries(bd.price).map(([r, amt]) => {
        const amount = GameState.resources[r]?.amount || 0;
        const hasEnough = amount >= amt;
        const color = hasEnough ? '' : 'red';
        let text = `${r} ${formatNumber(amt)}`;
        if (hasEnough && amt > 0 && amount > 0) {
            const percent = ((amt / amount) * 100).toFixed(1);
            // 如果小数部分为 .0 则只取整数部分，保持美观
            const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
            text += ` (${cleanPercent}%)`;
        }
        return `<span style="color: ${color};">${text}</span>`;
    }).join('<br>');
    let html = `${desc}`;
    html += `<hr>${priceStr}<br><hr>`;

    const stats = ProductionEngine.getBuildingStats(buildingKey);
    if (stats) {
        for (let lrKey in stats.providesLocal) {
            const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
            if (lrCfg && stats.providesLocal[lrKey] !== 0) {
                html += `提供${lrCfg.name}: +${formatLocalNumber(stats.providesLocal[lrKey])}<br>`;
            }
        }
        for (let lrKey in stats.requiresLocal) {
            const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
            if (lrCfg && stats.requiresLocal[lrKey] !== 0) {
                html += `需求${lrCfg.name}: ${formatLocalNumber(stats.requiresLocal[lrKey])}<br>`;
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
        for (let mod of cfg.modifiers) {
            if (mod.prodFactor) html += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
            if (mod.consFactor) html += `${mod.target} 消耗 ${mod.consFactor > 0 ? '+' : ''}${(mod.consFactor * 100).toFixed(0)}%<br>`;
            if (mod.capFactor) html += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
        }
    }
    const status = getAffordabilityStatus(bd.price);
    if (status === 'insufficient') {
        const timeText = ResourcesManager.getAffordabilityTimeText(bd.price);
        if (timeText) html += `<br><span>${timeText}</span>`;
    }
    return html;
}


// ========== 离线时间处理 ==========
window.processOfflineTime = function() {
    const lastTime = GameState.lastSaveTime;
    if (!lastTime) return;
    const now = Date.now();
    const elapsed = Math.floor((now - lastTime) / 1000);
    if (elapsed <= 1) return;
    const maxOffline = 36000;
    const crystalGain = 0.5 * Math.min(elapsed, maxOffline);
    ResourcesManager.add({ "时间晶体": crystalGain });
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    let timeStr = `${hours}时${minutes}分${seconds}秒`;
    GameState.lastSaveTime = now;
    addEventLog(`离线 ${timeStr}，获得 ${crystalGain} 时间晶体。`);
};

// ========== 作弊码 ==========
const IS_LOCAL = location.protocol === 'file:';
const CHEAT_SEQUENCE = ['t'];
let sequenceIndex = 0;
window.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && !GameState.achievements["不道德的巅峰"]) {
        GameState.achievements["不道德的巅峰"] = { name: "不道德的巅峰", effect: {}, effectText: "你在做什么？" };
        addEventLog("✨ 解锁成就「不道德的巅峰」！");
        ProductionEngine.refreshEffects();
        return;
    }
    if (!IS_LOCAL) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (key === CHEAT_SEQUENCE[sequenceIndex]) {
        sequenceIndex++;
        if (sequenceIndex === CHEAT_SEQUENCE.length) {
            const crystal = GameState.resources['时间晶体'];
            const relic = GameState.resources['遗物'];
            const dark = GameState.resources['暗能量'];
            if (relic) { relic.amount += 100; relic.visible = true; }
            if (dark) { dark.amount += 100; dark.visible = true; }
            if (crystal) { crystal.amount = 10; crystal.visible = true; }
            for (let r in GameState.resources) {
                if (['遗物','暗能量','时间晶体','孢子','奇点'].includes(r)) continue;
                const res = GameState.resources[r];
                if (res.cap > 0) { res.amount = res.cap; res.visible = true; }
            }
            ProductionEngine.computeProductionAndCaps();
            addEventLog('神秘的暗号生效了……资源增加了');
            sequenceIndex = 0;
        }
    } else {
        sequenceIndex = 0;
    }
});

// 兼容旧调用
window.refreshUI = function() {};
window.renderAll = function() {
    ProductionEngine.computeProductionAndCaps();
};