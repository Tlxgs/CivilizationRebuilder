// ui/buildings.js — 建筑面板组件
// 复刻原版 renderBuildingPanel / switchBuildingClass / refreshBuildingPanel / getBuildingTooltip。
(function () {
    const BuildingPanel = {
        template: `
<div>
    <div class="sub-tabs">
        <button v-for="cls in buildingClasses" :key="cls" class="sub-tab-btn"
                :class="{ active: ui.currentBuildingClass === cls }" :data-class="cls"
                @click="ui.currentBuildingClass = cls">{{ className(cls) }}</button>
    </div>
    <div id="building-class-content">
        <!-- 大类通用局域资源 -->
        <div v-if="classLocalResources.length" class="class-local-resources" style="display:flex; gap:1rem; margin-bottom:0.8rem; flex-wrap:wrap; padding:0.2rem 0;">
            <span v-for="lr in classLocalResources" :key="lr" class="local-resource-tag" :class="localClass(lr)" :data-local-resource="lr">{{ localText(lr) }}</span>
        </div>

        <div v-for="cat in categories" :key="cat.type" class="building-category" style="margin-bottom:1rem;">
            <div style="display:flex; align-items:center; margin-bottom:5px; flex-wrap:wrap;">
                <h4 style="border-left:3px solid var(--accent); padding-left:5px; margin:0;">{{ cat.type }}</h4>
                <span v-for="lr in cat.localResources" :key="lr" class="local-resource-tag" :class="localClass(lr)" :data-local-resource="lr" style="margin-left:0.6rem;">{{ localText(lr) }}</span>
            </div>
            <div class="building-grid">
                <div v-for="b in cat.buildings" :key="b" class="building-card" :data-building="b"
                     :class="{ highlight: ui.hoveredResource && priceHasResource(ui.hoveredResource, b) }"
                     @mouseenter="hoverBuilding(b)" @mouseleave="unhoverBuilding()"
                     @click="buy(b)" v-tooltip="() => buildingTooltip(b)">
                    <button v-if="hasModes(b)" class="mode-gear-btn" :data-building="b" :title="modeTitle(b)" @click.stop="switchMode(b)">⚙️</button>
                    <div class="building-card-info">
                        <strong :class="affordClass(b)">{{ b }}</strong>
                        <small>{{ activeCount(b) }}/{{ totalCount(b) }}</small>
                        <span v-if="efficiencyPercent(b) !== null" class="building-efficiency" style="color:#e6a017; font-size:0.8rem; margin-left:6px;">效率: {{ efficiencyPercent(b) }}%</span>
                        <span v-if="hasModes(b)" class="mode-indicator"> | {{ modeName(b) }}</span>
                    </div>
                    <div class="btn-group">
                        <button class="btn-square plus-btn" :data-building="b" @click.stop="activate(b)">+</button>
                        <button class="btn-square minus-btn" :data-building="b" @click.stop="deactivate(b)">-</button>
                    </div>
                </div>
            </div>
        </div>
        <p v-if="categories.length === 0">该分类下暂无可用建筑</p>
    </div>
</div>
`,
        computed: {
            // 可见建筑的大分类列表（无可见建筑时回退为 ground）
            buildingClasses() {
                const set = new Set();
                for (let b in this.GS.buildings) {
                    if (!this.GS.buildings[b].visible) continue;
                    const cfg = BUILDINGS_CONFIG[b];
                    if (cfg) set.add(cfg.class || 'ground');
                }
                const classes = Array.from(set);
                if (classes.length === 0) classes.push('ground');
                return classes;
            },
            // 当前大分类下的建筑，按 type 分组
            categories() {
                const cls = this.ui.currentBuildingClass;
                if (!cls) return [];
                const typeMap = {};
                for (let b in this.GS.buildings) {
                    const bd = this.GS.buildings[b];
                    if (!bd.visible) continue;
                    const cfg = BUILDINGS_CONFIG[b];
                    if (!cfg || cfg.class !== cls) continue;
                    const type = cfg.type || '其他';
                    if (!typeMap[type]) typeMap[type] = [];
                    typeMap[type].push(b);
                }
                return Object.keys(typeMap).map(type => ({
                    type,
                    buildings: typeMap[type],
                    localResources: UI.getLocalResourcesForType(type),
                }));
            },
            // 大类通用局域资源
            classLocalResources() {
                return UI.getLocalResourcesForClass(this.ui.currentBuildingClass);
            },
        },
        watch: {
            // 当可见大分类变化且当前选中项失效时，回退到第一个分类
            buildingClasses(classes) {
                if (!this.ui.currentBuildingClass || !classes.includes(this.ui.currentBuildingClass)) {
                    this.ui.currentBuildingClass = classes[0];
                }
            },
        },
        methods: {
            className(cls) {
                return UI.getClassName(cls);
            },
            // ---------- 模式切换 ----------
            hasModes(b) {
                const cfg = BUILDINGS_CONFIG[b];
                return !!(cfg && cfg.modes && cfg.modes.length > 1);
            },
            modeName(b) {
                const bd = this.GS.buildings[b];
                const cfg = BUILDINGS_CONFIG[b];
                return (cfg.modes && cfg.modes[bd.mode || 0]?.name) || '未知';
            },
            modeTitle(b) {
                return `当前模式：${this.modeName(b)}。点击切换模式`;
            },
            switchMode(b) {
                Core.switchBuildingMode(b);
            },
            // ---------- 数量/效率 ----------
            activeCount(b) {
                return this.GS.buildings[b].active;
            },
            totalCount(b) {
                return this.GS.buildings[b].count;
            },
            efficiencyPercent(b) {
                const bd = this.GS.buildings[b];
                if (bd.active > 0 && bd.efficiency !== undefined && bd.efficiency < 0.995) {
                    return (bd.efficiency * 100).toFixed(0);
                }
                return null;
            },
            // ---------- 购买/激活 ----------
            affordClass(b) {
                const status = getAffordabilityStatus(this.GS.buildings[b].price);
                if (status === 'insufficient') return 'insufficient-name';
                if (status === 'cap-exceeded') return 'unaffordable-name';
                return '';
            },
            priceHasResource(resName, bKey) {
                return this.GS.buildings[bKey]?.price?.[resName] !== undefined;
            },
            hoverBuilding(b) {
                this.ui.hoveredBuilding = b;
            },
            unhoverBuilding() {
                this.ui.hoveredBuilding = null;
            },
            buy(b) {
                const bld = this.GS.buildings[b];
                if (!bld) return;
                const quantity = UI.getMultiplier();
                // 若当前完全买不起，直接加入队列
                if (!canAfford(bld.price)) {
                    addToQueue('building', b);
                    return;
                }
                const success = Core.buyBuilding(b, quantity);
                // 即使部分购买成功，剩余未购部分暂不处理（与原版一致）
            },
            activate(b) {
                const bd = this.GS.buildings[b];
                const max = UI.getMultiplier();
                const inc = Math.min(max, bd.count - bd.active);
                if (inc > 0) {
                    bd.active += inc;
                    updateBuildingPrices();
                    updateUpgradePrices();
                    computeProductionAndCaps();
                }
            },
            deactivate(b) {
                const bd = this.GS.buildings[b];
                const max = UI.getMultiplier();
                const dec = Math.min(max, bd.active);
                if (dec > 0) {
                    bd.active -= dec;
                    updateBuildingPrices();
                    updateUpgradePrices();
                    computeProductionAndCaps();
                }
            },
            // ---------- 局域资源标签 ----------
            localText(lrKey) {
                const lr = this.GS.localResources[lrKey];
                const cfg = LOCAL_RESOURCES_CONFIG[lrKey];
                if (!lr || !cfg) return '';
                const usedDisplay = (lrKey === 'population') ? Math.floor(lr.used) : formatLocalNumber(lr.used);
                const capDisplay = (lrKey === 'population') ? Math.floor(lr.capacity) : formatLocalNumber(lr.capacity);
                return `${cfg.name}: ${usedDisplay} / ${capDisplay}`;
            },
            localClass(lrKey) {
                const lr = this.GS.localResources[lrKey];
                if (!lr) return 'local-normal';
                const isOver = (lr.used - lr.capacity) > 1e-1;
                const isEqual = Math.abs(lr.used - lr.capacity) <= 1e-1;
                if (isOver) return 'local-over';
                if (isEqual) return 'local-equal';
                return 'local-normal';
            },
            // ---------- 建筑悬浮提示（复刻原版 getBuildingTooltip） ----------
            buildingTooltip(b) {
                const bd = this.GS.buildings[b];
                const cfg = BUILDINGS_CONFIG[b];
                if (!bd || !cfg) return '';

                let desc = cfg.desc;
                if (typeof cfg.desc === 'function') desc = cfg.desc(this.GS);

                const priceStr = Object.entries(bd.price).map(([r, amt]) => {
                    const amount = this.GS.resources[r]?.amount || 0;
                    const hasEnough = amount >= amt;
                    const color = hasEnough ? '' : 'red';
                    let text = `${r} ${formatNumber(amt)}`;
                    if (hasEnough && amt > 0 && amount > 0) {
                        const percent = ((amt / amount) * 100).toFixed(1);
                        const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
                        text += ` (${cleanPercent}%)`;
                    }
                    return `<span style="color: ${color};">${text}</span>`;
                }).join('<br>');

                let html = `${desc}`;
                html += `<hr>${priceStr}<br><hr>`;

                const stats = ProductionEngine.getBuildingStats(b);
                if (stats) {
                    for (let lrKey in stats.providesLocal) {
                        const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
                        if (lrCfg && stats.providesLocal[lrKey] !== 0) {
                            html += `提供${lrCfg.name}: +${formatLocalNumber(stats.providesLocal[lrKey])}<br>`;
                        }
                    }
                    for (let lrKey in stats.requiresLocal) {
                        const lrCfg = LOCAL_RESOURCES_CONFIG[lrKey];
                        if (lrCfg && stats.requiresLocal[lrKey] !== 0) {
                            html += `需求${lrCfg.name}: ${formatLocalNumber(stats.requiresLocal[lrKey])}<br>`;
                        }
                    }
                    for (let det of stats.details) {
                        if (det.type === 'prod') html += `${det.resource}: +${formatNumber(det.perBuilding)}/秒<br>`;
                        else if (det.type === 'cons') html += `${det.resource}: -${formatNumber(det.perBuilding)}/秒<br>`;
                        else if (det.type === 'cap') html += `${det.resource}上限: +${formatNumber(det.perBuilding)}<br>`;
                    }
                    if (stats.happinessPerBuilding !== 0) {
                        html += `幸福度: ${stats.happinessPerBuilding > 0 ? '+' : ''}${stats.happinessPerBuilding.toFixed(2)}%<br>`;
                    }
                }

                if (cfg.modifiers && cfg.modifiers.length) {
                    for (let mod of cfg.modifiers) {
                        if (mod.prodFactor) html += `${mod.target} 产量 +${(mod.prodFactor * 100).toFixed(0)}%<br>`;
                        if (mod.consFactor) html += `${mod.target} 消耗 ${mod.consFactor > 0 ? '+' : ''}${(mod.consFactor * 100).toFixed(0)}%<br>`;
                        if (mod.capFactor) html += `${mod.target} 上限 +${(mod.capFactor * 100).toFixed(0)}%<br>`;
                    }
                }

                const status = getAffordabilityStatus(bd.price);
                if (status === 'insufficient') {
                    const timeText = ResourcesManager.getAffordabilityTimeText(bd.price);
                    if (timeText) html += `<br><span>${timeText}</span>`;
                }
                return html;
            },
        },
    };
    UI.registerComponent('BuildingPanel', BuildingPanel);
})();
