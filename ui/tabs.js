// ui/tabs.js — 主选项卡组件
(function () {
    // 选项卡定义（顺序与原版一致）
    const TAB_DEFS = [
        { id: 'building', label: '建筑' },
        { id: 'tech', label: '科技' },
        { id: 'policy', label: '政策' },
        { id: 'trade', label: '贸易' },
        { id: 'crystal', label: '晶体' },
        { id: 'permanent', label: '永恒' },
        { id: 'achievements', label: '成就' },
        { id: 'reset', label: '选项' },
        { id: 'changelog', label: '更新日志' },
    ];

    const TabBar = {
        template: `
<div class="tabs">
    <button v-for="t in visibleTabs" :key="t.id" class="tab-btn"
            :class="{ active: ui.currentTab === t.id }" :data-tab="t.id"
            @click="ui.currentTab = t.id">{{ t.label }}</button>
</div>
`,
        computed: {
            // 按解锁状态计算可见选项卡（复刻原版 updateTabsVisibility 规则）
            visibleTabs() {
                const G = this.GS;

                // 政策：存在任一可见政策
                const hasPolicy = Object.values(G.policies).some(p => p.visible);
                // 贸易：市场建筑可见
                const market = G.buildings["市场"];
                const hasTrade = market && market.visible;
                // 晶体：研究军事理论或拥有晶体
                const hasMilitaryTech = G.techs["军事理论"]?.researched || false;
                const hasCrystals = (G.crystals?.inventory?.length > 0) ||
                    (G.crystals?.equipped?.some(slot => slot !== null) === true);
                const hasCrystalTab = hasMilitaryTech || hasCrystals;
                // 永恒：拥有遗物或已研究任一永恒升级
                const relicAmount = G.resources["遗物"]?.amount || 0;
                const hasResearchedPermanent = Object.values(G.permanent).some(p => p.researched);
                const hasPermanent = (relicAmount > 0) || hasResearchedPermanent;

                return TAB_DEFS.filter(t => {
                    switch (t.id) {
                        case 'policy': return hasPolicy;
                        case 'trade': return hasTrade;
                        case 'crystal': return hasCrystalTab;
                        case 'permanent': return hasPermanent;
                        default: return true; // 建筑/科技/成就/选项/更新日志 始终显示
                    }
                });
            },
        },
        watch: {
            // 如果当前激活的标签被隐藏，自动切换到第一个可见标签
            visibleTabs(ids) {
                if (!ids.some(t => t.id === this.ui.currentTab)) {
                    this.ui.currentTab = (ids[0] && ids[0].id) || 'building';
                }
            },
        },
    };
    UI.registerComponent('TabBar', TabBar);
})();
