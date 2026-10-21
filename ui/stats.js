// ui/stats.js — 统计面板组件
// 显示当前周目天数、累计天数、周目数，以及所有永恒升级的总计加成。
(function () {
    function formatDays(value) {
        const n = Math.max(0, Math.floor(Number(value) || 0));
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatPercent(value, digits = 2) {
        const n = value * 100;
        const sign = n > 0 ? '+' : '';
        return sign + n.toFixed(digits) + '%';
    }

    // 四舍五入后仍为 0.00% 的加成一律不展示。
    function isNonZeroPercent(value, digits = 2) {
        return Math.abs(value * 100) >= 0.5 * Math.pow(10, -digits);
    }

    const StatsPanel = {
        template: `
<div>
    <div class="stats-cards">
        <div class="stat-card">
            <div class="stat-card-label">当前周目游戏天数</div>
            <div class="stat-card-value">{{ currentRunDaysText }}<span class="stat-card-unit">天</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-card-label">总计游戏天数</div>
            <div class="stat-card-value">{{ totalGameDaysText }}<span class="stat-card-unit">天</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-card-label">周目数</div>
            <div class="stat-card-value">{{ runCountText }}<span class="stat-card-unit">周目</span></div>
        </div>
    </div>

    <h3 class="stats-section-title">永恒升级总计加成</h3>
    <p class="stats-summary">已研究 {{ researchedCount }} 项永恒升级</p>
    <p v-if="permanentBonuses.length === 0" class="stats-empty">尚未研究永恒升级。</p>
    <div v-else class="stats-bonus-list">
        <div v-for="bonus in permanentBonuses" :key="bonus.label" class="stats-bonus-row">
            <span class="stats-bonus-label">{{ bonus.label }}</span>
            <span class="stats-bonus-value">{{ bonus.value }}</span>
        </div>
    </div>
</div>
`,
        computed: {
            currentRunDaysText() {
                return formatDays(this.GS.gameDays);
            },
            totalGameDaysText() {
                return formatDays(this.GS.totalGameDays);
            },
            // 存档字段 runCount 记录当前周目数；初始为 1，旧存档缺省也为 1。
            runCountText() {
                return formatDays(this.GS.runCount);
            },
            researchedPermanents() {
                const permanents = this.GS.permanent || {};
                return Object.keys(permanents).filter(id => permanents[id].researched);
            },
            researchedCount() {
                return this.researchedPermanents.length;
            },
            permanentBonuses() {
                const list = [];
                let costDelta = 0;
                let globalProd = 0;
                let globalSpeed = 0;
                let spaceProd = 0;
                let galaxyProd = 0;
                let capPerRelic = 0;
                let sciCapPerRelicLog = 0;

                for (const id of this.researchedPermanents) {
                    const effect = this.GS.permanent[id].effect;
                    if (!effect) continue;
                    if (effect.costRatio) costDelta += effect.costRatio - 1;
                    if (effect.globalProd) globalProd += effect.globalProd;
                    if (effect.globalSpeed) globalSpeed += effect.globalSpeed;
                    if (effect.globalSpaceProd) spaceProd += effect.globalSpaceProd;
                    if (effect.globalGalaxyProd) galaxyProd += effect.globalGalaxyProd;
                    if (effect.capPerRelic) capPerRelic += effect.capPerRelic;
                    if (effect.sciCapPerRelicLog) sciCapPerRelicLog += effect.sciCapPerRelicLog;
                }

                // 只展示非零加成，避免出现 0% 的干扰项。
                if (isNonZeroPercent(costDelta)) {
                    list.push({
                        label: '建筑成本增长率',
                        value: formatPercent(costDelta),
                    });
                }
                if (isNonZeroPercent(globalProd)) {
                    list.push({
                        label: '全局产量',
                        value: formatPercent(globalProd),
                    });
                }
                if (isNonZeroPercent(globalSpeed)) {
                    list.push({
                        label: '生产速度',
                        value: formatPercent(globalSpeed),
                    });
                }
                if (isNonZeroPercent(spaceProd)) {
                    list.push({
                        label: '太阳系建筑产量',
                        value: formatPercent(spaceProd),
                    });
                }
                if (isNonZeroPercent(galaxyProd)) {
                    list.push({
                        label: '银河系建筑产量',
                        value: formatPercent(galaxyProd),
                    });
                }
                if (isNonZeroPercent(capPerRelic)) {
                    list.push({
                        label: '储存建筑上限',
                        value: '每遗物 ' + formatPercent(capPerRelic),
                    });
                }

                if (sciCapPerRelicLog !== 0) {
                    const relic = this.GS.resources['遗物']?.amount || 0;
                    const sciBonus = Math.log(1 + relic) * sciCapPerRelicLog;
                    if (isNonZeroPercent(sciBonus)) {
                        list.push({
                            label: '科学上限',
                            value: formatPercent(sciBonus),
                        });
                    }
                }

                if (this.GS.permanent['幸福度I']?.researched) {
                    const singularity = this.GS.resources['奇点']?.amount || 0;
                    const happinessBonus = Math.sqrt(singularity) * 10;
                    if (happinessBonus >= 0.05) {
                        list.push({
                            label: '幸福度软上限',
                            value: '+' + happinessBonus.toFixed(1),
                        });
                    }
                }

                let tradeRate = 0.01;
                if (this.GS.permanent['贸易I']?.researched) tradeRate = 0.015;
                if (this.GS.permanent['贸易II']?.researched) tradeRate = 0.02;
                if (tradeRate > 0.01) {
                    list.push({
                        label: '持续贸易吞吐量',
                        value: '上限的 ' + (tradeRate * 100).toFixed(1) + '%',
                    });
                }
                if (this.GS.permanent['贸易III']?.researched) {
                    list.push({
                        label: '单次贸易量上限',
                        value: '+50%',
                    });
                }
                if (this.GS.permanent['自动战争']?.researched) {
                    list.push({
                        label: '自动战争',
                        value: '已启用',
                    });
                }
                if (this.GS.permanent['智慧I']?.researched) {
                    list.push({
                        label: '哲学科技',
                        value: '已解锁',
                    });
                }

                return list;
            },
        },
    };
    UI.registerComponent('StatsPanel', StatsPanel);
})();
