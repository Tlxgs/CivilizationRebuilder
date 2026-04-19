// gameloop.js - 统一游戏循环
const GameLoop = (function() {
    const TICK_INTERVAL = 0.2;      // 每次 tick 的秒数
    const TICKS_PER_DAY = 5;         // 每 5 tick = 1 天
    const EVENT_TRIGGER_BASE_CHANCE = 0.01;  // 每天尝试触发的基础概率

    let lastTimestamp = 0;
    let dayTickAccumulator = 0;
    let animationFrame = null;

    // 热度衰减（从 utils 移入）
    function updateHeatDecay(deltaSec) {
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.hasOwnProperty('heat') && res.heat !== undefined) {
                res.heat = Formulas.calcHeatDecay(res.heat, deltaSec);
                res.heat = Math.min(100, Math.max(0.01, res.heat));
            }
        }
    }

    function handleResourceDepletion() {
        let needRecompute = false;
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.amount <= 0.00001 && res.production < -0.00001) {
                for (let bKey in GameState.buildings) {
                    const b = GameState.buildings[bKey];
                    if (b.active === 0) continue;
                    const cfg = BUILDINGS_CONFIG[bKey];
                    if (!cfg) continue;
                    const consumes = typeof cfg.consumes === 'function' 
                        ? cfg.consumes(GameState) 
                        : (cfg.consumes || {});
                    if (consumes[r] > 0) {
                        b.active = 0;
                        needRecompute = true;
                    }
                }
            }
        }
        if (needRecompute) {
            ProductionEngine.computeProductionAndCaps();
            if (typeof renderAll === 'function') renderAll();
        }
    }
    // 单次资源更新 tick
    function tickResources(deltaSec) {
        // 重新计算产量和上限
        ProductionEngine.computeProductionAndCaps();

        // 资源枯竭处理
        handleResourceDepletion();

        // 更新资源数量
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            const prod = res.production;
            let newAmount = res.amount + prod * deltaSec;
            res.amount = Math.min(res.cap, Math.max(0, newAmount));
            if (res.amount > 0.001) res.visible = true;
        }

        // 热度衰减
        updateHeatDecay(deltaSec);
    }

    // 每天推进时的事件结束检查
    function advanceDay() {
        GameState.gameDays++;
        
        const year = Math.floor(GameState.gameDays / 360);
        const day = (GameState.gameDays % 360) + 1;
        const dateElem = document.getElementById('current-date');
        if (dateElem) dateElem.innerText = `${year}年${day}日`;

        const dayOfYear = GameState.gameDays % 360;
        let seasonText = '';
        if (dayOfYear < 90) seasonText = '春';
        else if (dayOfYear < 180) seasonText = '夏';
        else if (dayOfYear < 270) seasonText = '秋';
        else seasonText = '冬';
        const seasonElem = document.getElementById('current-season');
        if (seasonElem) seasonElem.innerText = `(${seasonText})`;

        // 检查所有事件是否结束
        if (GameState.activeRandomEvents && GameState.activeRandomEvents.length > 0) {
            const beforeCount = GameState.activeRandomEvents.length;
            GameState.activeRandomEvents = GameState.activeRandomEvents.filter(event => {
                if (GameState.gameDays >= event.endDay) {
                    addEventLog(`[事件结束] ${event.name} 效果已消失`);
                    return false;
                }
                return true;
            });
            if (beforeCount !== GameState.activeRandomEvents.length) {
                // 有事件结束，重新计算生产
                ProductionEngine.computeProductionAndCaps();
                if (typeof renderAll === 'function') renderAll();
            }
        }

        // 尝试触发新事件（无论是否有激活事件，都可触发）
        tryTriggerRandomEvent();

        if (typeof renderLogPanel === 'function') renderLogPanel();
    }
    function tryTriggerRandomEvent() {
        if (Math.random() > EVENT_TRIGGER_BASE_CHANCE) return false;

        const eventDef = selectRandomEvent(GameState);
        if (!eventDef) return false;

        const event = EventEffectHandler.createEventSnapshot(eventDef, GameState);
        
        if (!GameState.activeRandomEvents) GameState.activeRandomEvents = [];
        GameState.activeRandomEvents.push(event);

        // 先应用立即效果，获取产生的日志
        const immediateLogs = EventEffectHandler.applyImmediateEffects(event, GameState);

        // 生成效果描述
        let effectDesc = '';
        for (let eff of event.effects) {
            if (eff.type === 'resourceMultiplier') {
                const percent = ((eff.multiplier - 1) * 100).toFixed(0);
                effectDesc += `${eff.resource} ${eff.multiplier > 1 ? '+' : ''}${percent}% `;
            } else if (eff.type === 'buildingMultiplier') {
                const percent = ((eff.multiplier - 1) * 100).toFixed(0);
                effectDesc += `${eff.building}${eff.field === 'prod' ? '产量' : eff.field} ${eff.multiplier > 1 ? '+' : ''}${percent}% `;
            } else if (eff.type === 'happinessMod') {
                effectDesc += `幸福度 ${eff.value > 0 ? '+' : ''}${eff.value}% `;
            }
        }
        const duration = event.endDay - GameState.gameDays;
        const mainLog = `随机事件触发：${event.name}！${event.desc}${effectDesc ? ' (' + effectDesc.trim() + ')' : ''}，持续${duration}天`;

        // 先添加事件主日志（后添加的显示在上方）
        addEventLog(mainLog);
        // 然后添加立即效果日志（它们会显示在主日志下方）
        for (let log of immediateLogs) {
            addEventLog(log);
        }

        ModifierSystem.clearCache();
        ProductionEngine.computeProductionAndCaps();
        renderAll();
        return true;
    }

    // 主循环
    function loop(now) {
        animationFrame = requestAnimationFrame(loop);

        if (!lastTimestamp) {
            lastTimestamp = now;
            return;
        }

        let deltaSec = (now - lastTimestamp) / 1000;
        if (deltaSec >= TICK_INTERVAL) {
            const ticks = Math.floor(deltaSec / TICK_INTERVAL);
            for (let i = 0; i < ticks; i++) {
                tickResources(TICK_INTERVAL);
                dayTickAccumulator++;
                if (dayTickAccumulator >= TICKS_PER_DAY) {
                    dayTickAccumulator = 0;
                    advanceDay();
                }
            }
            lastTimestamp = now - ((deltaSec % TICK_INTERVAL) * 1000);
            
            // 更新 UI（资源栏）
            if (typeof renderResources === 'function') renderResources();
        }
    }

    // 启动循环
    function start() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastTimestamp = 0;
        dayTickAccumulator = 0;
        animationFrame = requestAnimationFrame(loop);
    }

    // 停止循环（用于暂停或重置）
    function stop() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    // 重置计时器（加载存档后调用）
    function resetTimer() {
        lastTimestamp = 0;
        dayTickAccumulator = 0;
    }

    return {
        start,
        stop,
        resetTimer,
        // 暴露用于调试
        tickResources,
        advanceDay
    };
})();

window.GameLoop = GameLoop;