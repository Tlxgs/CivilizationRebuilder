// queue.js — 购买队列管理

// 获取项目的显示名称（用于日志）
function getQueueItemDisplayName(item) {
    switch (item.type) {
        case 'building':
            return `${item.id}`;
        case 'tech':
            return `${item.id}`;
        case 'upgrade':
            return `${item.id}`;
        case 'permanent':
            return `${item.id}`;
        default:
            return `${item.id}`;
    }
}

function addToQueue(type, id) {
    if (!Array.isArray(GameState.queue)) GameState.queue = [];
    if (GameState.queue.length >= 5) {
        addEventLog('队列已满（最多5项）');
        return false;
    }
    if (type === 'tech' && GameState.techs[id] && GameState.techs[id].researched) {
        addEventLog('该科技已研究，无法加入队列');
        return false;
    }
    if (type === 'tech')
    {
        let i = 0;
        while(i<GameState.queue.length){
            const item = GameState.queue[i];
            if (item.id == id)return false;
            i++;
        }
    }
    if (type === 'permanent' && GameState.permanent[id] && GameState.permanent[id].researched) {
        addEventLog('该永恒升级已研究，无法加入队列');
        return false;
    }
    GameState.queue.push({ type, id });
    addEventLog(`已加入队列：${getQueueItemDisplayName({ type, id })}`);
    renderQueue();
    renderLogPanel();
    return true;
}

function removeFromQueue(index) {
    const item = GameState.queue[index];
    GameState.queue.splice(index, 1);
    addEventLog(`已从队列移除：${getQueueItemDisplayName(item)}`);
    renderQueue();
    renderLogPanel();
}
function clearQueue() {
    if (!Array.isArray(GameState.queue)) {
        GameState.queue = [];
        return;
    }
    GameState.queue = [];
    renderAll();
}
function processQueue() {
    if (!GameState.queue || GameState.queue.length === 0) return;

    // 保存旧队列用于对比
    const oldLength = GameState.queue.length;
    let completedItems = [];   // 记录完成的项目

    let i = 0;
    while (i < GameState.queue.length) {
        const item = GameState.queue[i];
        let success = false;
        switch (item.type) {
            case 'building':
                success = Core.buyBuilding(item.id, 1);
                break;
            case 'tech':
                success = Core.researchTech(item.id)||(GameState.techs[item.id].researched);
                break;
            case 'upgrade':
                success = Core.buyUpgrade(item.id);
                break;
            case 'permanent':
                success = Core.buyPermanent(item.id);
                break;
        }
        if (success) {
            completedItems.push(item);   // 记录完成
            GameState.queue.splice(i, 1);
        } else {
            i++;
        }
    }

    // 轻量刷新
    ProductionEngine.computeProductionAndCaps();
    updateBuildingPrices();
    updateUpgradePrices();
    refreshAllDynamicColors();
    renderQueue();
    renderLogPanel();

    // 若有完成的项目，汇总记录
    if (completedItems.length > 0) {
        const names = completedItems.map(getQueueItemDisplayName).join('、');
        addEventLog(`✅ 队列完成：${names}`);
    }
}

// 挂载到全局
window.addToQueue = addToQueue;
window.removeFromQueue = removeFromQueue;
window.processQueue = processQueue;
window.clearQueue = clearQueue;