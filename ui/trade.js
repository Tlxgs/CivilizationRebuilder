// ui/trade.js - 贸易面板，所有单位均为资源数量

function renderTradePanel() {
    const panel = document.getElementById('panel-trade');
    const market = GameState.buildings["市场"];
    const isUnlocked = market && market.visible;

    if (!isUnlocked) {
        panel.innerHTML = '<p>暂未解锁（需要研究“国际贸易学”并建造市场）</p>';
        return;
    }

    TradeEngine.updateMaxTradeVolume(GameState);
    const maxVolume = GameState.maxTradeVolume;
    const userVolume = GameState.userTradeVolume;
    const throughputLimit = TradeEngine.getThroughputLimit(GameState);
    const usedThroughput = TradeEngine.getTotalTradeRateAbs(GameState);
    const remainingThroughput = Math.max(0, throughputLimit - usedThroughput);

    let html = `
        <div style="background: var(--bg-sidebar); padding: 0.8rem; border-radius: 0.8rem; margin-bottom: 1rem;">
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">单次贸易量上限：</span> ${formatNumber(maxVolume)}
            </div>
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">自定义单次贸易量：</span>
                <input type="number" id="user-trade-volume" 
                       style="width: 150px; background: var(--bg-input); color: var(--text); border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.3rem 0.6rem;"
                       value="${userVolume.toFixed(2)}" step="1" min="0" max="${maxVolume.toFixed(2)}">
                <span style="margin-left: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                </span>
            </div>
            <div style="margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                <strong>持续贸易吞吐量上限 (单次贸易量上限的1%)</strong><br>
                上限: ${formatNumber(throughputLimit)} 资源/秒<br>
                已用: ${formatNumber(usedThroughput)} 资源/秒<br>
                <span style="font-size: 0.75rem; color: var(--text-dim);">提示：正数=进口，负数=出口。</span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0.8rem;">
    `;

    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (r === "金") continue;
        if (res.value === undefined) continue;
        if (!res.visible && res.amount < 0.001 && (GameState.tradeRates[r] || 0) === 0) continue;

        const currentRate = GameState.tradeRates[r] || 0;
        const isImport = currentRate > 0;
        const isExport = currentRate < 0;
        const effectivePrice = TradeEngine.getEffectivePrice(GameState, r);

        const goldFlow = TradeEngine.getGoldFlowForResource(GameState, r, currentRate);
        const goldFlowText = goldFlow > 0 ? `+${formatNumber(goldFlow)} 金/秒` : (goldFlow < 0 ? `-${formatNumber(-goldFlow)} 金/秒` : '');

        html += `
            <div style="background: var(--bg-card); border-radius: 0.8rem; padding: 0.8rem; border: 1px solid var(--border-card);">
                <div style="font-weight: bold; margin-bottom: 0.3rem;">${r}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    价格: ${effectivePrice.toFixed(2)} 金| 库存: ${formatNumber(res.amount)} / ${res.cap === Infinity ? "∞" : formatNumber(res.cap)}
                </div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                    <input type="number" class="trade-rate-input" data-resource="${r}"
                           style="width: 120px; background: var(--bg-input); color: var(--text); border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.3rem 0.6rem;"
                           value="${currentRate.toFixed(2)}" step="1" placeholder="速率">
                    <span style="font-size: 0.85rem;">资源/秒</span>
                    <span style="font-size: 0.75rem; padding: 0.1rem 0.3rem; border-radius: 0.3rem; 
                        ${isImport ? 'background: #2a7faa20; color: #2a7faa;' : (isExport ? 'background: #c5282820; color: #c52828;' : '')}">
                        ${isImport ? '进口' : (isExport ? '出口' : '闲置')}
                    </span>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 0.6rem;">
                    ${goldFlowText}
                </div>
                
                <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.5rem;">
                    <button class="trade-once-buy-btn" data-resource="${r}" style="flex: 1; background: var(--buy-btn-hover-bg); border: 1px solid var(--accent); border-radius: 0.4rem; padding: 0.2rem 0.4rem; cursor: pointer; font-size: 0.8rem;">
                        购买
                    </button>
                    <button class="trade-once-sell-btn" data-resource="${r}" style="flex: 1; background: var(--sell-btn-hover-bg); border: 1px solid var(--sell-btn-border); border-radius: 0.4rem; padding: 0.2rem 0.4rem; cursor: pointer; font-size: 0.8rem;">
                        出售
                    </button>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    panel.innerHTML = html;

    // 事件绑定
    const volumeInput = document.getElementById('user-trade-volume');
    if (volumeInput) {
        volumeInput.addEventListener('change', (e) => {
            let newVal = parseFloat(e.target.value);
            if (isNaN(newVal)) newVal = GameState.maxTradeVolume;
            newVal = Math.min(GameState.maxTradeVolume, Math.max(0, newVal));
            GameState.userTradeVolume = newVal;
            renderTradePanel();
        });
    }

    document.querySelectorAll('.trade-rate-input').forEach(input => {
        const resource = input.dataset.resource;
        input.addEventListener('change', (e) => {
            let newRate = parseFloat(e.target.value);
            if (isNaN(newRate)) newRate = 0;
            const result = TradeEngine.setTradeRate(GameState, resource, newRate);
            input.value = result.actualRate.toFixed(4);
            computeProductionAndCaps();
            renderAll();
        });
    });
    // 购买按钮：按实际黄金和资源上限购买尽可能多的资源，避免浪费
    document.querySelectorAll('.trade-once-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            const requestedAmount = GameState.userTradeVolume;
            if (requestedAmount <= 0) {
                alert("请先设置一个正数的单次贸易量");
                return;
            }
            const res = GameState.resources[resource];
            const gold = GameState.resources["金"];
            if (!res || res.value === undefined || !gold) return;

            const effectivePrice = TradeEngine.getEffectivePrice(GameState, resource);

            // 限制1：黄金能买得起的数量
            const maxByGold = Math.floor(gold.amount / effectivePrice);
            // 限制2：资源剩余容量
            const remainingCap = Math.max(0, res.cap - res.amount);
            // 最终实际购买量（不可超过用户设定的单次贸易量）
            let actualAmount = Math.min(requestedAmount, maxByGold, remainingCap);

            const costGold = actualAmount * effectivePrice;

            // 执行交易
            gold.amount -= costGold;
            res.amount = Math.min(res.cap, res.amount + actualAmount);
            if (res.amount > 0) res.visible = true;

            // 更新热度（按实际交易量）
            const maxVolume = GameState.maxTradeVolume;
            let deltaHeat = (actualAmount / maxVolume) * 0.1;
            let newHeat = (res.tradeHeat || 0) + deltaHeat;
            res.tradeHeat = Math.min(5, Math.max(-5, newHeat));

            addEventLog(`购买 ${formatNumber(actualAmount)} ${resource}，消耗 ${formatNumber(costGold)} 金。`);
            computeProductionAndCaps();
            renderAll();
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const amount = GameState.userTradeVolume;
            const price = TradeEngine.getEffectivePrice(GameState, resource);
            showTooltip(btn, `购买 ${formatNumber(amount)} ${resource}<br>消耗 ${formatNumber(amount * price)} 金<br>`);
        });
    });

    document.querySelectorAll('.trade-once-sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            const requestedAmount = GameState.userTradeVolume;
            if (requestedAmount <= 0) {
                alert("请先设置一个正数的单次贸易量");
                return;
            }
            const res = GameState.resources[resource];
            const gold = GameState.resources["金"];
            if (!res || res.value === undefined || !gold) return;

            const effectivePrice = TradeEngine.getEffectivePrice(GameState, resource);
            const gainPerUnit = effectivePrice * 0.8;

            // 限制1：自己拥有的资源量
            const maxByRes = res.amount;
            // 限制2：黄金剩余容量
            const goldRemainingCap = Math.max(0, gold.cap - gold.amount);
            const maxByGoldCap = Math.floor(goldRemainingCap / gainPerUnit);

            let actualAmount = Math.min(requestedAmount, maxByRes, maxByGoldCap);

            const gainGold = actualAmount * gainPerUnit;

            // 执行交易
            res.amount -= actualAmount;
            gold.amount += gainGold;
            if (gold.amount > 0) gold.visible = true;

            // 更新热度（按实际交易量）
            const maxVolume = GameState.maxTradeVolume;
            let deltaHeat = (actualAmount / maxVolume) * 0.1;
            let newHeat = (res.tradeHeat || 0) - deltaHeat;
            res.tradeHeat = Math.min(5, Math.max(-5, newHeat));

            addEventLog(`出售 ${formatNumber(actualAmount)} ${resource}，获得 ${formatNumber(gainGold)} 金。`);
            computeProductionAndCaps();
            renderAll();
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const amount = GameState.userTradeVolume;
            const price = TradeEngine.getEffectivePrice(GameState, resource);
            const gain = amount * price * 0.8;
            showTooltip(btn, `出售 ${formatNumber(amount)} ${resource}<br>获得 ${formatNumber(gain)} 金<br>`);
        });
    });
}

window.renderTradePanel = renderTradePanel;