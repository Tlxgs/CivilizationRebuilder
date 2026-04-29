// ui/resources.js
function renderResources() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;
    bar.innerHTML = '';

    for (let r in GameState.resources) {
        const res = GameState.resources[r];
        if (!res.visible) continue;

        const amount = res.amount;
        const cap = res.cap;
        const capDisplay = (cap === Infinity) ? "∞" : formatNumber(cap);
        const production = res.production;
        const prodText = (production > 0 ? '+' : '') + formatNumber(production);

        // 构建显示文本，若无产量则隐藏产出部分
        let text = `${r}: ${formatNumber(amount)}/${capDisplay}`;
        if (Math.abs(production) > 1e-9) {
            text += ` (${prodText}/s)`;
        }

        let percent = 0;
        if (cap !== Infinity && cap > 0) {
            percent = Math.min(100, (amount / cap) * 100);
        }

        const item = document.createElement('div');
        item.className = 'resource-item';
        item.dataset.resource = r;

        const progressDiv = document.createElement('div');
        progressDiv.className = 'resource-progress';
        progressDiv.style.width = `${percent}%`;

        const textDiv = document.createElement('div');
        textDiv.className = 'resource-text';
        textDiv.textContent = text;

        item.appendChild(progressDiv);
        item.appendChild(textDiv);

        item.addEventListener('mouseenter', () => {
            const resName = item.dataset.resource;
            const resData = GameState.resources[resName];
            if (!resData) return;

            let tooltipHtml = `<strong>${resName}</strong><br>`;
            tooltipHtml += `当前: ${formatNumber(resData.amount)} / ${resData.cap === Infinity ? "∞" : formatNumber(resData.cap)}<br>`;
            if (Math.abs(resData.production) > 1e-9) {
                const sign = resData.production > 0 ? '+' : '';
                tooltipHtml += `净产量: ${sign}${formatNumber(resData.production)}/秒<br><br>`;
            } else {
                tooltipHtml += `<br>`;
            }
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