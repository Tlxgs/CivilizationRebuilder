// eventEffects.js
const EventEffectHandler = (function() {

    function resolveValue(value, state) {
        return typeof value === 'function' ? value(state) : value;
    }

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

    function applyImmediateEffects(event, state) {
        const logs = [];
        if (!event.effects) return logs;
        
        for (let eff of event.effects) {
            switch (eff.type) {
                case 'addResource':
                    const resID=eff.resource;
                    if (ResourcesManager.add({[resID]: eff.amount}) ){
                        logs.push(`获得 ${formatNumber(eff.amount)} ${resID}`);
                    }
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

    return {
        resolveValue,
        createEventSnapshot,
        applyImmediateEffects
    };
})();

window.EventEffectHandler = EventEffectHandler;