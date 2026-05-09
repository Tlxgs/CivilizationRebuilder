// ui/queue.js — 队列界面
function renderQueue() {
    const container = document.getElementById('queue-container');
    if (!container) return;
    const queue = GameState.queue || [];
    if (queue.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); padding: 0.5rem;">队列为空</div>';
        return;
    }
    let html = '<div style="font-weight: bold; margin-bottom: 0.5rem;">📋 购买队列</div>';
    queue.forEach((item, index) => {
        let costMap = null;
        switch (item.type) {
            case 'building':
                const bld = GameState.buildings[item.id];
                if (bld) costMap = bld.price;
                break;
            case 'tech':
                const tech = GameState.techs[item.id];
                if (tech && !tech.researched) costMap = tech.price;
                break;
            case 'upgrade':
                const up = GameState.upgrades[item.id];
                if (up && up.visible) costMap = up.price;
                break;
            case 'permanent':
                const perm = GameState.permanent[item.id];
                if (perm && !perm.researched) costMap = perm.price;
                break;
        }
        
        let timeText = '';
        if (costMap) {
            // 检查是否有资源上限不足
            let capInsufficient = false;
            for (let r in costMap) {
                const needed = costMap[r];
                const cap = ResourcesManager.getCap(r);
                if (needed > cap) {
                    capInsufficient = true;
                    break;
                }
            }
            if (capInsufficient) {
                timeText = `<span style="font-size:0.7rem; color:var(--red); margin-left:8px;">⛔</span>`;
            } else {
                const { maxTime, allPossible } = ResourcesManager.getTimeToAfford(costMap);
                if (allPossible && isFinite(maxTime)) {
                    timeText = `<span style="font-size:0.7rem; color:var(--text-secondary); margin-left:8px;">${formatTime(maxTime)}</span>`;
                } else if (!allPossible) {
                    timeText = `<span style="font-size:0.7rem; color:var(--red); margin-left:8px;"></span>`;
                } 
            }
        }

        html += `<div class="queue-item">
            <span>${item.type === 'building' ? '🏗️' : item.type === 'tech' ? '📚' : item.type === 'upgrade' ? '⬆️' : '⭐'} ${item.id}${timeText}</span>
            <button class="queue-remove-btn" data-index="${index}">✕</button>
        </div>`;
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.queue-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            removeFromQueue(idx);
        });
    });
}
window.renderQueue = renderQueue;