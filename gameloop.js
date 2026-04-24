// gameloop.js - 统一游戏循环
const GameLoop = (function() {
    const TICK_INTERVAL = 0.2;
    const TICKS_PER_DAY = 5;
    const EVENT_TRIGGER_BASE_CHANCE = 0.01;

    let lastTimestamp = 0;
    let dayTickAccumulator = 0;
    let animationFrame = null;

    // 热度衰减
    function updateHeatDecay(deltaSec) {
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.hasOwnProperty('heat') && res.heat !== undefined) {
                res.heat = Formulas.calcHeatDecay(res.heat, deltaSec);
                res.heat = Math.min(100, Math.max(0.01, res.heat));
            }
        }
    }

    // 每个资源 tick（已无强制关闭建筑）
    function tickResources(deltaSec) {
        ProductionEngine.computeProductionAndCaps();

        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            const prod = res.production;
            let newAmount = res.amount + prod * deltaSec;
            res.amount = Math.min(res.cap, Math.max(0, newAmount));
            if (res.amount > 0.001) res.visible = true;
        }

        updateHeatDecay(deltaSec);
    }

    // 推进天数
    function advanceDay() {
        GameState.gameDays++;
        const year = Math.floor(GameState.gameDays / 360);
        const day = (GameState.gameDays % 360) + 1;
        document.getElementById('current-date').innerText = `${year}年${day}日`;

        const dayOfYear = GameState.gameDays % 360;
        let seasonText = '';
        if (dayOfYear < 90) seasonText = '春';
        else if (dayOfYear < 180) seasonText = '夏';
        else if (dayOfYear < 270) seasonText = '秋';
        else seasonText = '冬';
        document.getElementById('current-season').innerText = `(${seasonText})`;

        // 事件过期检查
        if (GameState.activeRandomEvents && GameState.activeRandomEvents.length > 0) {
            const before = GameState.activeRandomEvents.length;
            GameState.activeRandomEvents = GameState.activeRandomEvents.filter(e => {
                if (GameState.gameDays >= e.endDay) {
                    addEventLog(`[事件结束] ${e.name} 效果已消失`);
                    return false;
                }
                return true;
            });
            if (before !== GameState.activeRandomEvents.length) {
                ProductionEngine.computeProductionAndCaps();
                renderAll();
            }
        }

        tryTriggerRandomEvent();
        renderLogPanel();
    }

    function tryTriggerRandomEvent() {
        if (Math.random() > EVENT_TRIGGER_BASE_CHANCE) return false;
        const eventDef = selectRandomEvent(GameState);
        if (!eventDef) return false;

        const event = EventEffectHandler.createEventSnapshot(eventDef, GameState);
        if (!GameState.activeRandomEvents) GameState.activeRandomEvents = [];
        GameState.activeRandomEvents.push(event);

        const immediateLogs = EventEffectHandler.applyImmediateEffects(event, GameState);
        let effectDesc = '';
        for (let eff of event.effects) {
            if (eff.type === 'resourceMultiplier') {
                const p = ((eff.multiplier - 1) * 100).toFixed(0);
                effectDesc += `${eff.resource} ${eff.multiplier > 1 ? '+' : ''}${p}% `;
            } else if (eff.type === 'buildingMultiplier') {
                const p = ((eff.multiplier - 1) * 100).toFixed(0);
                effectDesc += `${eff.building} ${eff.field === 'prod' ? '产量' : eff.field} ${eff.multiplier > 1 ? '+' : ''}${p}% `;
            } else if (eff.type === 'happinessMod') {
                effectDesc += `幸福度 ${eff.value > 0 ? '+' : ''}${eff.value}% `;
            }
        }
        const duration = event.endDay - GameState.gameDays;
        addEventLog(`随机事件触发：${event.name}！${event.desc}${effectDesc ? ' ('.concat(effectDesc.trim(), ')') : ''}，持续${duration}天`);

        for (let log of immediateLogs) addEventLog(log);

        ProductionEngine.computeProductionAndCaps();
        renderAll();
        return true;
    }

    function loop(now) {
        animationFrame = requestAnimationFrame(loop);
        if (!lastTimestamp) { lastTimestamp = now; return; }

        let deltaSec = Math.min(1.0, (now - lastTimestamp) / 1000);
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
            if (typeof refreshAllDynamicColors === 'function') refreshAllDynamicColors();
        }
    }

    function start() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastTimestamp = 0;
        dayTickAccumulator = 0;
        animationFrame = requestAnimationFrame(loop);
    }

    function stop() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function resetTimer() {
        lastTimestamp = 0;
        dayTickAccumulator = 0;
    }

    return { start, stop, resetTimer, tickResources, advanceDay };
})();

window.GameLoop = GameLoop;