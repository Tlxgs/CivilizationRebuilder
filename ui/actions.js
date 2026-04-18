const actionMetaList = [
    { id: 'collect_wood', text: '收集木头', tooltip: '立即获得 +1 木头' },
    { id: 'collect_stone', text: '收集石头', tooltip: '立即获得 +1 石头' },
    { id: 'research_tech', text: '研究科技', tooltip: '立即获得 +1 科学' },
    { id: 'war', text: '发动战争', tooltip: '消耗所有军备，随机获得晶体', condition: () => GameState.techs["军事理论"]?.researched },
    { id: 'nuke_reset', text: '发射核弹', tooltip: '重置并获遗物', condition: () => GameState.techs["曼哈顿计划"]?.researched },
    { id: 'vacuum_decay', text: '真空衰变', tooltip: '重置获更多遗物与暗能量', condition: () => GameState.techs["真空衰变"]?.researched },
];

function renderActionsPanel() {
    const container = document.getElementById('actions-panel');
    let html = '<h3>行动</h3><div class="action-buttons">';
    actionMetaList.forEach(meta => {
        if (meta.condition && !meta.condition()) return;
        html += `<button class="action-btn" data-action="${meta.id}">${meta.text}</button>`;
    });
    html += '</div>';
    container.innerHTML = html;
    document.querySelectorAll('.action-btn').forEach(btn => {
        const meta = actionMetaList.find(m => m.id === btn.dataset.action);
        if (meta) btn.addEventListener('mouseenter', () => showTooltip(btn, meta.tooltip));
    });
}
window.renderActionsPanel = renderActionsPanel;