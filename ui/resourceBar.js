// ui/resourceBar.js — 资源条组件
// 由 GameState 响应式驱动：资源数量/上限/产量/可见性变化时自动更新。
(function () {
    const ResourceBar = {
        template: `
<div id="resource-bar" class="resource-bar">
    <div v-for="r in visibleResources" :key="r" class="resource-item" :data-resource="r"
         :class="{ highlight: ui.hoveredBuilding && priceHasResource(ui.hoveredBuilding, r) }"
         @mouseenter="ui.hoveredResource = r" @mouseleave="ui.hoveredResource = null"
         v-tooltip="() => resourceTooltip(r)">
        <div class="resource-progress" :style="{ width: progressPercent(r) + '%' }"></div>
        <div class="resource-content">
            <span class="res-name" :style="prodColor(r)">{{ r }}</span>
            <span class="res-value" :style="prodColor(r)">{{ valueText(r) }}</span>
            <span class="res-prod" :style="prodColor(r)">{{ prodText(r) }}</span>
        </div>
    </div>
</div>
`,
        computed: {
            visibleResources() {
                return Object.keys(this.GS.resources).filter(r => this.GS.resources[r].visible);
            },
        },
        methods: {
            // 建筑价格中是否包含某资源（用于悬停高亮联动）
            priceHasResource(bKey, resName) {
                return this.GS.buildings[bKey]?.price?.[resName] !== undefined;
            },
            progressPercent(r) {
                const res = this.GS.resources[r];
                if (res.cap === Infinity || res.cap <= 0) return 0;
                return Math.min(100, (res.amount / res.cap) * 100);
            },
            valueText(r) {
                const res = this.GS.resources[r];
                const capDisplay = res.cap === Infinity ? '∞' : formatNumber(res.cap);
                return `${formatNumber(res.amount)}/${capDisplay}`;
            },
            prodText(r) {
                const prod = this.GS.resources[r].production;
                if (Math.abs(prod) > 1e-9) {
                    const sign = prod > 0 ? '+' : '';
                    return `${sign}${formatNumber(prod)}`;
                }
                return '';
            },
            // 与原版 refreshResourceBars 一致：产量绝对值较大且为负时，名称/数值/产量均标红
            prodColor(r) {
                const prod = this.GS.resources[r].production;
                if (prod < 0 && Math.abs(prod) > 1e-3) {
                    return { color: 'var(--red)' };
                }
                return {};
            },
            // 资源悬浮提示：贡献来源 + 自定义描述 + 预计满仓/耗尽时间
            resourceTooltip(r) {
                const contributions = getResourceContributions(r);
                let html = `<strong>${r}</strong><hr>`;

                const resCfg = RESOURCES_CONFIG[r];
                if (resCfg && typeof resCfg.getDescription === 'function') {
                    const customDesc = resCfg.getDescription(this.GS);
                    if (customDesc) {
                        html += `<div style="margin-bottom: 0.5rem;">${customDesc}</div><hr>`;
                    }
                }

                if (contributions.length === 0) {
                    html += `无`;
                } else {
                    const THRESHOLD = 30;
                    if (contributions.length > THRESHOLD) {
                        const mid = Math.ceil(contributions.length / 2);
                        const leftCol = contributions.slice(0, mid);
                        const rightCol = contributions.slice(mid);
                        html += `<div style="display: flex; gap: 1rem; margin-top: 0.25rem;">`;
                        html += `<div style="min-width: 150px;">`;
                        for (let contrib of leftCol) {
                            const sign = contrib.value > 0 ? '+' : '';
                            html += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                        html += `</div><div style="min-width: 120px;">`;
                        for (let contrib of rightCol) {
                            const sign = contrib.value > 0 ? '+' : '';
                            html += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                        html += `</div></div>`;
                    } else {
                        for (let contrib of contributions) {
                            const sign = contrib.value > 0 ? '+' : '';
                            html += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                    }
                }

                // 预计满仓/耗尽时间
                const res = this.GS.resources[r];
                if (res) {
                    const prod = res.production;
                    const curAmount = res.amount;
                    const curCap = res.cap;
                    let timeInfo = '';

                    if (Math.abs(prod) > 1e-9) {
                        if (prod > 0) {
                            if (curCap !== Infinity && curAmount < curCap - 1e-9) {
                                const deficit = curCap - curAmount;
                                const seconds = deficit / prod;
                                if (isFinite(seconds) && seconds > 0) {
                                    timeInfo = `<hr>预计充满: ${formatTime(seconds)}`;
                                } else {
                                    timeInfo = `<hr>正在增长`;
                                }
                            } else if (curCap === Infinity) {
                                timeInfo = `<hr>无上限`;
                            } else if (curAmount >= curCap - 1e-9) {
                                timeInfo = `<hr>已满`;
                            } else {
                                timeInfo = `<hr>正在增长`;
                            }
                        } else if (prod < 0) {
                            if (curAmount > 1e-9) {
                                const seconds = curAmount / Math.abs(prod);
                                if (isFinite(seconds) && seconds > 0) {
                                    timeInfo = `<hr>预计耗尽: ${formatTime(seconds)}`;
                                } else {
                                    timeInfo = `<hr>正在消耗`;
                                }
                            } else {
                                timeInfo = `<hr>已耗尽`;
                            }
                        }
                    } else {
                        if (curCap !== Infinity && curAmount >= curCap - 1e-9) {
                            timeInfo = `<hr>已满`;
                        } else if (curAmount <= 1e-9) {
                            timeInfo = `<hr>已耗尽`;
                        } else {
                            timeInfo = `<hr>`;
                        }
                    }
                    html += timeInfo;
                }
                return html;
            },
        },
    };
    UI.registerComponent('ResourceBar', ResourceBar);
})();
