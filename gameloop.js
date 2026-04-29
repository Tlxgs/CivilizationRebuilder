// gameloop.js - 稳定5fps，支持倍速，离线追赶，UI不闪烁
const GameLoop = (function() {
    const BASE_TICK_DT = 0.2;           // 基础游戏时间增量（秒/倍速为1时）
    const DAY_GAME_TIME = 1.0;          // 一天需要的游戏时间（秒）
    const EVENT_TRIGGER_BASE_CHANCE = 0.005;
    const MAX_OFFLINE_TICKS = 3600;      // 最多追赶3600个tick

    let intervalId = null;
    let lastRealTimestamp = null;
    let gameDayAccum = 0;

    function getSpeed() {
        return GameState.speed === 2 ? 2 : 1;
    }

    // 资源更新（接受实际游戏时间增量）
    function tickResources(deltaGameSec) {
        ProductionEngine.computeProductionAndCaps();

        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            res.amount += res.production * deltaGameSec;
            if (res.amount < 0) res.amount = 0;
            if (res.amount > res.cap) res.amount = res.cap;
            if (res.amount > 0.001) res.visible = true;
        }

        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.heat !== undefined) {
                res.heat = Formulas.calcHeatDecay(res.heat, deltaGameSec);
                res.heat = Math.min(100, Math.max(0.01, res.heat));
            }
        }
    }

    function advanceDay() {
        GameState.gameDays++;
        const year = Math.floor(GameState.gameDays / 360);
        const day = (GameState.gameDays % 360) + 1;
        const dateEl = document.getElementById('current-date');
        if (dateEl) dateEl.innerText = `${year}年${day}日`;

        const dayOfYear = GameState.gameDays % 360;
        let season = '春';
        if (dayOfYear >= 90 && dayOfYear < 180) season = '夏';
        else if (dayOfYear >= 180 && dayOfYear < 270) season = '秋';
        else if (dayOfYear >= 270) season = '冬';
        const seasonEl = document.getElementById('current-season');
        if (seasonEl) seasonEl.innerText = `(${season})`;

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
                renderAll(); // 事件结束需刷新生产
            }
        }

        tryTriggerRandomEvent();
        renderLogPanel();   // 只更新日志区域
        // 更新日期显示已在上面完成
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
        renderAll(); // 事件触发会新增效果，需完整刷新
        return true;
    }

    // 晶体消耗（真实时间每秒，仅二倍速时扣除）
    function startCrystalConsume() {
        setInterval(() => {
            if (GameState.speed !== 2) return;
            const crystal = GameState.resources["时间晶体"];
            if (!crystal) return;
            if (crystal.amount >= 1) {
                crystal.amount -= 1;
            } else {
                // 晶体不足，自动降速
                GameState.speed = 1;
                addEventLog("时间晶体耗尽，自动恢复为1倍速。");
                ProductionEngine.computeProductionAndCaps();
                renderAll();
            }
            if (crystal.amount < 0) crystal.amount = 0;
            crystal.visible = crystal.amount > 0;
        }, 1000);
    }

    // 核心 tick：固定间隔执行，根据速度推进游戏时间
    function tick() {
        const speed = getSpeed();
        const gameDelta = BASE_TICK_DT * speed;   // 关键：倍速影响游戏时间增量
        tickResources(gameDelta);
        gameDayAccum += gameDelta;
        while (gameDayAccum >= DAY_GAME_TIME) {
            gameDayAccum -= DAY_GAME_TIME;
            advanceDay();          // 每天触发一次，内部可能调用 renderAll
        }
        // 只刷新动态数字和颜色，不重建整个 UI，避免闪烁
        if (typeof refreshAllDynamicColors === 'function') {
            refreshAllDynamicColors();
        }
    }

    // 离线追赶（页面恢复时调用）
    function catchUpOffline() {
        const now = Date.now();
        if (lastRealTimestamp === null) {
            lastRealTimestamp = now;
            return;
        }
        const elapsedSec = Math.min((now - lastRealTimestamp) / 1000, 3600);
        if (elapsedSec < 1.5) return;

        const speed = getSpeed();
        const realTimePerTick = BASE_TICK_DT / speed; // 注意：离线时速度可能为2
        let missedTicks = Math.floor(elapsedSec / realTimePerTick);
        missedTicks = Math.min(missedTicks, MAX_OFFLINE_TICKS);
        if (missedTicks <= 0) return;

        // 模拟追赶（不刷新 UI）
        for (let i = 0; i < missedTicks; i++) {
            const gameDelta = BASE_TICK_DT * speed;
            tickResources(gameDelta);
            gameDayAccum += gameDelta;
            while (gameDayAccum >= DAY_GAME_TIME) {
                gameDayAccum -= DAY_GAME_TIME;
                // 简化版 advanceDay，避免 UI 操作
                GameState.gameDays++;
                if (GameState.activeRandomEvents && GameState.activeRandomEvents.length > 0) {
                    GameState.activeRandomEvents = GameState.activeRandomEvents.filter(e => {
                        if (GameState.gameDays >= e.endDay) {
                            addEventLog(`[事件结束] ${e.name} 效果已消失`);
                            return false;
                        }
                        return true;
                    });
                }
                tryTriggerRandomEvent(); // 概率触发事件
            }
        }
        // 追赶完成后刷新全部 UI 和日志
        ProductionEngine.computeProductionAndCaps();
        renderAll();
        addEventLog(`离线追赶 ${missedTicks} 个游戏tick，游戏时间前进 ${(missedTicks * BASE_TICK_DT * speed).toFixed(1)} 秒。`);
        lastRealTimestamp = now;
    }

    function onVisibilityChange() {
        if (document.hidden) {
            lastRealTimestamp = Date.now();
        } else {
            catchUpOffline();
        }
    }

    function start() {
        stop();
        lastRealTimestamp = Date.now();
        gameDayAccum = 0;
        intervalId = setInterval(() => {
            tick();
            // 更新真实时间戳，用于离线检测
            lastRealTimestamp = Date.now();
        }, BASE_TICK_DT * 1000);  // 固定 200ms 触发一次
        startCrystalConsume();
        document.addEventListener('visibilitychange', onVisibilityChange);
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        document.removeEventListener('visibilitychange', onVisibilityChange);
    }

    function resetTimer() {
        lastRealTimestamp = Date.now();
        gameDayAccum = 0;
    }

    return { start, stop, resetTimer };
})();

window.GameLoop = GameLoop;