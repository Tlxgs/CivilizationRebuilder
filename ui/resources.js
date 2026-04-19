// ui/resources.js
function renderResources() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;
    bar.innerHTML = '';  // 清空，完全重绘

    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (!res.visible) continue;

        const amount = res.amount;
        const cap = res.cap;
        const capDisplay = (cap === Infinity) ? "∞" : formatNumber(cap);
        const production = res.production;
        const prodText = (production > 0 ? '+' : '') + formatNumber(production);
        const text = `${r}: ${formatNumber(amount)}/${capDisplay} (${prodText}/s)`;

        // 计算进度百分比（上限无限时进度为0）
        let percent = 0;
        if (cap !== Infinity && cap > 0) {
            percent = Math.min(100, (amount / cap) * 100);
        }

        // 创建卡片容器
        const item = document.createElement('div');
        item.className = 'resource-item';
        item.dataset.resource = r;

        // 进度条元素
        const progressDiv = document.createElement('div');
        progressDiv.className = 'resource-progress';
        progressDiv.style.width = `${percent}%`;

        // 文本元素
        const textDiv = document.createElement('div');
        textDiv.className = 'resource-text';
        textDiv.textContent = text;

        item.appendChild(progressDiv);
        item.appendChild(textDiv);

        // tooltip 显示资源详细贡献
        item.addEventListener('mouseenter', () => {
            const resName = item.dataset.resource;
            const resData = GameState.resources[resName];
            if (!resData) return;

            let tooltipHtml = `<strong>${resName}</strong><br>`;
            tooltipHtml += `当前: ${formatNumber(resData.amount)} / ${resData.cap === Infinity ? "∞" : formatNumber(resData.cap)}<br>`;
            tooltipHtml += `净产量: ${resData.production > 0 ? '+' : ''}${formatNumber(resData.production)}/秒<br><br>`;
            tooltipHtml += `<strong>各建筑贡献</strong><br>`;

            const contributions = getResourceContributions(resName);
            if (contributions.length === 0) {
                tooltipHtml += `无`;
            } else {
                for (let contrib of contributions) {
                    const sign = contrib.value > 0 ? '+' : '';
                    tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/秒<br>`;
                }
            }
            showTooltip(item, tooltipHtml);
        });

        bar.appendChild(item);
    }
}
window.renderResources = renderResources;