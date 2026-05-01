// ui/achievements.js
function renderAchievementsPanel() {
    const panel = document.getElementById('panel-achievements');
    if (!panel) return console.error('成就面板不存在');

    const achievements = GameState.achievements || {};
    const list = Object.values(achievements);

    if (list.length === 0) {
        panel.innerHTML = '<p style="color: var(--text-secondary);">暂无解锁的成就。</p>';
        return;
    }

    let html = '<div style="display: flex; flex-wrap: wrap; gap: 1rem;">';
    for (const ach of list) {
        let effectText = '';
        if (ach.effect) {
            if (ach.effect.globalScienceProd) effectText = `科学产量 +${(ach.effect.globalScienceProd * 100).toFixed(0)}%`;
            else if (ach.effect.globalCost) effectText = `建筑成本蠕变 ${(ach.effect.globalCost * 100).toFixed(0)}%`;
            else if (ach.effect.globalProd) effectText = `全局产量 +${(ach.effect.globalProd * 100).toFixed(0)}%`;
            else effectText = '永久加成';
        } else effectText = '效果缺失';

        // 使用 CSS 变量，自动适配浅色/深色主题
        html += `
            <div style="background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 0.8rem; padding: 0.8rem; min-width: 200px; color: var(--text); box-shadow: 0 2px 6px var(--shadow);">
                <div style="font-weight: bold; font-size: 1rem; color: var(--accent);">🏆 ${ach.name}</div>
                <div style="font-size: 0.85rem; margin: 6px 0; color: var(--text-secondary);">${effectText}</div>
            </div>
        `;
    }
    html += '</div>';
    panel.innerHTML = html;
}

window.renderAchievementsPanel = renderAchievementsPanel;