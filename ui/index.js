// ui/index.js — Vue 应用装配入口
// 职责：定义 no-op 兼容桩（旧引擎仍调用 renderAll/refreshUI 等）、装配 Vue 应用、挂载到 #app。
(function () {
    const { createApp } = Vue;

    // ---------- no-op 兼容桩 ----------
    // 旧引擎代码（core/logic/queue/saveLoad/gameloop/debug/main）仍会调用这些渲染函数。
    // UI 已完全由 Vue 响应式驱动（GameState 为响应式代理），桩函数保证调用安全且不重复渲染。
    const noopNames = [
        // 引擎实际调用的渲染入口
        'renderAll', 'refreshUI', 'renderQueue', 'renderLogPanel',
        // 旧 UI 模块中的渲染函数（不再被引擎调用，但保留兼容）
        'refreshResourceBars', 'refreshLocalResourcesDisplay', 'updateTabsVisibility',
        'renderActionsPanel', 'renderBuildingPanel', 'refreshBuildingPanel',
        'renderTechPanel', 'refreshTechPanel', 'refreshUpgradePanel',
        'renderPolicyPanel', 'renderPermanentPanel', 'refreshPermanentPanel',
        'renderAchievementsPanel', 'renderResetPanel', 'renderTradePanel',
        'refreshTradePanel', 'renderChangelogPanel', 'renderCrystalPanel',
        'renderPopulationInfo',
        // 旧响应式/事件系统（已被 Vue 取代）
        'ensureResourceElement', 'createResourceElement', 'removeResourceElement',
        'updateResourceDisplay', 'updateResourceVisibility', 'updateHappinessDisplay',
        'initAllReactive', 'makeReactive', 'bindEvents', 'switchBuildingClass',
    ];
    noopNames.forEach(name => {
        if (typeof window[name] === 'undefined') {
            window[name] = function () {};
        }
    });

    // 主题状态同步（body 类由 main.js 预先设置）
    UI.state.theme = (localStorage.getItem('theme') || 'light');

    // ---------- 装配并挂载 Vue 应用 ----------
    function mountGameUI() {
        const app = createApp(UI.components['GameApp']);

        // 全局 mixin：向所有组件暴露游戏状态（GS）与 UI 状态（ui）
        app.mixin({
            data() {
                return {
                    GS: GameState,   // 游戏状态（Vue 响应式代理）
                    ui: UI.state,    // UI 状态（响应式）
                };
            },
        });

        // 注册 v-tooltip 指令
        app.directive('tooltip', UI.tooltipDirective);

        // 注册全部子组件（GameApp 已作为根组件传入 createApp）
        for (let name in UI.components) {
            if (name !== 'GameApp') {
                app.component(name, UI.components[name]);
            }
        }

        app.mount('#app');
    }

    window.mountGameUI = mountGameUI;
})();
