// ui/trade.js - 贸易面板，仅负责UI交互，所有交易逻辑调用TradeEngine

function renderTradePanel() {
    const panel = document.getElementById('panel-trade');
    const market = GameState.buildings["市场"];
    const isUnlocked = market && market.visible;

    if (!isUnlocked) {
        panel.innerHTML = '<p>暂未解锁</p>';
        return;
    }

    // 记录滚动位置（防止重新渲染后滚动条跳动）
    let scrollTop = 0;
    if (panel) {
        scrollTop = panel.scrollTop;
        // 如果 panel 本身没有滚动条，尝试找父级 .main-content 的滚动位置
        if (scrollTop === 0 && panel.parentElement && panel.parentElement.classList && panel.parentElement.classList.contains('main-content')) {
            scrollTop = panel.parentElement.scrollTop;
        }
    }

    TradeEngine.updateMaxTradeVolume(GameState);
    const maxVolume = GameState.maxTradeVolume;
    const userVolume = GameState.userTradeVolume;
    const throughputLimit = TradeEngine.getThroughputLimit(GameState);
    const usedThroughput = TradeEngine.getTotalTradeRateAbs(GameState);

    let html = `
        <div class="trade-single-card">
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">单次贸易量上限：</span> ${formatNumber(maxVolume)}
            </div>
            <div style="margin-bottom: 0.8rem;">
                <span style="font-weight: bold;">自定义单次贸易量：</span>
                <input type="number" id="user-trade-volume" class="trade-volume-input"
                       value="${userVolume.toFixed(2)}" step="${Math.floor(GameState.maxTradeVolume*0.05)}" min="0" max="${maxVolume.toFixed(2)}">
            </div>
            <div style="margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                <strong>持续贸易吞吐量上限 (取决于单次贸易量)</strong><br>
                上限: ${formatNumber(throughputLimit)} 资源/秒<br>
                已用: ${formatNumber(usedThroughput)} 资源/秒<br>
                <span style="font-size: 0.75rem; color: var(--text-dim);">
                    提示：正数=进口，负数=出口。<br>
                </span>
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
        const steadyPrice = TradeEngine.computeSteadyPrice(GameState, r, currentRate);
        
        // 计算相对于基准价的变化百分比
        const baseValue = res.value;
        let priceChangeHtml = '';
        if (baseValue !== undefined && baseValue > 0) {
            const changePercent = (effectivePrice - baseValue) / baseValue * 100;
            if (Math.abs(changePercent) > 0.01) {
                const sign = changePercent > 0 ? '+' : '-';
                const color = changePercent > 0 ? 'var(--red)' : 'var(--accent)';
                priceChangeHtml = `<span style="color: ${color}; margin-left: 0.3rem;">(${sign}${Math.abs(changePercent).toFixed(1)}%)</span>`;
            }
        }

        const goldFlow = TradeEngine.getGoldFlowForResource(GameState, r, currentRate);
        const goldFlowText = goldFlow > 0 ? `+${formatNumber(goldFlow)} 金/秒` : (goldFlow < 0 ? `-${formatNumber(-goldFlow)} 金/秒` : '');

        html += `
            <div class="trade-single-card">
                <div style="font-weight: bold; margin-bottom: 0.3rem;">${r}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    价格: ${effectivePrice.toFixed(2)} 金${priceChangeHtml} |  库存: ${formatNumber(res.amount)} / ${res.cap === Infinity ? "∞" : formatNumber(res.cap)}
                </div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                    <input type="number" class="trade-rate-input" data-resource="${r}"
                           style="width: 120px; background: var(--bg-input); color: var(--text); border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.3rem 0.6rem;"
                           value="${currentRate.toFixed(2)}" step="${Math.floor(GameState.maxTradeVolume*0.0001)}" placeholder="速率">
                    <span style="font-size: 0.85rem;">资源/秒</span>
                    <span class="trade-status-label ${isImport ? 'trade-status-import' : (isExport ? 'trade-status-export' : 'trade-status-idle')}">
                        ${isImport ? '进口' : (isExport ? '出口' : '闲置')}
                    </span>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 0.6rem;">
                    ${goldFlowText}
                </div>
                
                <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.5rem;">
                    <button class="trade-once-buy-btn" data-resource="${r}">购买</button>
                    <button class="trade-once-sell-btn" data-resource="${r}">出售</button>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    panel.innerHTML = html;

    // 恢复滚动位置
    if (scrollTop > 0) {
        if (panel.scrollHeight > panel.clientHeight) {
            panel.scrollTop = scrollTop;
        } else if (panel.parentElement && panel.parentElement.classList.contains('main-content')) {
            // 如果面板本身没有滚动，恢复父级滚动
            panel.parentElement.scrollTop = scrollTop;
        }
    }

    // 绑定事件：自定义贸易量输入
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

    // 持续贸易速率调整
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

    // 手动购买
    document.querySelectorAll('.trade-once-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            const desiredVolume = GameState.userTradeVolume;
            const result = TradeEngine.performOneTimeTrade(GameState, resource, 'buy', desiredVolume);
            if (result.success) {
                addEventLog(`购买 ${formatNumber(result.actualVolume)} ${resource}，消耗 ${formatNumber(result.costGold)} 金。`);
            } else {
                addEventLog(`购买失败：${result.reason}`);
            }
            computeProductionAndCaps();
            renderAll();
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const desiredVolume = GameState.userTradeVolume;
            const actualVolume = TradeEngine.getMaxBuyableVolume(GameState, resource, desiredVolume);
            if (actualVolume <= 0) {
                showTooltip(btn, `无法购买 ${resource}，黄金不足或容量已满`);
                return;
            }
            const cost = TradeEngine.computeBuyCost(GameState, resource, actualVolume);
            showTooltip(btn, `购买 ${formatNumber(actualVolume)} ${resource}<br>消耗 ${formatNumber(cost)} 金<br>`);
        });
    });

    // 手动出售
    document.querySelectorAll('.trade-once-sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            const desiredVolume = GameState.userTradeVolume;
            const result = TradeEngine.performOneTimeTrade(GameState, resource, 'sell', desiredVolume);
            if (result.success) {
                addEventLog(`出售 ${formatNumber(result.actualVolume)} ${resource}，获得 ${formatNumber(result.gainGold)} 金。`);
            } else {
                addEventLog(`出售失败：${result.reason}`);
            }
            computeProductionAndCaps();
            renderAll();
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const desiredVolume = GameState.userTradeVolume;
            const actualVolume = TradeEngine.getMaxSellableVolume(GameState, resource, desiredVolume);
            if (actualVolume <= 0) {
                showTooltip(btn, `无法出售 ${resource}，资源不足或黄金容量已满`);
                return;
            }
            const gain = TradeEngine.computeSellGain(GameState, resource, actualVolume);
            showTooltip(btn, `出售 ${formatNumber(actualVolume)} ${resource}<br>获得 ${formatNumber(gain)} 金<br>`);
        });
    });
}

renderTradePanel = renderTradePanel;