// ui/trade.js
function renderTradePanel() {
    const panel = document.getElementById('panel-trade');
    const market = GameState.buildings["市场"];
    const marketUnlocked = market && market.visible;
    
    if (!marketUnlocked) {
        panel.innerHTML = '<p>暂未解锁</p>';
        return;
    }
    
    const volume = getMarketTradeVolume();
    let html = `<div style="margin-bottom:10px;">当前交易量: ${formatNumber(volume)} 金等值/次<br>`;
    html += `提示: 增加市场激活数量来提高单次交易量。</div>`;
    html += '<div class="trade-grid">';
    
    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (r === "金") continue;
        if (res.value === undefined) continue;
        if (!res.visible && res.amount === 0) continue;
        
        const heat = res.heat || 1;
        const buyCost = volume * heat;
        const buyGet = volume / res.value;
        const sellGet = volume * heat * 0.8;
        const sellCost = volume / res.value;
        
        html += `<div class="trade-card">
            <div class="trade-name"><strong>${r}</strong> <span style="font-size:0.8rem;"></span></div>
            <div class="trade-buttons">
                <button class="trade-buy-btn" data-resource="${r}">买 ${formatNumber(buyGet)} ${r} (${formatNumber(buyCost)} 金)</button>
                <button class="trade-sell-btn" data-resource="${r}">卖 ${formatNumber(sellCost)} ${r} (${formatNumber(sellGet)} 金)</button>
            </div>
        </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
    
    document.querySelectorAll('.trade-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            if (buyResource(resource)) {
                renderAll();
            } 
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const res = GameState.resources[resource];
            const volume = getMarketTradeVolume();
            const heat = res.heat || 1;
            const buyCost = volume * heat;
            const buyGet = volume / res.value;
            showTooltip(btn, `购买 ${formatNumber(buyGet)} ${resource}<br>消耗 ${formatNumber(buyCost)} 金<br>`);
        });
    });
    document.querySelectorAll('.trade-sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const resource = btn.dataset.resource;
            if (sellResource(resource)) {
                renderAll();
            }
        });
        btn.addEventListener('mouseenter', () => {
            const resource = btn.dataset.resource;
            const res = GameState.resources[resource];
            const volume = getMarketTradeVolume();
            const heat = res.heat || 1;
            const sellGet = volume * heat * 0.8;
            const sellCost = volume / res.value;
            showTooltip(btn, `出售 ${formatNumber(sellCost)} ${resource}<br>获得 ${formatNumber(sellGet)} 金<br>`);
        });
    });
}
window.renderTradePanel = renderTradePanel;