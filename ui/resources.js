// ui/resources.js
function renderResources() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;

    const existingItems = new Map();
    for (const child of bar.children) {
        const resName = child.dataset.resource;
        if (resName) existingItems.set(resName, child);
    }

    for (let r in GameState.resources) {
        const d = GameState.resources[r];
        if (!d.visible) continue;

        let capDisplay = (d.cap === Infinity) ? "∞" : formatNumber(d.cap);
        const content = `${r}: ${formatNumber(d.amount)}/${capDisplay} (${d.production > 0 ? '+' : ''}${formatNumber(d.production)}/s)`;

        let item = existingItems.get(r);
        if (item) {
            item.textContent = content;
        } else {
            item = document.createElement('div');
            item.className = 'resource-item';
            item.dataset.resource = r;
            item.textContent = content;

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
        existingItems.delete(r);
    }

    for (const [resName, elem] of existingItems) {
        elem.remove();
    }
}
window.renderResources = renderResources;