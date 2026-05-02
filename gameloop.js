// gameloop.js - 基于真实时间戳的循环，页面隐藏/恢复自动追赶
const GameLoop = (function() {
    const DAY_GAME_TIME = 1.0;          // 一天需要的游戏时间（秒）
    const EVENT_TRIGGER_BASE_CHANCE = 0.004;
    const MAX_DELTA_SEC = 3600;          // 单次最大游戏时间增量

    let intervalId = null;
    let crystalIntervalId = null;
    let lastTimestamp = null;            // 上一次 tick 的真实时间戳（毫秒）
    let gameDayAccum = 0;                // 不足一天的累计秒数

    function getSpeed() {
        return GameState.speed === 2 ? 2 : 1;
    }

    function tickResources(deltaGameSec) {
        ProductionEngine.computeProductionAndCaps();

        // 更新资源量（生产/消耗）
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            res.amount += res.production * deltaGameSec;
            if (res.amount < 0) res.amount = 0;
            if (res.amount > res.cap) res.amount = res.cap;
            if (res.amount > 0.001) res.visible = true;
        }

        // 更新贸易热度（持续贸易影响 + 衰减）
        TradeEngine.updateHeat(deltaGameSec, GameState);
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
                renderAll();
            }
        }
        if (GameState.autoWarEnabled) {
            const arms = GameState.resources["军备"];
            if (arms && arms.amount >= arms.cap-0.0001 && arms.cap > 100.001&& GameState.crystals.inventory.length < 3) {
                Core.performAction('war');
            }
        }

        tryTriggerRandomEvent();
        renderLogPanel();   // 只更新日志区域
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

    // 晶体消耗（真实时间每秒，仅二倍速时扣除）
    function startCrystalConsume() {
        if (crystalIntervalId) clearInterval(crystalIntervalId);
        crystalIntervalId = setInterval(() => {
            if (GameState.speed !== 2) return;
            const crystal = GameState.resources["时间晶体"];
            if (!crystal) return;
            if (crystal.amount >= 1) {
                crystal.amount -= 1;
            } else {
                GameState.speed = 1;
                addEventLog("时间晶体耗尽，自动恢复为1倍速。");
                ProductionEngine.computeProductionAndCaps();
                renderAll();
            }
            if (crystal.amount < 0) crystal.amount = 0;
            crystal.visible = crystal.amount > 0;
        }, 1000);
    }

    // 核心 tick：基于真实时间差推进游戏
    function tick() {
        const now = Date.now();
        if (lastTimestamp === null) {
            lastTimestamp = now;
            return;
        }

        let realDeltaSec = (now - lastTimestamp) / 1000;
        if (realDeltaSec <= 0) return;
        if (realDeltaSec > MAX_DELTA_SEC) realDeltaSec = MAX_DELTA_SEC; // 防止跳跃过大

        const speed = getSpeed();
        const gameDelta = realDeltaSec * speed;   // 游戏时间增量（秒）

        tickResources(gameDelta);
        gameDayAccum += gameDelta;
        while (gameDayAccum >= DAY_GAME_TIME) {
            gameDayAccum -= DAY_GAME_TIME;
            advanceDay();
        }

        // 刷新动态颜色
        if (typeof refreshAllDynamicColors === 'function') {
            refreshAllDynamicColors();
        }


        lastTimestamp = now;
    }

    function start() {
        stop();
        lastTimestamp = Date.now();
        gameDayAccum = 0;
        intervalId = setInterval(() => {
            tick();
        }, 200); // 固定 200ms 触发一次，实际步长由时间差决定
        startCrystalConsume();
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (crystalIntervalId) {
            clearInterval(crystalIntervalId);
            crystalIntervalId = null;
        }
        lastTimestamp = null;
    }

    function resetTimer() {
        lastTimestamp = Date.now();
        gameDayAccum = 0;
    }

    return { start, stop, resetTimer };
})();

window.GameLoop = GameLoop;