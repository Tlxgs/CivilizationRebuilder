// 聚合渲染总入口
function renderAll() {

    renderActionsPanel();
    renderBuildingPanel();
    renderTechPanel();
    renderPolicyPanel();
    renderPermanentPanel();
    renderAchievementsPanel();
    renderResetPanel();
    renderTradePanel();
    renderChangelogPanel();
    renderLogPanel();
    renderCrystalPanel();
    renderPopulationInfo(); 
    renderQueue();
    updateTabsVisibility();
}


/**
 * 创建响应式属性
 * @param {Object} obj - 目标对象
 * @param {string} prop - 属性名
 * @param {Function} onUpdate - 值变化时的回调
 */
function makeReactive(obj, prop, onUpdate) {
    let _value = obj[prop];
    
    Object.defineProperty(obj, prop, {
        get() {
            return _value;
        },
        set(newValue) {
            if (_value !== newValue) {
                _value = newValue;
                onUpdate(newValue);
            }
        },
        configurable: true,
        enumerable: true
    });
}
// ========== 资源 DOM 创建 ==========
function createResourceElement(resourceName) {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;

    // 检查是否已存在
    if (document.querySelector(`.resource-item[data-resource="${resourceName}"]`)) return;

    const resData = GameState.resources[resourceName];
    const amount = resData.amount;
    const cap = resData.cap;
    const capDisplay = cap === Infinity ? "∞" : formatNumber(cap);
    const production = resData.production;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'res-name';
    nameSpan.textContent = resourceName;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'res-value';
    valueSpan.textContent = `${formatNumber(amount)}/${capDisplay}`;

    const prodSpan = document.createElement('span');
    prodSpan.className = 'res-prod';
    if (Math.abs(production) > 1e-9) {
        const sign = production > 0 ? '+' : '';
        prodSpan.textContent = `${sign}${formatNumber(production)}`;
        if (production < 0) prodSpan.style.color = 'var(--red)';
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
    item.dataset.resource = resourceName;
    item.appendChild(progressDiv);
    item.appendChild(contentDiv);

    // 绑定 tooltip（含资源贡献列表 + 预计满仓/耗尽时间）
    item.addEventListener('mouseenter', () => {
        const contributions = getResourceContributions(resourceName);
        let tooltipHtml = `<strong>${resourceName}</strong><hr>`;

        if (contributions.length === 0) {
            tooltipHtml += `无`;
        } else {
            const THRESHOLD = 30;
            if (contributions.length > THRESHOLD) {
                const mid = Math.ceil(contributions.length / 2);
                const leftCol = contributions.slice(0, mid);
                const rightCol = contributions.slice(mid);
                tooltipHtml += `<div style="display: flex; gap: 1rem; margin-top: 0.25rem;">`;
                tooltipHtml += `<div style="min-width: 150px;">`;
                for (let contrib of leftCol) {
                    const sign = contrib.value > 0 ? '+' : '';
                    tooltipHtml += `${contrib.building}: ${sign}${formatNumber(contrib.value)}/s<br>`;
                }
                tooltipHtml += `</div><div style="min-width: 120px;">`;
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

        // ---- 新增：预计满仓/耗尽时间 ----
        const res = GameState.resources[resourceName];
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
                // 生产/消耗为 0
                if (curCap !== Infinity && curAmount >= curCap - 1e-9) {
                    timeInfo = `<hr>已满`;
                } else if (curAmount <= 1e-9) {
                    timeInfo = `<hr>已耗尽`;
                } else {
                    timeInfo = `<hr>`;
                }
            }
            tooltipHtml += timeInfo;
        }

        showTooltip(item, tooltipHtml);
    });

    bar.appendChild(item);
}

function removeResourceElement(resourceName) {
    const item = document.querySelector(`.resource-item[data-resource="${resourceName}"]`);
    if (item) item.remove();
}

function ensureResourceElement(resourceName) {
    if (!document.querySelector(`.resource-item[data-resource="${resourceName}"]`)) {
        createResourceElement(resourceName);
    }
}

// ========== 资源数量响应式 ==========
function updateResourceDisplay(resourceName) {
    const item = document.querySelector(`.resource-item[data-resource="${resourceName}"]`);
    if (!item) return;
    
    const res = GameState.resources[resourceName];
    const capDisplay = res.cap === Infinity ? "∞" : formatNumber(res.cap);
    
    const valueSpan = item.querySelector('.res-value');
    if (valueSpan) {
        valueSpan.textContent = `${formatNumber(res.amount)}/${capDisplay}`;
    }
    
    // 更新进度条
    let percent = 0;
    if (res.cap !== Infinity && res.cap > 0) {
        percent = Math.min(100, (res.amount / res.cap) * 100);
    }
    const progressDiv = item.querySelector('.resource-progress');
    if (progressDiv) progressDiv.style.width = `${percent}%`;
    
    // 更新产量显示
    const prodSpan = item.querySelector('.res-prod');
    if (prodSpan) {
        if (Math.abs(res.production) > 1e-9) {
            const sign = res.production > 0 ? '+' : '';
            prodSpan.textContent = `${sign}${formatNumber(res.production)}`;
            if (res.production < 0) prodSpan.style.color = 'var(--red)';
        } else {
            prodSpan.textContent = '';
        }
    }
}

function updateResourceVisibility(resourceName, visible) {
    if (visible) {
        ensureResourceElement(resourceName);
    } else {
        removeResourceElement(resourceName);
    }
}

function makeResourceReactive(resourceName) {
    const res = GameState.resources[resourceName];
    if (!res) return;
    
    makeReactive(res, 'amount', () => updateResourceDisplay(resourceName));
    makeReactive(res, 'cap', () => updateResourceDisplay(resourceName));
    makeReactive(res, 'production', () => updateResourceDisplay(resourceName));
    makeReactive(res, 'visible', (newVisible) => updateResourceVisibility(resourceName, newVisible));
}

// ========== 批量初始化所有资源 ==========
function initAllResourcesReactive() {
    for (let r in GameState.resources) {
        makeResourceReactive(r);
        // 如果资源初始可见，立即创建 DOM
        if (GameState.resources[r].visible) {
            createResourceElement(r);
        }
    }
}

// ========== 幸福度响应式 ==========
function getHappinessTooltipHtml(state) {
    const happiness = state.happiness;
    const breakdown = EffectsManager.getHappinessBreakdown();
    const softCap = Formulas.calcHappinessSoftCapBase(state);
    const effectiveHappiness = Formulas.calcHappinessSoftCap(happiness, state);
    
    let tooltipHtml = '<strong>幸福度组成</strong><br>基础: 100%<br>';
    if (breakdown.length === 0) {
        tooltipHtml += '无额外加成';
    } else {
        for (let c of breakdown) {
            const sign = c.value > 0 ? '+' : '';
            tooltipHtml += `${c.sourceName}: ${sign}${c.value.toFixed(2)}%<br>`;
        }
    }
    
    tooltipHtml += `<br><strong>总计: ${happiness.toFixed(1)}%</strong>(软上限: ${softCap.toFixed(1)}%)`;
    
    if (happiness > softCap) {
        tooltipHtml += `<br>有效幸福度: ${effectiveHappiness.toFixed(1)}% `;
    }
    
    return tooltipHtml;
}

function updateHappinessDisplay(value) {
    const el = document.getElementById('happiness-display');
    if (!el) return;
    
    const effectiveHappiness = Formulas.calcHappinessSoftCap(value, GameState);
    el.textContent = `😊 幸福度: ${effectiveHappiness.toFixed(1)}%`;
    
    // 重新绑定 tooltip
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
    
    newEl.addEventListener('mouseenter', () => {
        const tooltipHtml = getHappinessTooltipHtml(GameState);
        showTooltip(newEl, tooltipHtml);
    });
}

function initReactiveHappiness() {
    updateHappinessDisplay(GameState.happiness);
    makeReactive(GameState, 'happiness', updateHappinessDisplay);
}

// ========== 总初始化入口 ==========
function initAllReactive() {
    initAllResourcesReactive();  // 资源响应式（自动创建 DOM）
    initReactiveHappiness();     // 幸福度响应式
}