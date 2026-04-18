// gameloop.js - 统一游戏循环
const GameLoop = (function() {
    const TICK_INTERVAL = 0.2;      // 每次 tick 的秒数
    const TICKS_PER_DAY = 5;         // 每 5 tick = 1 天
    const EVENT_TRIGGER_CHANCE = 0.002; // 每天触发随机事件概率

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

    // 检查资源枯竭并停用消耗建筑
    function handleResourceDepletion() {
        let needRecompute = false;
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.amount <= 0.00001 && res.production < -0.00001) {
                for (let bKey in GameState.buildings) {
                    const b = GameState.buildings[bKey];
                    if (b.active > 0 && b.baseConsume && b.baseConsume[r] > 0) {
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
            if (res.amount > 0.01) res.visible = true;
        }

        // 热度衰减
        updateHeatDecay(deltaSec);
    }

    // 天数推进
    function advanceDay() {
        GameState.gameDays++;
        
        // 更新日期显示
        const year = Math.floor(GameState.gameDays / 365);
        const day = (GameState.gameDays % 365) + 1;
        const dateElem = document.getElementById('current-date');
        if (dateElem) dateElem.innerText = `${year}年${day}日`;

        // 检查随机事件是否结束
        if (GameState.activeRandomEvent && GameState.gameDays >= GameState.activeEventEndDay) {
            endCurrentEvent();
        }

        // 尝试触发新随机事件（如果没有激活事件）
        if (!GameState.activeRandomEvent) {
            tryTriggerRandomEvent();
        }

        // 刷新日志面板
        if (typeof renderLogPanel === 'function') renderLogPanel();
    }

    // 结束当前事件
    function endCurrentEvent() {
        if (!GameState.activeRandomEvent) return;
        const event = GameState.activeRandomEvent;
        addEventLog(`[事件结束] ${event.name} 效果已消失`);
        GameState.activeRandomEvent = null;
        ProductionEngine.computeProductionAndCaps();
        if (typeof renderAll === 'function') renderAll();
    }

    // 尝试触发随机事件
    function tryTriggerRandomEvent() {
        if (Math.random() > EVENT_TRIGGER_CHANCE) return false;

        const eventDef = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        const event = { ...eventDef };
        GameState.activeRandomEvent = event;
        GameState.activeEventEndDay = GameState.gameDays + event.durationDays;

        let effectDesc = Object.entries(event.effects)
            .map(([res, mul]) => {
                const percent = Math.abs((mul - 1) * 100);
                return mul > 1 ? `${res}+${percent.toFixed(0)}%` : `${res}-${percent.toFixed(0)}%`;
            })
            .join(', ');
        addEventLog(`随机事件触发：${event.name}！${event.desc} (${effectDesc})，持续${event.durationDays}天`);

        ProductionEngine.computeProductionAndCaps();
        if (typeof renderAll === 'function') renderAll();
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