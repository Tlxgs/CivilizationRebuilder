// ui/actions.js — 行动面板组件
(function () {
    // 行动按钮元数据（与原版 ui/actions.js 一致）
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
        { id: 'singularity_reset', text: '奇点重置', tooltip: '巨大的能量撕裂了时空，重置获取遗物、暗物质和奇点', condition: () => GameState.techs["奇点转换"]?.researched },
        { id: 'conscious_reset', text: '意识上传', tooltip: '将全人类的意识上传到高维计算机中。', condition: () => GameState.techs["意识上传"]?.researched }
    ];

    const ActionsPanel = {
        template: `
<div id="actions-panel" class="actions-panel">
    <h3>行动</h3>
    <div class="action-buttons">
        <template v-for="meta in visibleActions" :key="meta.id">
            <button class="action-btn" :data-action="meta.id" @click="perform(meta.id)" v-tooltip="() => actionTooltip(meta)">{{ actionText(meta) }}</button>
            <!-- 战争按钮后附加自动战争开关（永久升级“自动战争”已研究时） -->
            <div v-if="meta.id === 'war' && autoWarAvailable" style="margin: 4px 0 8px 12px; font-size: 0.85rem;">
                <label>
                    <input type="checkbox" :checked="GS.autoWarEnabled" @change="toggleAutoWar">
                    自动战争（军备满时自动发动）
                </label>
            </div>
        </template>
    </div>
</div>
`,
        computed: {
            visibleActions() {
                return actionMetaList.filter(m => !m.condition || m.condition());
            },
            autoWarAvailable() {
                return this.GS.permanent["自动战争"]?.researched;
            },
        },
        methods: {
            perform(id) {
                Core.performAction(id);
            },
            actionText(meta) {
                return typeof meta.text === 'function' ? meta.text() : meta.text;
            },
            actionTooltip(meta) {
                return typeof meta.tooltip === 'function' ? meta.tooltip() : meta.tooltip;
            },
            toggleAutoWar(e) {
                this.GS.autoWarEnabled = e.target.checked;
                saveGame();
            },
        },
    };
    UI.registerComponent('ActionsPanel', ActionsPanel);
})();
