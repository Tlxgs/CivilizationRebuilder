// ui/tech.js — 科技面板组件（含挑战/技术/升级三个子选项卡）
// 复刻原版 renderTechPanel / refreshTechPanel / getUpgradePanelHTML。
(function () {
    // 是否存在任何挑战科技（已研究或满足解锁条件）
    function hasAnyChallenge() {
        for (let t in GameState.techs) {
            const tech = GameState.techs[t];
            if (!tech.challenge) continue;
            if (tech.researched) return true;
            if (tech.unlockCondition) {
                if (typeof tech.unlockCondition === 'function' && tech.unlockCondition(GameState)) return true;
            } else {
                return true;
            }
        }
        return false;
    }

    // 是否存在任何可见升级
    function hasAnyUpgrade() {
        for (let u in GameState.upgrades) {
            if (GameState.upgrades[u].visible) return true;
        }
        return false;
    }

    const TechPanel = {
        template: `
<div>
    <div class="sub-tabs">
        <button v-if="showChallenge" class="sub-tab-btn" :class="{ active: ui.currentTechSubTab === 'challenge' }" data-subtab="challenge" @click="ui.currentTechSubTab = 'challenge'">挑战</button>
        <button class="sub-tab-btn" :class="{ active: ui.currentTechSubTab === 'tech' }" data-subtab="tech" @click="ui.currentTechSubTab = 'tech'">技术</button>
        <button v-if="showUpgrade" class="sub-tab-btn" :class="{ active: ui.currentTechSubTab === 'upgrade' }" data-subtab="upgrade" @click="ui.currentTechSubTab = 'upgrade'">升级</button>
    </div>

    <!-- 升级子选项卡 -->
    <template v-if="ui.currentTechSubTab === 'upgrade'">
        <div class="grid-list">
            <button v-for="u in visibleUpgrades" :key="u" class="card-btn upgrade-btn" :class="upgradeAffordClass(u)" :data-upgrade="u" @click="buyUpgrade(u)" v-tooltip="() => upgradeTooltip(u)"><b>{{ u }} Lv.{{ GS.upgrades[u].level }}</b></button>
            <p v-if="visibleUpgrades.length === 0">暂无可用升级</p>
        </div>
    </template>

    <!-- 技术/挑战子选项卡 -->
    <template v-else>
        <div v-if="ui.currentTechSubTab === 'challenge'" style="width:100%; font-size:0.85rem; color: var(--text-dim); margin-bottom:0.8rem;">当前激活挑战星级：{{ stars }}，永恒资源获取 +{{ stars * 5 }}%</div>
        <div class="grid-list">
            <button v-for="t in availableTechs" :key="t" class="card-btn tech-btn" :class="techAffordClass(t)" :data-tech="t" @click="research(t)" v-tooltip="() => techTooltip(t)"><b>{{ t }}</b></button>
            <p v-if="availableTechs.length === 0">暂无可用科技</p>
        </div>
        <h3>已研究</h3>
        <div class="grid-list">
            <span v-for="t in researchedTechs" :key="t" class="card-btn researched-item" :data-tech="t" v-tooltip="() => researchedTooltip(t)">{{ t }}</span>
            <p v-if="researchedTechs.length === 0">暂无已研究科技</p>
        </div>
    </template>
</div>
`,
        computed: {
            showChallenge() {
                return hasAnyChallenge();
            },
            showUpgrade() {
                return hasAnyUpgrade();
            },
            stars() {
                return getTotalActiveChallengeStars();
            },
            // 未研究且满足解锁/前置条件的科技（按当前子选项卡过滤）
            availableTechs() {
                const sub = this.ui.currentTechSubTab;
                const result = [];
                for (let t in this.GS.techs) {
                    const tech = this.GS.techs[t];
                    if (tech.researched) continue;
                    if (tech.unlockCondition != null) {
                        if (typeof tech.unlockCondition === 'function') {
                            if (!tech.unlockCondition(this.GS)) continue;
                        }
                    }
                    let canResearch = true;
                    if (tech.prereq) {
                        for (let p of tech.prereq) {
                            if (!this.GS.techs[p]?.researched) {
                                canResearch = false;
                                break;
                            }
                        }
                    }
                    if (!canResearch) continue;
                    const isChallenge = !!tech.challenge;
                    if (sub === 'challenge' && !isChallenge) continue;
                    if (sub === 'tech' && isChallenge) continue;
                    result.push(t);
                }
                return result;
            },
            // 已研究科技（按当前子选项卡过滤）
            researchedTechs() {
                const sub = this.ui.currentTechSubTab;
                const result = [];
                for (let t in this.GS.techs) {
                    if (!this.GS.techs[t].researched) continue;
                    const isChallenge = !!this.GS.techs[t].challenge;
                    if (sub === 'challenge' && !isChallenge) continue;
                    if (sub === 'tech' && isChallenge) continue;
                    result.push(t);
                }
                return result;
            },
            visibleUpgrades() {
                return Object.keys(this.GS.upgrades).filter(u => this.GS.upgrades[u].visible);
            },
        },
        watch: {
            // 子选项卡不可用时回退到"技术"
            showChallenge(show) {
                if (!show && this.ui.currentTechSubTab === 'challenge') this.ui.currentTechSubTab = 'tech';
            },
            showUpgrade(show) {
                if (!show && this.ui.currentTechSubTab === 'upgrade') this.ui.currentTechSubTab = 'tech';
            },
        },
        methods: {
            research(t) {
                if (!Core.researchTech(t)) {
                    const tech = this.GS.techs[t];
                    if (tech && !tech.researched && !canAfford(tech.price)) {
                        addToQueue('tech', t);
                    }
                }
            },
            buyUpgrade(u) {
                const q = UI.getMultiplier();
                if (!Core.buyUpgrade(u, q)) {
                    const up = this.GS.upgrades[u];
                    if (up && up.visible && !canAfford(up.price)) {
                        addToQueue('upgrade', u);
                    }
                }
            },
            techAffordClass(t) {
                const status = getAffordabilityStatus(this.GS.techs[t].price);
                if (status === 'insufficient') return 'insufficient-name';
                if (status === 'cap-exceeded') return 'unaffordable-name';
                return '';
            },
            upgradeAffordClass(u) {
                const status = getAffordabilityStatus(this.GS.upgrades[u].price);
                if (status === 'insufficient') return 'insufficient-name';
                if (status === 'cap-exceeded') return 'unaffordable-name';
                return '';
            },
            // 未研究科技提示
            techTooltip(t) {
                const tech = this.GS.techs[t];
                if (!tech) return '';
                let priceHtml = '';
                if (tech.price && Object.keys(tech.price).length > 0) {
                    priceHtml = Object.entries(tech.price).map(([r, amt]) => {
                        const amount = this.GS.resources[r]?.amount || 0;
                        const enough = amount + 1e-6 >= amt;
                        const color = enough ? '' : 'red';
                        let text = `${r} ${formatNumber(amt)}`;
                        if (enough && amt > 0 && amount > 0) {
                            const percent = ((amt / amount) * 100).toFixed(1);
                            const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
                            text += ` (${cleanPercent}%)`;
                        }
                        return `<span style="color: ${color};">${text}</span>`;
                    }).join('\n');
                    priceHtml = '<hr>' + priceHtml;
                }
                return `${tech.desc}${priceHtml}`;
            },
            // 已研究科技提示
            researchedTooltip(t) {
                const tech = this.GS.techs[t];
                if (!tech) return '';
                return `${tech.desc}<br>✓ 已研究`;
            },
            // 升级提示
            upgradeTooltip(u) {
                const up = this.GS.upgrades[u];
                if (!up) return '';
                const priceHtml = Object.entries(up.price).map(([r, amt]) => {
                    const amount = this.GS.resources[r]?.amount || 0;
                    const enough = amount >= amt;
                    const color = enough ? '' : 'red';
                    let text = `${r} ${formatNumber(amt)}`;
                    if (enough && amt > 0 && amount > 0) {
                        const percent = ((amt / amount) * 100).toFixed(1);
                        const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
                        text += ` (${cleanPercent}%)`;
                    }
                    return `<span style="color: ${color};">${text}</span>`;
                }).join('\n');

                let effectText = '';
                for (let b in up.effect) {
                    effectText += `${b} 效率 +${(up.effect[b] * 100).toFixed(0)}%<br>`;
                }
                return `${up.desc}<hr> ${priceHtml}<hr>${effectText}`;
            },
        },
    };
    UI.registerComponent('TechPanel', TechPanel);
})();
