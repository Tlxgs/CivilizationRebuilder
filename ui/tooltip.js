// ui/tooltip.js — 全局 Tooltip 宿主组件
// 由 v-tooltip 指令驱动，渲染在应用根部（position: fixed），复刻原版 showTooltip 行为。
(function () {
    const TooltipHost = {
        template: `
<div id="game-tooltip" class="tooltip" v-show="ui.tooltip.visible"
     :style="{ left: ui.tooltip.x + 'px', top: ui.tooltip.y + 'px' }"
     v-html="ui.tooltip.html"></div>
`,
    };
    UI.registerComponent('TooltipHost', TooltipHost);
})();
