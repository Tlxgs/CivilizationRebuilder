// ui/queue.js — 购买队列组件
(function () {
    const QueuePanel = {
        template: `
<div id="queue-container" class="queue-container">
    <div v-if="queue.length === 0" style="color: var(--text-dim); padding: 0.5rem;">队列为空</div>
    <template v-else>
        <div style="font-weight: bold; margin-bottom: 0.5rem;">📋 购买队列</div>
        <div v-for="(item, index) in queue" :key="index" class="queue-item">
            <span>{{ itemIcon(item.type) }} {{ item.id }}<span v-if="timeInfo(item) !== ''" v-html="timeInfo(item)"></span></span>
            <button class="queue-remove-btn" :data-index="index" @click="remove(index)">✕</button>
        </div>
    </template>
</div>
`,
        computed: {
            queue() {
                return this.GS.queue || [];
            },
        },
        methods: {
            itemIcon(type) {
                if (type === 'building') return '🏗️';
                if (type === 'tech') return '📚';
                if (type === 'upgrade') return '⬆️';
                return '⭐';
            },
            // 取队列项对应的价格表（不可再购买时为 null）
            costMapOf(item) {
                switch (item.type) {
                    case 'building': {
                        const bld = this.GS.buildings[item.id];
                        return bld ? bld.price : null;
                    }
                    case 'tech': {
                        const tech = this.GS.techs[item.id];
                        return tech && !tech.researched ? tech.price : null;
                    }
                    case 'upgrade': {
                        const up = this.GS.upgrades[item.id];
                        return up && up.visible ? up.price : null;
                    }
                    case 'permanent': {
                        const perm = this.GS.permanent[item.id];
                        return perm && !perm.researched ? perm.price : null;
                    }
                    default:
                        return null;
                }
            },
            // 预计时间/上限不足标记（复刻原版 renderQueue）
            timeInfo(item) {
                const costMap = this.costMapOf(item);
                if (!costMap) return '';

                // 检查是否有资源上限不足
                let capInsufficient = false;
                for (let r in costMap) {
                    const needed = costMap[r];
                    const cap = ResourcesManager.getCap(r);
                    if (needed > cap) {
                        capInsufficient = true;
                        break;
                    }
                }
                if (capInsufficient) {
                    return `<span style="font-size:0.7rem; color:var(--red); margin-left:8px;">⛔</span>`;
                }
                const { maxTime, allPossible } = ResourcesManager.getTimeToAfford(costMap);
                if (allPossible && isFinite(maxTime)) {
                    return `<span style="font-size:0.7rem; color:var(--text-secondary); margin-left:8px;">${formatTime(maxTime)}</span>`;
                } else if (!allPossible) {
                    return `<span style="font-size:0.7rem; color:var(--red); margin-left:8px;"></span>`;
                }
                return '';
            },
            remove(index) {
                removeFromQueue(index);
            },
        },
    };
    UI.registerComponent('QueuePanel', QueuePanel);
})();
