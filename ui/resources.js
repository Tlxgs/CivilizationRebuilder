// ui/resources.js
// 全局更新函数，用于增量更新已有资源项的内容
function updateResourceItem(item, resKey, resData) {
    const amount = resData.amount;
    const cap = resData.cap;
    const capDisplay = cap === Infinity ? "∞" : formatNumber(cap);
    const production = resData.production;

    // 更新数值
    const valueSpan = item.querySelector('.res-value');
    if (valueSpan) {
        valueSpan.textContent = `${formatNumber(amount)}/${capDisplay}`;
    }

    // 更新产量
    const prodSpan = item.querySelector('.res-prod');
    if (prodSpan) {
        if (Math.abs(production) > 1e-9) {
            const sign = production > 0 ? '+' : '';
            prodSpan.textContent = `${sign}${formatNumber(production)}`;
            if(Math.abs(production)>1e-3){
                prodSpan.style.color = production < 0 ? 'var(--red)' : '';
                valueSpan.style.color = production < 0 ? 'var(--red)' : '';
            }
        } else {
            prodSpan.textContent = '';
        }
    }

    // 更新资源名颜色（负产量变红）
    const nameSpan = item.querySelector('.res-name');
    if (nameSpan) {
        nameSpan.style.color = production < 0 ? 'var(--red)' : '';
    }

    // 更新进度条
    let percent = 0;
    if (cap !== Infinity && cap > 0) percent = Math.min(100, (amount / cap) * 100);
    const progressDiv = item.querySelector('.resource-progress');
    if (progressDiv) progressDiv.style.width = `${percent}%`;
}

// 渲染资源面板（增量更新结构 + 内容）
function renderResources() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;

    // 收集当前应当可见的资源
    const visibleResources = [];
    for (let r in GameState.resources) {
        if (GameState.resources[r].visible) {
            visibleResources.push(r);
        }
    }

    // 获取当前已有的资源项元素
    const existingItems = new Map();
    bar.querySelectorAll('.resource-item').forEach(item => {
        const res = item.dataset.resource;
        if (res) existingItems.set(res, item);
    });

    // 1. 移除不再可见的资源项
    for (let [res, item] of existingItems) {
        if (!visibleResources.includes(res)) {
            item.remove();
            existingItems.delete(res);
        }
    }

    // 2. 添加新出现的资源项
    for (let res of visibleResources) {
        if (existingItems.has(res)) {
            // 已存在，更新内容（数据可能有变化）
            const item = existingItems.get(res);
            updateResourceItem(item, res, GameState.resources[res]);
        } else {
            // 创建新资源项
            const resData = GameState.resources[res];
            const amount = resData.amount;
            const cap = resData.cap;
            const capDisplay = cap === Infinity ? "∞" : formatNumber(cap);
            const production = resData.production;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'res-name';
            nameSpan.textContent = res;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'res-value';
            valueSpan.textContent = `${formatNumber(amount)}/${capDisplay}`;

            const prodSpan = document.createElement('span');
            prodSpan.className = 'res-prod';
            if (Math.abs(production) > 1e-9) {
                const sign = production > 0 ? '+' : '';
                prodSpan.textContent = `${sign}${formatNumber(production)}`;
                if (production < 0) prodSpan.style.color = 'var(--red)';
            } else {
                prodSpan.textContent = '';
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'resource-content';
            contentDiv.appendChild(nameSpan);
            contentDiv.appendChild(valueSpan);
            contentDiv.appendChild(prodSpan);

            const progressDiv = document.createElement('div');
            progressDiv.className = 'resource-progress';
            let percent = 0;
            if (cap !== Infinity && cap > 0) percent = Math.min(100, (amount / cap) * 100);
            progressDiv.style.width = `${percent}%`;

            const item = document.createElement('div');
            item.className = 'resource-item';
            item.dataset.resource = res;
            item.appendChild(progressDiv);
            item.appendChild(contentDiv);

            // 绑定 tooltip
            item.addEventListener('mouseenter', () => {
                const resName = item.dataset.resource;
                const resData = GameState.resources[resName];
                if (!resData) return;

                let tooltipHtml = `<strong>${resName}</strong><hr>`;
                const contributions = getResourceContributions(resName);
                if (contributions.length === 0) {
                    tooltipHtml += `无`;
                } else {
                    const THRESHOLD = 20;
                    if (contributions.length > THRESHOLD) {
                        const mid = Math.ceil(contributions.length / 2);
                        const leftCol = contributions.slice(0, mid);
                        const rightCol = contributions.slice(mid);
                        tooltipHtml += `<div style="display: flex; gap: 1.5rem; margin-top: 0.25rem;">`;
                        tooltipHtml += `<div style="min-width: 150px;">`;
                        for (let contrib of leftCol) {
                            const sign = contrib.value > 0 ? '+' : '';
                            tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                        tooltipHtml += `</div><div style="min-width: 150px;">`;
                        for (let contrib of rightCol) {
                            const sign = contrib.value > 0 ? '+' : '';
                            tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                        tooltipHtml += `</div></div>`;
                    } else {
                        for (let contrib of contributions) {
                            const sign = contrib.value > 0 ? '+' : '';
                            tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                        }
                    }
                }

                // 填满/耗尽时间
                const prod = resData.production;
                const current = resData.amount;
                const maxCap = resData.cap;
                if (Math.abs(prod) > 1e-9 && maxCap !== Infinity) {
                    if (prod > 0) {
                        const remaining = maxCap - current;
                        if (remaining > 0) {
                            const seconds = remaining / prod;
                            tooltipHtml += `<hr>预计填满: ${formatTime(seconds)}</span>`;
                        } else {
                            tooltipHtml += `<hr><span>已满</span>`;
                        }
                    } else if (prod < 0) {
                        const remaining = current;
                        if (remaining > 0) {
                            const seconds = remaining / (-prod);
                            tooltipHtml += `<hr>预计耗尽: ${formatTime(seconds)}</span>`;
                        } else {
                            tooltipHtml += `<hr><span>已耗尽</span>`;
                        }
                    }
                }

                showTooltip(item, tooltipHtml);
            });

            bar.appendChild(item);
            existingItems.set(res, item);
        }
    }
}

renderResources = renderResources;