// ui/trade.js — 贸易面板组件
// 复刻原版 renderTradePanel / refreshTradePanel 的展示与交互。
(function () {
    const TradePanel = {
        template: `
<div>
    <p v-if="!marketVisible">暂未解锁</p>
    <template v-else>
        <div class="trade-single-card">
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">单次贸易量上限：</span> {{ fmt(maxVolume) }}
            </div>
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">自定义单次贸易量：</span>
                <input type="number" id="user-trade-volume" class="trade-volume-input"
                       :value="volumeDraft" step="any" min="0" :max="maxVolume"
                       :disabled="maxVolume <= 0"
                       @input="onVolumeInput" @change="onVolumeCommit">
                <span v-if="maxVolume <= 0" style="font-size: 0.8rem; color: var(--text-dim); margin-left: 0.5rem;">需先建造市场</span>
            </div>
            <div style="margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                <strong>持续贸易吞吐量上限 (取决于单次贸易量)</strong><br>
                上限: {{ fmt(throughputLimit) }} 资源/秒<br>
                已用: <span class="throughput-used-display">{{ fmt(usedThroughput) }}</span> 资源/秒<br>
                <span style="font-size: 0.75rem; color: var(--text-dim);">
                    提示：正数=进口，负数=出口。<br>
                </span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0.8rem;">
            <div v-for="r in tradeResources" :key="r" class="trade-single-card" :data-resource="r">
                <div style="font-weight: bold; margin-bottom: 0.3rem;">{{ r }}</div>
                <div class="trade-info-line" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    <span class="trade-price-display" v-html="priceDisplayHtml(r)"></span> |  <span class="trade-stock-display">{{ stockText(r) }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                    <input type="number" class="trade-rate-input" :data-resource="r"
                           style="width: 120px; background: var(--bg-input); color: var(--text); border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.3rem 0.6rem;"
                           :value="rateDraft(r)" step="any" placeholder="速率"
                           @input="onRateInput(r, $event)" @change="onRateChange(r, $event)">
                    <span style="font-size: 0.85rem;">资源/秒</span>
                    <span class="trade-status-label" :class="statusClass(r)">{{ statusText(r) }}</span>
                </div>
                <div class="trade-goldflow-display" style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 0.6rem;">
                    {{ goldFlowText(r) }}
                </div>
                <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.5rem;">
                    <button class="trade-once-buy-btn" v-tooltip="() => buyTooltip(r)" @click="oneTimeTrade(r, 'buy')">购买</button>
                    <button class="trade-once-sell-btn" v-tooltip="() => sellTooltip(r)" @click="oneTimeTrade(r, 'sell')">出售</button>
                </div>
            </div>
        </div>
    </template>
</div>
`,
        data() {
            // 两个输入框都绑草稿字符串而不是 GameState 里的数值：
            // Vue 对 input 的 value 属性是「每次重渲染无条件写回 DOM」（源码里
            // `(s !== l || "value" === r) && a(...)` 对 value 不做相等判断）。
            // 贸易面板每个 tick（200ms）都会重渲染，若绑定的是数值，用户敲到一半的
            // 文本（如 "2." 被 parseFloat 成 2）会在下一帧被覆盖，表现为「手输的值跳回、
            // 必须抢在下一帧前回车」。草稿与 DOM 完全一致，Vue 便没有写回的机会。
            return {
                volumeDraft: '',
                rateDrafts: {},
            };
        },
        created() {
            this.volumeDraft = this.volumeText(this.GS.userTradeVolume);
        },
        computed: {
            marketVisible() {
                const market = this.GS.buildings["市场"];
                return !!(market && market.visible);
            },
            maxVolume() {
                return this.GS.maxTradeVolume || 0;
            },
            throughputLimit() {
                return TradeEngine.getThroughputLimit(this.GS);
            },
            usedThroughput() {
                return TradeEngine.getTotalTradeRateAbs(this.GS);
            },
            // 可贸易资源列表（金除外，且可见或有存量或已设置速率）
            tradeResources() {
                const result = [];
                for (let r in this.GS.resources) {
                    const res = this.GS.resources[r];
                    if (r === "金") continue;
                    if (res.value === undefined) continue;
                    if (!res.visible && res.amount < 0.001 && (this.GS.tradeRates[r] || 0) === 0) continue;
                    result.push(r);
                }
                return result;
            },
            // 影响单次贸易量上限的建筑数量之和（用于同步 maxTradeVolume）
            marketBuildingsCount() {
                const G = this.GS;
                return (G.buildings["市场"]?.count || 0) +
                    (G.buildings["星际交易站"]?.count || 0) +
                    (G.buildings["比邻星物流中心"]?.count || 0);
            },
            // 贸易III 永久升级（研究后单次贸易量上限 ×1.5）
            trade3Researched() {
                return this.GS.permanent["贸易III"]?.researched || false;
            },
        },
        watch: {
            // 市场/星际交易站数量或贸易III永久升级变化时同步最大贸易量（原版在每次渲染时更新）
            marketBuildingsCount() {
                TradeEngine.updateMaxTradeVolume(this.GS);
            },
            trade3Researched() {
                TradeEngine.updateMaxTradeVolume(this.GS);
            },
            // 状态被外部改动（读档、重置、上限变化）时同步显示值。
            // 注意别打断输入：草稿解析出的数值与状态一致就说明用户正在编辑，保持原样。
            'GS.userTradeVolume'(val) {
                const parsed = parseFloat(this.volumeDraft);
                if (!Number.isFinite(parsed) || parsed !== val) {
                    this.volumeDraft = this.volumeText(val);
                }
            },
        },
        methods: {
            fmt(n) {
                return formatNumber(n);
            },
            // 数值 → 输入框显示文本。空 / 非法一律给空串，避免把 "NaN" 塞进 DOM。
            volumeText(v) {
                return Number.isFinite(Number(v)) ? String(v) : '';
            },
            rateText(r) {
                return (this.GS.tradeRates[r] || 0).toFixed(2);
            },
            // 速率框的显示值：用户正在编辑时用草稿原文，否则用状态值。
            rateDraft(r) {
                const draft = this.rateDrafts[r];
                return draft !== undefined ? draft : this.rateText(r);
            },
            statusClass(r) {
                const rate = this.GS.tradeRates[r] || 0;
                if (rate > 0) return 'trade-status-import';
                if (rate < 0) return 'trade-status-export';
                return 'trade-status-idle';
            },
            statusText(r) {
                const rate = this.GS.tradeRates[r] || 0;
                if (rate > 0) return '进口';
                if (rate < 0) return '出口';
                return '闲置';
            },
            effectivePrice(r) {
                return TradeEngine.getEffectivePrice(this.GS, r);
            },
            // 价格 + 涨跌百分比（含颜色），用 v-html 渲染
            priceDisplayHtml(r) {
                const effectivePrice = this.effectivePrice(r);
                const baseValue = this.GS.resources[r].value;
                let priceChangeHtml = '';
                if (baseValue !== undefined && baseValue > 0) {
                    const changePercent = (effectivePrice - baseValue) / baseValue * 100;
                    if (Math.abs(changePercent) > 0.01) {
                        const sign = changePercent > 0 ? '+' : '-';
                        const color = changePercent > 0 ? 'var(--red)' : 'var(--accent)';
                        priceChangeHtml = `<span style="color: ${color}; margin-left: 0.3rem;">(${sign}${Math.abs(changePercent).toFixed(1)}%)</span>`;
                    }
                }
                return `价格: ${effectivePrice.toFixed(2)} 金${priceChangeHtml}`;
            },
            stockText(r) {
                const res = this.GS.resources[r];
                return `库存: ${formatNumber(res.amount)} / ${res.cap === Infinity ? "∞" : formatNumber(res.cap)}`;
            },
            goldFlowText(r) {
                const goldFlow = TradeEngine.getGoldFlowForResource(this.GS, r, this.GS.tradeRates[r] || 0);
                if (goldFlow > 0) return `+${formatNumber(goldFlow)} 金/秒`;
                if (goldFlow < 0) return `-${formatNumber(-goldFlow)} 金/秒`;
                return '';
            },
            // 输入框与 GameState 必须双向同步，且草稿要原样留着（见 data 里的说明）。
            // step 固定为 "any"：曾用 floor(maxTradeVolume * 0.05) 当步长，该值随市场数量变化，
            // 玩家手输的小数不在 step 网格上时，原生箭头执行的是「吸附到最近网格点」而不是
            // 「加减一个步长」，表现为「有概率乱跳」，且 stepMismatch 会把输入判为非法。
            onVolumeInput(e) {
                const raw = e.target.value;
                this.volumeDraft = raw;   // 先原样保留，别让重渲染把 "2." 这类中间态冲掉
                if (raw === '') return;   // 清空重输的中间态，不打断输入
                const v = parseFloat(raw);
                if (!Number.isFinite(v)) return;   // "-"、"1e" 等中间态
                const clamped = Math.min(this.GS.maxTradeVolume, Math.max(0, v));
                this.GS.userTradeVolume = clamped;
                // 超出范围时立刻回显被夹后的值，让玩家看到真实生效的数字；
                // 范围内的半截输入（"2."）保持原样，等玩家敲完。
                if (clamped !== v) this.volumeDraft = this.volumeText(clamped);
            },
            // 失焦 / 回车时收尾：清空或非法输入回落到上限，并把规范化后的值写回显示。
            onVolumeCommit(e) {
                let v = parseFloat(e.target.value);
                if (!Number.isFinite(v)) v = this.GS.maxTradeVolume;
                v = Math.min(this.GS.maxTradeVolume, Math.max(0, v));
                this.GS.userTradeVolume = v;
                this.volumeDraft = this.volumeText(v);
            },
            // 速率框每次输入只记草稿，不调引擎——避免把用户的半截输入当成速率反复裁剪。
            onRateInput(r, e) {
                this.rateDrafts[r] = e.target.value;
            },
            onRateChange(r, e) {
                let newRate = parseFloat(e.target.value);
                if (isNaN(newRate)) newRate = 0;
                TradeEngine.setTradeRate(this.GS, r, newRate);
                this.rateDrafts[r] = undefined;   // 交还给状态回显（可能已被裁剪）
                computeProductionAndCaps();
            },
            oneTimeTrade(r, type) {
                const desiredVolume = this.GS.userTradeVolume;
                const result = TradeEngine.performOneTimeTrade(this.GS, r, type, desiredVolume);
                if (result.success) {
                    if (type === 'buy') {
                        addEventLog(`购买 ${formatNumber(result.actualVolume)} ${r}，消耗 ${formatNumber(result.costGold)} 金。`);
                    } else {
                        addEventLog(`出售 ${formatNumber(result.actualVolume)} ${r}，获得 ${formatNumber(result.gainGold)} 金。`);
                    }
                } else {
                    addEventLog(`${type === 'buy' ? '购买' : '出售'}失败：${result.reason}`);
                }
                computeProductionAndCaps();
            },
            buyTooltip(r) {
                const desiredVolume = this.GS.userTradeVolume;
                const actualVolume = TradeEngine.getMaxBuyableVolume(this.GS, r, desiredVolume);
                if (actualVolume <= 0) {
                    return `无法购买 ${r}，黄金不足或容量已满`;
                }
                const cost = TradeEngine.computeBuyCost(this.GS, r, actualVolume);
                return `购买 ${formatNumber(actualVolume)} ${r}<br>消耗 ${formatNumber(cost)} 金<br>`;
            },
            sellTooltip(r) {
                const desiredVolume = this.GS.userTradeVolume;
                const actualVolume = TradeEngine.getMaxSellableVolume(this.GS, r, desiredVolume);
                if (actualVolume <= 0) {
                    return `无法出售 ${r}，资源不足或黄金容量已满`;
                }
                const gain = TradeEngine.computeSellGain(this.GS, r, actualVolume);
                return `出售 ${formatNumber(actualVolume)} ${r}<br>获得 ${formatNumber(gain)} 金<br>`;
            },
        },
    };
    UI.registerComponent('TradePanel', TradePanel);
})();
