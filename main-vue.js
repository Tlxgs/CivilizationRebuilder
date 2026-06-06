// main-vue.js - Vue 应用启动（完整版，支持动态选项卡可见性）
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.body.classList.add('dark-theme');

    document.addEventListener('DOMContentLoaded', () => {
        // 加载存档，处理离线时间
        loadGame();
        processOfflineTime();

        // 创建 Vue 根组件
        const App = {
            components: window.VueComponents,
            template: `
                <div class="game-container">
                    <h2>文明重建者</h2>
                    <happiness-display></happiness-display>
                    <div class="main-layout">
                        <div class="sidebar">
                            <population-info></population-info>
                            <resource-bar></resource-bar>
                            <actions-panel></actions-panel>
                        </div>
                        <div class="main-content">
                            <div class="tabs">
                                <button v-for="tab in visibleTabs" :key="tab.id" @click="activeTab = tab.id"
                                        :class="{ active: activeTab === tab.id }" class="tab-btn">
                                    {{ tab.name }}
                                </button>
                            </div>
                            <component :is="currentTabComponent" class="panel"></component>
                        </div>
                        <div class="log-panel">
                            <queue-panel></queue-panel>
                            <div class="log-header">
                                <span id="current-date">{{ currentDate }}</span>
                                <span id="current-season">{{ currentSeason }}</span>
                            </div>
                            <log-panel></log-panel>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                // ---------- 动态选项卡列表（响应式） ----------
                const visibleTabs = Vue.computed(() => {
                    const tabs = [];

                    // 1. 建筑 - 始终显示
                    const hasBuilding = Object.values(GameState.buildings).some(p => p.visible);
                    if (hasBuilding){
                        tabs.push({ id: 'building', name: '建筑', component: 'BuildingPanel' });
                    }

                    // 2. 科技 - 始终显示
                    tabs.push({ id: 'tech', name: '科技', component: 'TechPanel' });

                    // 3. 政策 - 任一政策可见时显示
                    const hasPolicy = Object.values(GameState.policies).some(p => p.visible);
                    if (hasPolicy) {
                        tabs.push({ id: 'policy', name: '政策', component: 'PolicyPanel' });
                    }

                    // 4. 贸易 - 市场建筑可见时显示
                    if (GameState.buildings["市场"]?.visible) {
                        tabs.push({ id: 'trade', name: '贸易', component: 'TradePanel' });
                    }

                    // 5. 晶体 - 军事理论科技已研究 或 拥有任意晶体
                    const hasMilitaryTech = GameState.techs["军事理论"]?.researched || false;
                    const hasCrystals = (GameState.crystals?.inventory?.length > 0) ||
                                        (GameState.crystals?.equipped?.some(slot => slot !== null) === true);
                    if (hasMilitaryTech || hasCrystals) {
                        tabs.push({ id: 'crystal', name: '晶体', component: 'CrystalPanel' });
                    }

                    // 6. 永恒 - 遗物数量 > 0 或 已研究任意永恒升级
                    const relicAmount = GameState.resources["遗物"]?.amount || 0;
                    const hasResearchedPermanent = Object.values(GameState.permanent).some(p => p.researched);
                    if (relicAmount > 0 || hasResearchedPermanent) {
                        tabs.push({ id: 'permanent', name: '永恒', component: 'PermanentPanel' });
                    }

                    // 7. 成就 - 始终显示
                    tabs.push({ id: 'achievements', name: '成就', component: 'AchievementsPanel' });
                    tabs.push({ id: 'reset', name: '选项', component: 'ResetPanel' });

                    // 8. 更新日志 - 始终显示
                    tabs.push({ id: 'changelog', name: '更新日志', component: 'ChangelogPanel' });

                    return tabs;
                });

                // 当前激活的选项卡ID，默认建筑
                const activeTab = Vue.ref('building');

                // 当前要渲染的组件
                const currentTabComponent = Vue.computed(() => {
                    const tab = visibleTabs.value.find(t => t.id === activeTab.value);
                    return tab ? tab.component : 'BuildingPanel';
                });

                // 监听可见选项卡变化，若当前激活的选项卡被隐藏，则自动切换到第一个可见选项卡
                Vue.watch(
                    [visibleTabs, activeTab],
                    () => {
                        const visibleIds = visibleTabs.value.map(t => t.id);
                        if (!visibleIds.includes(activeTab.value) && visibleIds.length > 0) {
                            activeTab.value = visibleIds[0];
                        }
                    },
                    { immediate: true } // 立即执行一次，保证初始状态正确
                );

                // ---------- 日期与季节显示） ----------
                const currentDate = Vue.computed(() => {
                    const year = Math.floor(GameState.gameDays / 360);
                    const day = (GameState.gameDays % 360) + 1;
                    return `${year}年${day}日`;
                });
                const currentSeason = Vue.computed(() => {
                    const dayOfYear = GameState.gameDays % 360;
                    if (dayOfYear < 90) return '(春)';
                    if (dayOfYear < 180) return '(夏)';
                    if (dayOfYear < 270) return '(秋)';
                    return '(冬)';
                });

                return {
                    visibleTabs,
                    activeTab,
                    currentTabComponent,
                    currentDate,
                    currentSeason
                };
            }
        };

        const app = Vue.createApp(App);
        for (const [name, comp] of Object.entries(window.VueComponents)) {
            app.component(name, comp);
        }
        app.mount('#app');

        // 启动游戏循环
        GameLoop.start();

        // 自动保存（每10秒）
        setInterval(() => saveGame(), 10000);
    });
})();