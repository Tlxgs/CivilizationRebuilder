// eventEffects.js

const EventEffectHandler = (function() {

    // 解析值（支持函数）
    function resolveValue(value, state) {
        return typeof value === 'function' ? value(state) : value;
    }

    // 将事件定义中的函数属性全部求值，返回一个纯数据的事件副本
    function createEventSnapshot(eventDef, state) {
        const snapshot = {
            id: eventDef.id,
            name: eventDef.name,
            desc: eventDef.desc,
            endDay: state.gameDays + resolveValue(eventDef.durationDays, state),
            effects: []
        };

        if (eventDef.effects) {
            for (let eff of eventDef.effects) {
                const effCopy = { ...eff };
                // 解析可能为函数的字段
                if (eff.type === 'addResource') {
                    effCopy.amount = resolveValue(eff.amount, state);
                } else if (eff.type === 'resourceMultiplier') {
                    effCopy.multiplier = resolveValue(eff.multiplier, state);
                } else if (eff.type === 'buildingMultiplier') {
                    effCopy.multiplier = resolveValue(eff.multiplier, state);
                } else if (eff.type === 'happinessMod') {
                    effCopy.value = resolveValue(eff.value, state);
                }
                snapshot.effects.push(effCopy);
            }
        }
        return snapshot;
    }

    // 应用立即效果
    function applyImmediateEffects(event, state) {
        const logs = [];
        if (!event.effects) return logs;
        
        for (let eff of event.effects) {
            switch (eff.type) {
                case 'addResource':
                    if (state.resources[eff.resource]) {
                        const res = state.resources[eff.resource];
                        res.amount = Math.min(res.cap, res.amount + eff.amount);
                        if (res.amount > 0) res.visible = true;
                        logs.push(`获得 ${formatNumber(eff.amount)} ${eff.resource}`);
                    }
                    break;
                case 'happinessMod':
                    break;
                case 'custom':
                    if (typeof eff.action === 'function') {
                        eff.action(state);
                    }
                    break;
            }
        }
        return logs;
    }

    // 收集事件 modifiers（传入的应是已求值的快照事件数组）
    function collectEventModifiers(activeEvents) {
        const resourceMults = {};
        const buildingMults = {};
        
        for (let ev of activeEvents) {
            if (!ev.effects) continue;
            for (let eff of ev.effects) {
                if (eff.type === 'resourceMultiplier') {
                    resourceMults[eff.resource] = (resourceMults[eff.resource] || 1) * eff.multiplier;
                } else if (eff.type === 'buildingMultiplier') {
                    if (!buildingMults[eff.building]) {
                        buildingMults[eff.building] = { prod: 1, cons: 1, cap: 1 };
                    }
                    const field = eff.field || 'prod';
                    buildingMults[eff.building][field] = (buildingMults[eff.building][field] || 1) * eff.multiplier;
                }
            }
        }
        return { resourceMults, buildingMults };
    }

    // 获取事件幸福度总修正
    function getEventHappinessMod(activeEvents) {
        let total = 0;
        for (let ev of activeEvents) {
            if (!ev.effects) continue;
            for (let eff of ev.effects) {
                if (eff.type === 'happinessMod') {
                    total += eff.value;
                }
            }
        }
        return total;
    }

    return {
        resolveValue,
        createEventSnapshot,
        applyImmediateEffects,
        collectEventModifiers,
        getEventHappinessMod
    };
})();

window.EventEffectHandler = EventEffectHandler;