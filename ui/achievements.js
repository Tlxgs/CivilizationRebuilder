// ui/achievements.js — 成就面板组件
(function () {
    const AchievementsPanel = {
        template: `
<div>
    <div style="margin-bottom: 1rem; font-weight: bold; color: var(--accent);">
        🏆 已完成 {{ completedCount }}/{{ totalCount }}
    </div>
    <p v-if="unlockedEntries.length === 0" style="color: var(--text-secondary);">暂无解锁的成就。</p>
    <div v-else style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <div v-for="[id, ach] in unlockedEntries" :key="id" class="achievement-card" :data-ach-id="id"
             style="background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 0.8rem; padding: 0.8rem; min-width: 200px; color: var(--text); box-shadow: 0 2px 6px var(--shadow); cursor: default;"
             v-tooltip="() => achievementTooltip(id)">
            <div style="font-weight: bold; font-size: 1rem; color: var(--accent);">🏆 {{ ach.name }}</div>
            <div style="font-size: 0.85rem; margin: 6px 0; color: var(--text-secondary);">{{ ach.effectText || '' }}</div>
        </div>
    </div>
</div>
`,
        computed: {
            totalCount() {
                return ACHIEVEMENTS_CONFIG ? ACHIEVEMENTS_CONFIG.length : 0;
            },
            completedCount() {
                if (!ACHIEVEMENTS_CONFIG) return 0;
                let count = 0;
                for (let achCfg of ACHIEVEMENTS_CONFIG) {
                    if (this.GS.achievements[achCfg.id]) count++;
                }
                return count;
            },
            unlockedEntries() {
                return Object.entries(this.GS.achievements || {});
            },
        },
        methods: {
            achievementTooltip(id) {
                const cfg = ACHIEVEMENTS_CONFIG ? ACHIEVEMENTS_CONFIG.find(a => a.id === id) : null;
                if (!cfg) return '';
                return `<strong>${cfg.name}</strong><br>${cfg.desc}`;
            },
        },
    };
    UI.registerComponent('AchievementsPanel', AchievementsPanel);
})();
