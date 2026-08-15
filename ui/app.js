// ui/app.js — 根组件：整体布局 + 主面板容器 + 日期/季节/幸福度
(function () {
    const GameApp = {
        template: `
<div class="game-container">
    <h2>文明重建者</h2>
    <div id="happiness-display" v-tooltip="happinessTooltip">😊 幸福度: {{ effectiveHappiness.toFixed(1) }}%</div>
    <div class="main-layout">
        <!-- 左侧边栏：资源 + 行动 -->
        <div class="sidebar">
            <population-info></population-info>
            <resource-bar></resource-bar>
            <actions-panel></actions-panel>
        </div>

        <!-- 右侧主要内容：选项卡 -->
        <div class="main-content">
            <tab-bar></tab-bar>
            <div id="panel-building" class="panel" v-show="ui.currentTab === 'building'"><building-panel></building-panel></div>
            <div id="panel-tech" class="panel" v-show="ui.currentTab === 'tech'"><tech-panel></tech-panel></div>
            <div id="panel-policy" class="panel" v-show="ui.currentTab === 'policy'"><policy-panel></policy-panel></div>
            <div id="panel-trade" class="panel" v-show="ui.currentTab === 'trade'"><trade-panel></trade-panel></div>
            <div id="panel-crystal" class="panel" v-show="ui.currentTab === 'crystal'"><crystal-panel></crystal-panel></div>
            <div id="panel-permanent" class="panel" v-show="ui.currentTab === 'permanent'"><permanent-panel></permanent-panel></div>
            <div id="panel-achievements" class="panel" v-show="ui.currentTab === 'achievements'"><achievements-panel></achievements-panel></div>
            <div id="panel-reset" class="panel" v-show="ui.currentTab === 'reset'"><reset-panel></reset-panel></div>
            <div id="panel-changelog" class="panel" v-show="ui.currentTab === 'changelog'"><changelog-panel></changelog-panel></div>
        </div>

        <div class="log-panel">
            <queue-panel></queue-panel>
            <div class="log-header">
                <span id="current-date">{{ dateText }}</span>
                <span id="current-season">({{ seasonText }})</span>
            </div>
            <log-panel></log-panel>
        </div>
    </div>

    <import-modal v-if="ui.importModalOpen"></import-modal>
    <tooltip-host></tooltip-host>
</div>
`,
        computed: {
            // 有效幸福度（软上限折算），与原版 updateHappinessDisplay 一致
            effectiveHappiness() {
                return Formulas.calcHappinessSoftCap(Math.max(0, this.GS.happiness || 0), this.GS);
            },
            // 日期：与 gameloop advanceDay 中的换算一致
            dateText() {
                const totalDays = this.GS.gameDays || 0;
                const year = Math.floor(totalDays / 360);
                const day = (totalDays % 360) + 1;
                return `${year}年${day}日`;
            },
            // 季节：与 gameloop advanceDay 中的规则一致
            seasonText() {
                const dayOfYear = (this.GS.gameDays || 0) % 360;
                if (dayOfYear >= 270) return '冬';
                if (dayOfYear >= 180) return '秋';
                if (dayOfYear >= 90) return '夏';
                return '春';
            },
        },
        methods: {
            // 幸福度悬浮提示（复刻原版 getHappinessTooltipHtml）
            happinessTooltip() {
                const happiness = this.GS.happiness;
                const breakdown = EffectsManager.getHappinessBreakdown();
                const softCap = Formulas.calcHappinessSoftCapBase(this.GS);
                const effectiveHappiness = Formulas.calcHappinessSoftCap(happiness, this.GS);

                let html = '<strong>幸福度组成</strong><br>基础: 100%<br>';
                if (breakdown.length === 0) {
                    html += '无额外加成';
                } else {
                    for (let c of breakdown) {
                        const sign = c.value > 0 ? '+' : '';
                        html += `${c.sourceName}: ${sign}${c.value.toFixed(2)}%<br>`;
                    }
                }
                html += `<br><strong>总计: ${happiness.toFixed(1)}%</strong>(软上限: ${softCap.toFixed(1)}%)`;
                if (happiness > softCap) {
                    html += `<br>有效幸福度: ${effectiveHappiness.toFixed(1)}% `;
                }
                return html;
            },
        },
    };
    UI.registerComponent('GameApp', GameApp);
})();
