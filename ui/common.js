// ui/common.js — UI 层公共基础设施（Vue 3）
// 提供全局 UI 状态、修饰键、Tooltip、公共工具函数与组件注册表。
(function () {
    const { reactive, nextTick } = Vue;

    // ---------- 全局 UI 状态（响应式） ----------
    const state = reactive({
        currentTab: 'building',            // 当前主选项卡
        currentBuildingClass: null,        // 建筑面板当前大分类
        currentTechSubTab: 'tech',         // 科技面板子选项卡（tech/challenge/upgrade）
        hoveredBuilding: null,             // 当前悬停的建筑（用于资源高亮联动）
        hoveredResource: null,             // 当前悬停的资源（用于建筑高亮联动）
        tooltip: { visible: false, x: 0, y: 0, html: '' },
        importModalOpen: false,
        theme: 'light',                    // 主题（由 reset 面板切换）
        modifiers: { shift: false, ctrl: false },
    });

    // ---------- 键盘修饰键监听（Shift=×10, Ctrl=×100, Shift+Ctrl=×1000） ----------
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') state.modifiers.shift = true;
        if (e.key === 'Control') state.modifiers.ctrl = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') state.modifiers.shift = false;
        if (e.key === 'Control') state.modifiers.ctrl = false;
    });
    window.addEventListener('blur', () => {
        state.modifiers.shift = false;
        state.modifiers.ctrl = false;   // 防止切走后一直生效
    });

    // 根据当前修饰键返回操作数量
    function getMultiplier() {
        const { shift, ctrl } = state.modifiers;
        if (shift && ctrl) return 1000;
        if (ctrl) return 100;
        if (shift) return 10;
        return 1;
    }

    // ---------- 建筑大分类显示名 ----------
    function getClassName(cls) {
        const map = { ground: '地面', space: '太阳系', galaxy: '银河系', earth_core: '地心', wormhole: '虫洞' };
        return map[cls] || cls;
    }

    // 获取与指定 type 绑定的局域资源（displayLocation === type 且 type 非大类名）
    function getLocalResourcesForType(type) {
        const list = [];
        for (let key in LOCAL_RESOURCES_CONFIG) {
            if (LOCAL_RESOURCES_CONFIG[key].displayLocation === type) list.push(key);
        }
        return list;
    }

    // 获取属于整个大类的局域资源（displayLocation === cls）
    function getLocalResourcesForClass(cls) {
        const list = [];
        for (let key in LOCAL_RESOURCES_CONFIG) {
            if (LOCAL_RESOURCES_CONFIG[key].displayLocation === cls) list.push(key);
        }
        return list;
    }

    // ---------- Tooltip（全局单例，由 TooltipHost 组件渲染） ----------
    function openTooltip(el, html) {
        if (!html) return;
        state.tooltip.html = html;
        state.tooltip.visible = true;
        // 等 DOM 更新后再测量定位，复刻原 showTooltip 的边界适配逻辑
        nextTick(() => {
            const tipEl = document.getElementById('game-tooltip');
            if (!tipEl || !state.tooltip.visible) return;
            const rect = el.getBoundingClientRect();
            const tipRect = tipEl.getBoundingClientRect();

            // 默认显示在元素下方
            let top = rect.bottom + 5;
            let left = rect.left;

            // 如果下方空间不足，则显示在元素上方
            if (top + tipRect.height > window.innerHeight) {
                top = rect.top - tipRect.height - 5;
                if (top < 0) top = 5; // 以防上方也不够，强制顶部留 5px
            }

            // 横向边界适配：不超出左右边界
            if (left + tipRect.width > window.innerWidth) {
                left = window.innerWidth - tipRect.width - 5;
            }
            if (left < 0) left = 5;

            state.tooltip.x = left;
            state.tooltip.y = top;
        });
    }

    function closeTooltip() {
        state.tooltip.visible = false;
    }

    // ---------- v-tooltip 指令 ----------
    // 用法：v-tooltip="'静态HTML'" 或 v-tooltip="() => '动态HTML'"
    const tooltipDirective = {
        mounted(el, binding) {
            el._ttValue = binding.value;
            el._ttEnter = () => {
                const html = typeof el._ttValue === 'function' ? el._ttValue(el) : el._ttValue;
                openTooltip(el, html);
            };
            el._ttLeave = () => closeTooltip();
            el.addEventListener('mouseenter', el._ttEnter);
            el.addEventListener('mouseleave', el._ttLeave);
        },
        updated(el, binding) {
            el._ttValue = binding.value;
        },
        unmounted(el) {
            el.removeEventListener('mouseenter', el._ttEnter);
            el.removeEventListener('mouseleave', el._ttLeave);
            el._ttEnter = null;
            el._ttLeave = null;
        },
    };

    // ---------- 组件注册表 ----------
    const components = {};
    function registerComponent(name, comp) {
        comp.name = name;
        components[name] = comp;
    }

    // 暴露全局 UI 命名空间
    window.UI = {
        state,
        getMultiplier,
        getClassName,
        getLocalResourcesForType,
        getLocalResourcesForClass,
        openTooltip,
        closeTooltip,
        tooltipDirective,
        registerComponent,
        components,
    };
})();
