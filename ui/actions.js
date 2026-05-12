const actionMetaList = [
    {
        id: 'toggle_speed',
        text: () => GameState.speed === 2 ? '恢复1倍速' : '开启2倍速',
        tooltip: () => GameState.speed === 2
            ? '恢复1倍速游戏'
            : `消耗时间晶体开启2倍速\n当前时间晶体: ${formatNumber(GameState.resources['时间晶体']?.amount || 0)}`,
        condition: () => GameState.speed === 2 || (GameState.resources['时间晶体']?.amount || 0) >= 0.1
    },
    { id: 'collect_wood', text: '收集木头', tooltip: '立即获得 +1 木头' },
    { id: 'collect_stone', text: '收集石头', tooltip: '立即获得 +1 石头' },
    { id: 'war', text: '发动战争', tooltip: '消耗所有军备，随机获得晶体。消耗的军备越多，越容易获得高品质晶体', condition: () => GameState.techs["军事理论"]?.researched },
    { id: 'nuke_reset', text: '发射核弹', tooltip: '重置并获遗物', condition: () => GameState.techs["曼哈顿计划"]?.researched },
    { id: 'vacuum_decay', text: '真空衰变', tooltip: '重置获更多遗物与暗能量', condition: () => GameState.techs["真空衰变"]?.researched },
    { id: 'symbiote_reset', text: '共生重置', tooltip: '与外星微生物共生，获得大量遗物和孢子', condition: () => GameState.techs["生物移植"]?.researched },
    { id: 'singularity_reset', text: '奇点重置', tooltip: '巨大的能量撕裂了时空，重置获取遗物、暗物质和奇点', condition: () => GameState.techs["奇点转换"]?.researched }
];

function renderActionsPanel() {
    const container = document.getElementById('actions-panel');
    let html = '<h3>行动</h3><div class="action-buttons">';
    
    // 手动遍历 meta 列表，以便在 war 后插入额外内容
    for (let meta of actionMetaList) {
        if (meta.condition && !meta.condition()) continue;
        const btnText = typeof meta.text === 'function' ? meta.text() : meta.text;
        html += `<button class="action-btn" data-action="${meta.id}">${btnText}</button>`;
        
        // 如果是战争按钮，并且永久升级“自动战争”已研究，则添加复选框
        if (meta.id === 'war') {
            const permAutoWar = GameState.permanent["自动战争"]?.researched;
            if (permAutoWar) {
                const checked = GameState.autoWarEnabled ? 'checked' : '';
                html += `<div style="margin: 4px 0 8px 12px; font-size: 0.85rem;">
                            <label>
                                <input type="checkbox" id="auto-war-checkbox" ${checked}> 
                                自动战争（军备满时自动发动）
                            </label>
                         </div>`;
            }
        }
    }
    html += '</div>';
    container.innerHTML = html;
    
    // 绑定复选框变更事件
    const autoWarCheck = document.getElementById('auto-war-checkbox');
    if (autoWarCheck) {
        autoWarCheck.addEventListener('change', (e) => {
            GameState.autoWarEnabled = e.target.checked;
            saveGame();
        });
    }
    document.querySelectorAll('.action-btn').forEach(btn => {
        const meta = actionMetaList.find(m => m.id === btn.dataset.action);
        if (meta) {
            btn.addEventListener('mouseenter', () => {
                const tip = typeof meta.tooltip === 'function' ? meta.tooltip() : meta.tooltip;
                showTooltip(btn, tip);
            });
        }
    });
}