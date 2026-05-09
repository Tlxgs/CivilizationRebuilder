// ui/achievements.js
function renderAchievementsPanel() {
    const panel = document.getElementById('panel-achievements');
    if (!panel) return console.error('成就面板不存在');

    // 统计成就完成情况
    let totalAchievements = 0;
    let completedAchievements = 0;
    if (ACHIEVEMENTS_CONFIG) {
        totalAchievements = ACHIEVEMENTS_CONFIG.length;
        for (let achCfg of ACHIEVEMENTS_CONFIG) {
            if (GameState.achievements[achCfg.id]) {
                completedAchievements++;
            }
        }
    }

    const achievements = GameState.achievements || {};
    let html = '';

    // 完成率
    html += `<div style="margin-bottom: 1rem; font-weight: bold; color: var(--accent);">
        🏆 已完成 ${completedAchievements}/${totalAchievements}
    </div>`;

    const achievementEntries = Object.entries(achievements);
    if (achievementEntries.length === 0) {
        html += '<p style="color: var(--text-secondary);">暂无解锁的成就。</p>';
    } else {
        html += '<div style="display: flex; flex-wrap: wrap; gap: 1rem;">';
        for (const [id, ach] of achievementEntries) {
            html += `
                <div class="achievement-card" data-ach-id="${id}" style="background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 0.8rem; padding: 0.8rem; min-width: 200px; color: var(--text); box-shadow: 0 2px 6px var(--shadow); cursor: default;">
                    <div style="font-weight: bold; font-size: 1rem; color: var(--accent);">🏆 ${ach.name}</div>
                    <div style="font-size: 0.85rem; margin: 6px 0; color: var(--text-secondary);">${ach.effectText || ''}</div>
                </div>
            `;
        }
        html += '</div>';
    }
    panel.innerHTML = html;

    // 绑定 tooltip（悬浮显示成就描述）
    panel.querySelectorAll('.achievement-card').forEach(card => {
        const achId = card.dataset.achId;
        const cfg = ACHIEVEMENTS_CONFIG ? ACHIEVEMENTS_CONFIG.find(a => a.id === achId) : null;
        if (!cfg) return;
        const tooltipText = `<strong>${cfg.name}</strong><br>${cfg.desc}`;
        card.addEventListener('mouseenter', () => {
            showTooltip(card, tooltipText);
        });
    });
}