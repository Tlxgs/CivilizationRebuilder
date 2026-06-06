// ui/components.js - 所有 Vue 组件定义
// 注意：这里不再重复声明 formatNumber 等，直接使用全局函数

const { defineComponent, ref, computed, reactive, watch, onMounted, onUnmounted } = Vue;
const ResourceBar = defineComponent({
    template: `
        <div class="resource-bar">
            <div v-for="(res, name) in visibleResources" :key="name" class="resource-item"}"
                 @mouseenter="showTooltip($event, getResourceTooltip(name))">
                <div class="resource-progress" :style="{ width: progressPercent(name) + '%' }"></div>
                <div class="resource-content">
                    <span class="res-name">{{ name }}</span>
                    <span class="res-value" :class="{ 'near-cap-text': isNearCap(name) }">
                        {{ formatAmount(res) }}
                    </span>
                    <span class="res-prod" :class="res.production >= 0 ? 'positive' : 'negative'">
                        {{ formatProd(res.production) }}
                    </span>
                </div>
            </div>
        </div>
    `,
    setup() {
        // 确保全局函数已定义
        const formatNumber = window.formatNumber;
        const formatTime = window.formatTime;
        
        const visibleResources = computed(() => {
            const result = {};
            for (const [name, res] of Object.entries(GameState.resources)) {
                if (res.visible || res.amount > 0) result[name] = res;
            }
            return result;
        });
        const isNearCap = (name) => {
            const res = GameState.resources[name];
            if (!res || res.cap === Infinity || res.cap === 0) return false;
            return (res.amount / res.cap) > 0.9999;
        };
        
        const progressPercent = (name) => {
            const cap = GameState.resources[name].cap;
            if (cap === Infinity) return 0;
            return Math.min(100, (GameState.resources[name].amount / cap) * 100);
        };
        
        const formatAmount = (res) => {
            const amount = formatNumber(res.amount);
            const cap = res.cap === Infinity ? '∞' : formatNumber(res.cap);
            return `${amount}/${cap}`;
        };
        
        const formatProd = (prod) => {
            if (Math.abs(prod) < 0.01) return '';
            const sign = prod > 0 ? '+' : '';
            return `${sign}${formatNumber(prod)}/s`;
        };
        
        const getResourceTooltip = (name) => {
            if (window.getResourceTooltipHtml) return window.getResourceTooltipHtml(name);
            return name;
        };
        
        const showTooltip = (event, text) => {
            if (window.showTooltip) window.showTooltip(event.target, text);
        };
        
        return {
            visibleResources,
            isNearCap,
            progressPercent,
            formatAmount,
            formatProd,
            getResourceTooltip,
            showTooltip
        };
    }
});
// ========== 幸福度显示 ==========
const HappinessDisplay = defineComponent({
    template: `<div id="happiness-display" @mouseenter="showTooltip">😊 幸福度: {{ effectiveHappiness.toFixed(1) }}%</div>`,
    setup() {
        const effectiveHappiness = computed(() => Formulas.calcHappinessSoftCap(Math.max(0, GameState.happiness), GameState));
        const showTooltip = (event) => {
            const html = window.getHappinessTooltipHtml ? window.getHappinessTooltipHtml(GameState) : '';
            window.showTooltip && window.showTooltip(event.target, html);
        };
        return { effectiveHappiness, showTooltip };
    }
});
// ==================== 行动面板 ====================
const ActionsPanel = defineComponent({
    template: `
        <div class="actions-panel">
            <h3>行动</h3>
            <div class="action-buttons">
                <button v-for="action in visibleActions" :key="action.id" class="action-btn"
                        @click="performAction(action.id)" @mouseenter="showTooltip($event, action.tooltip)">
                    {{ action.text }}
                </button>
                <div v-if="autoWarVisible" style="margin: 4px 0 8px 12px; font-size: 0.85rem;">
                    <label>
                        <input type="checkbox" v-model="autoWarEnabled"> 自动战争（军备满时自动发动）
                    </label>
                </div>
            </div>
        </div>
    `,
    setup() {
        const state = GameState;
        const actionMetaList = window.actionMetaList || [];
        
        const visibleActions = Vue.computed(() => {
            return actionMetaList.filter(meta => {
                if (meta.condition && !meta.condition()) return false;
                return true;
            }).map(meta => ({
                id: meta.id,
                text: typeof meta.text === 'function' ? meta.text() : meta.text,
                tooltip: typeof meta.tooltip === 'function' ? meta.tooltip() : meta.tooltip
            }));
        });
        
        const autoWarVisible = Vue.computed(() => state.permanent["自动战争"]?.researched);
        const autoWarEnabled = Vue.computed({
            get: () => state.autoWarEnabled,
            set: (val) => { state.autoWarEnabled = val; saveGame(); }
        });
        
        const performAction = (id) => {
            if (window.Core) window.Core.performAction(id);
        };
        
        const showTooltip = (event, text) => {
            if (window.showTooltip) window.showTooltip(event.target, text);
        };
        
        return { 
            visibleActions, 
            autoWarVisible, 
            autoWarEnabled, 
            performAction, 
            showTooltip 
        };
    }
});

// ========== 人口信息 ==========
const PopulationInfo = defineComponent({
    template: `<div id="population-info" class="population-info" :class="popClass">{{ popText }}</div>`,
    setup() {
        const pop = computed(() => GameState.localResources.population || { used: 0, capacity: 0 });
        const popText = computed(() => `人口: ${Math.floor(pop.value.used)} / ${Math.floor(pop.value.capacity)}`);
        const popClass = computed(() => {
            if (pop.value.used >= pop.value.capacity) return 'pop-danger';
            if (pop.value.used >= pop.value.capacity-1) return 'pop-warning';
            return '';
        });
        return { popText, popClass };
    }
});
// ========== 建筑面板（完整版） ==========
const BuildingPanel = defineComponent({
    template: `
        <div>
            <div class="sub-tabs">
                <button v-for="cls in classList" :key="cls" @click="currentClass = cls"
                        :class="{ active: currentClass === cls }" class="sub-tab-btn">
                    {{ getClassName(cls) }}
                </button>
            </div>
            <div id="building-class-content">
                <template v-for="(buildings, type) in groupedBuildings" :key="type">
                    <div class="building-category">
                        <div style="display:flex; align-items:center; margin-bottom:5px;">
                            <h4 style="border-left:3px solid var(--accent); padding-left:5px; margin:0;">{{ type }}</h4>
                            <span v-for="lr in typeLocalResources[type]" :key="lr" class="local-resource-tag"
                                  :class="localResourceClass(lr)">
                                {{ localResourceText(lr) }}
                            </span>
                        </div>
                        <div class="building-grid">
                            <div v-for="b in buildings" :key="b" class="building-card"
                                 @click="handleCardClick(b)" @mouseenter="showTooltip($event, getBuildingTooltip(b))">
                                <button v-if="hasModes(b)" class="mode-gear-btn" @click.stop="switchMode(b)">⚙️</button>
                                <div class="building-card-info">
                                    <strong :class="priceColorClass(b)">{{ b }}</strong>
                                    <small>{{ GameState.buildings[b].active }}/{{ GameState.buildings[b].count }}</small>
                                    <span v-if="showEfficiency(b)" class="building-efficiency">效率: {{ efficiencyPercent(b) }}%</span>
                                    <span v-if="hasModes(b)" class="mode-indicator"> | {{ currentModeName(b) }}</span>
                                </div>
                                <div class="btn-group">
                                    <button class="btn-square plus-btn" @click.stop="plusClick(b)">+</button>
                                    <button class="btn-square minus-btn" @click.stop="minusClick(b)">-</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    `,
    setup() {
        const state = GameState;
        const classList = computed(() => {
            const set = new Set();
            for (const b in state.buildings) {
                if (state.buildings[b].visible) {
                    const cfg = BUILDINGS_CONFIG[b];
                    if (cfg) set.add(cfg.class || 'ground');
                }
            }
            return Array.from(set);
        });
        const currentClass = ref(classList.value[0] || 'ground');
        const groupedBuildings = computed(() => {
            const map = {};
            for (const b in state.buildings) {
                const bld = state.buildings[b];
                if (!bld.visible) continue;
                const cfg = BUILDINGS_CONFIG[b];
                if (!cfg || cfg.class !== currentClass.value) continue;
                const type = cfg.type || '其他';
                if (!map[type]) map[type] = [];
                map[type].push(b);
            }
            return map;
        });
        // 局域资源
        const typeLocalResources = computed(() => {
            const map = {};
            for (const type in groupedBuildings.value) {
                map[type] = [];
                for (const lr in LOCAL_RESOURCES_CONFIG) {
                    if (LOCAL_RESOURCES_CONFIG[lr].displayLocation === type) map[type].push(lr);
                }
            }
            return map;
        });
        const localResourceText = (lrKey) => {
            const lr = state.localResources[lrKey];
            const cfg = LOCAL_RESOURCES_CONFIG[lrKey];
            if (!lr) return '';
            const used = lrKey === 'population' ? Math.floor(lr.used) : formatLocalNumber(lr.used);
            const cap = lrKey === 'population' ? Math.floor(lr.capacity) : formatLocalNumber(lr.capacity);
            return `${cfg.name}: ${used} / ${cap}`;
        };
        const localResourceClass = (lrKey) => {
            const lr = state.localResources[lrKey];
            if (!lr) return '';
            const isOver = (lr.used - lr.capacity) > 1e-1;
            const isEqual = Math.abs(lr.used - lr.capacity) <= 1e-1;
            if (isOver) return 'local-over';
            if (isEqual) return 'local-equal';
            return 'local-normal';
        };
        // 辅助函数
        const getClassName = (cls) => ({ ground:'地面', space:'太阳系', galaxy:'银河系', earth_core:'地心', wormhole:'虫洞' }[cls] || cls);
        const priceColorClass = (b) => {
            const status = getAffordabilityStatus(state.buildings[b].price);
            if (status === 'insufficient') return 'insufficient-name';
            if (status === 'cap-exceeded') return 'unaffordable-name';
            return '';
        };
        const showEfficiency = (b) => state.buildings[b].active > 0 && state.buildings[b].efficiency < 0.995;
        const efficiencyPercent = (b) => (state.buildings[b].efficiency * 100).toFixed(0);
        const hasModes = (b) => BUILDINGS_CONFIG[b]?.modes?.length > 1;
        const currentModeName = (b) => {
            const cfg = BUILDINGS_CONFIG[b];
            if (!cfg.modes) return '';
            const mode = state.buildings[b].mode || 0;
            return cfg.modes[mode]?.name || '';
        };
        const switchMode = (b) => Core.switchBuildingMode(b);
        const buyBuilding = (b, qty = 1) => {
            const bld = GameState.buildings[b];
            let purchased = 0;
            for (let i = 0; i < qty; i++) {
                if (canAfford(bld.price)) {
                    for (const [res, amt] of Object.entries(bld.price)) {
                        GameState.resources[res].amount -= amt;
                    }
                    bld.count++;
                    bld.active++;
                    purchased++;
                } else {
                    // 买不起时，加入队列（只加入一次）
                    if (purchased === 0 && i === 0) {
                        addToQueue('building', b);
                    }
                    break;
                }
            }
            if (purchased > 0) {
                ProductionEngine.computeProductionAndCaps();
            }
        };

        const activateBuilding = (b, qty = 1) => {
            const bld = GameState.buildings[b];
            let activated = 0;
            const maxActivate = Math.min(qty, bld.count - bld.active);
            if (maxActivate <= 0) {
                return;
            }
            bld.active += maxActivate;
            activated = maxActivate;
            if (activated > 0) {
                ProductionEngine.computeProductionAndCaps();
            }
        };

        const deactivateBuilding = (b, qty = 1) => {
            const bld = GameState.buildings[b];
            let deactivated = 0;
            const maxDeactivate = Math.min(qty, bld.active);
            if (maxDeactivate <= 0) {
                return;
            }
            bld.active -= maxDeactivate;
            deactivated = maxDeactivate;
            if (deactivated > 0) {
                ProductionEngine.computeProductionAndCaps();
            }
        };

        // 卡片点击购买
        const handleCardClick = (b) => {
            const qty = getMultiplier();
            buyBuilding(b, qty);
        };

        // “+”按钮
        const plusClick = (b) => {
            const qty = getMultiplier();
            activateBuilding(b, qty);
        };

        // “-”按钮
        const minusClick = (b) => {
            const qty = getMultiplier();
            deactivateBuilding(b, qty);
        };
        const getBuildingTooltip = (b) => window.getBuildingTooltip ? window.getBuildingTooltip(b) : b;
        const showTooltip = (event, text) => window.showTooltip(event.target, text);
        return {
            GameState: state,
            classList,
            currentClass,
            groupedBuildings,
            typeLocalResources,
            localResourceText,
            localResourceClass,
            getClassName,
            priceColorClass,
            showEfficiency,
            efficiencyPercent,
            hasModes,
            currentModeName,
            switchMode,
            buyBuilding,
            handleCardClick,
            plusClick,
            minusClick,
            getBuildingTooltip,
            showTooltip
        };
    }
});

// ========== 日志面板 ==========
const LogPanel = defineComponent({
    template: `
        <div class="event-log-list" ref="logContainer" style="overflow-y: auto;">
            <div v-for="log in GameState.eventLogs" :key="log.id" class="log-entry">
                <span class="log-date">[{{ log.dateStr }}]</span>
                <span>{{ log.text }}</span>
            </div>
            <div v-if="GameState.eventLogs.length === 0" class="log-entry">暂无事件日志</div>
        </div>
    `,
    setup() {
        const logContainer = ref(null);
        return { GameState, logContainer };
    }
});
// ========== 队列面板 ==========
const QueuePanel = defineComponent({
    template: `
        <div id="queue-container">
            <div v-if="queue.length === 0" style="color: var(--text-dim); padding: 0.5rem;">队列为空</div>
            <template v-else>
                <div style="font-weight: bold; margin-bottom: 0.5rem;">📋 购买队列</div>
                <div v-for="(item, idx) in queue" :key="idx" class="queue-item">
                    <span>{{ item.type === 'building' ? '🏗️' : item.type === 'tech' ? '📚' : item.type === 'upgrade' ? '⬆️' : '⭐' }} {{ item.id }}</span>
                    <button class="queue-remove-btn" @click="remove(idx)">✕</button>
                </div>
            </template>
        </div>
    `,
    setup() {
        const queue = computed(() => GameState.queue || []);
        const remove = (idx) => window.removeFromQueue(idx);
        return { queue, remove };
    }
});


// ==================== 科技面板（完整版） ====================
const TechPanel = defineComponent({
    template: `
        <div>
            <div class="sub-tabs">
                <button v-if="hasChallenge" class="sub-tab-btn" :class="{ active: currentSubTab === 'challenge' }"
                        @click="currentSubTab = 'challenge'">挑战</button>
                <button class="sub-tab-btn" :class="{ active: currentSubTab === 'tech' }"
                        @click="currentSubTab = 'tech'">技术</button>
                <button v-if="hasUpgrade" class="sub-tab-btn" :class="{ active: currentSubTab === 'upgrade' }"
                        @click="currentSubTab = 'upgrade'">升级</button>
            </div>
            <div v-if="currentSubTab === 'upgrade'">
                <div class="grid-list">
                    <button v-for="up in visibleUpgrades" :key="up.id" class="card-btn upgrade-btn"
                            :class="upgradeColorClass(up.id)" @click="buyUpgrade(up.id)"
                            @mouseenter="showTooltip($event, getUpgradeTooltip(up.id))">
                        <b>{{ up.id }} Lv.{{ up.level }}</b>
                    </button>
                    <p v-if="visibleUpgrades.length === 0">暂无可用升级</p>
                </div>
            </div>
            <div v-else>
                <div class="grid-list">
                    <div v-if="currentSubTab === 'challenge'" style="width:100%; font-size:0.85rem; margin-bottom:0.8rem;">
                        当前激活挑战星级：{{ challengeStars }}，永恒资源获取 +{{ challengeStars * 5 }}%
                    </div>
                    <button v-for="tech in unresearchedTechs" :key="tech.id" class="card-btn tech-btn"
                            :class="techColorClass(tech.id)" @click="researchTech(tech.id)"
                            @mouseenter="showTooltip($event, getTechTooltip(tech.id))">
                        <b>{{ tech.id }}</b>
                    </button>
                    <p v-if="unresearchedTechs.length === 0">暂无可用科技</p>
                </div>
                <h3>已研究</h3>
                <div class="grid-list">
                    <span v-for="tech in researchedTechs" :key="tech.id" class="card-btn researched-item"
                          @mouseenter="showTooltip($event, getTechTooltip(tech.id))">
                        {{ tech.id }}
                    </span>
                    <p v-if="researchedTechs.length === 0">暂无已研究科技</p>
                </div>
            </div>
        </div>
    `,
    setup() {
        const state = GameState;
        const currentSubTab = ref('tech');

        const hasChallenge = computed(() => {
            for (const t of Object.values(state.techs)) {
                if (t.challenge && !t.researched && (!t.unlockCondition || t.unlockCondition(state))) return true;
                if (t.challenge && t.researched) return true;
            }
            return false;
        });
        const hasUpgrade = computed(() => Object.values(state.upgrades).some(u => u.visible));
        const challengeStars = computed(() => window.getTotalActiveChallengeStars ? window.getTotalActiveChallengeStars() : 0);

        // 未研究科技（根据子标签过滤）
        const unresearchedTechs = computed(() => {
            const list = [];
            for (const [id, tech] of Object.entries(state.techs)) {
                if (tech.researched) continue;
                if (tech.unlockCondition && typeof tech.unlockCondition === 'function' && !tech.unlockCondition(state)) continue;
                let canShow = true;
                if (tech.prereq) {
                    for (const p of tech.prereq) {
                        if (!state.techs[p]?.researched) { canShow = false; break; }
                    }
                }
                if (!canShow) continue;
                const isChallenge = !!tech.challenge;
                if (currentSubTab.value === 'challenge' && !isChallenge) continue;
                if (currentSubTab.value === 'tech' && isChallenge) continue;
                list.push({ id });
            }
            return list;
        });
        const researchedTechs = computed(() => {
            const list = [];
            for (const [id, tech] of Object.entries(state.techs)) {
                if (!tech.researched) continue;
                const isChallenge = !!tech.challenge;
                if (currentSubTab.value === 'challenge' && !isChallenge) continue;
                if (currentSubTab.value === 'tech' && isChallenge) continue;
                list.push({ id });
            }
            return list;
        });
        const visibleUpgrades = computed(() => {
            const list = [];
            for (const [id, up] of Object.entries(state.upgrades)) {
                if (up.visible) list.push({ id, level: up.level });
            }
            return list;
        });
        const techColorClass = (id) => {
            const price = state.techs[id].price;
            const status = getAffordabilityStatus(price);
            if (status === 'insufficient') return 'insufficient-name';
            if (status === 'cap-exceeded') return 'unaffordable-name';
            return '';
        };
        const upgradeColorClass = (id) => {
            const price = state.upgrades[id].price;
            const status = getAffordabilityStatus(price);
            if (status === 'insufficient') return 'insufficient-name';
            if (status === 'cap-exceeded') return 'unaffordable-name';
            return '';
        };
        const researchTech = (id) => {
            if (!Core.researchTech(id)) {
                const tech = state.techs[id];
                if (tech && !tech.researched && !canAfford(tech.price)) {
                    addToQueue('tech', id);
                }
            }
        };
        const buyUpgrade = (id) => {
            const qty = getMultiplier();
            if (!Core.buyUpgrade(id, qty)) {
                const up = state.upgrades[id];
                if (up && up.visible && !canAfford(up.price)) {
                    addToQueue('upgrade', id);
                }
            }
        };
        const getTechTooltip = (id) => {
            const tech = state.techs[id];
            if (!tech) return '';
            let priceHtml = '';
            if (tech.price && Object.keys(tech.price).length) {
                priceHtml = '<hr>' + Object.entries(tech.price).map(([r, amt]) => {
                    const enough = (state.resources[r]?.amount || 0) >= amt;
                    return `<span style="color: ${enough ? '' : 'red'}">${r} ${formatNumber(amt)}</span>`;
                }).join('<br>');
            }
            return `${tech.desc}${priceHtml}`;
        };
        const getUpgradeTooltip = (id) => {
            const up = state.upgrades[id];
            if (!up) return '';
            let priceHtml = Object.entries(up.price).map(([r, amt]) => {
                const enough = (state.resources[r]?.amount || 0) >= amt;
                return `<span style="color: ${enough ? '' : 'red'}">${r} ${formatNumber(amt)}</span>`;
            }).join('<br>');
            let effectText = '';
            for (const b in up.effect) {
                effectText += `${b} 效率 +${(up.effect[b]*100).toFixed(0)}%<br>`;
            }
            return `${up.desc}<hr>${priceHtml}<hr>${effectText}`;
        };
        const showTooltip = (event, text) => window.showTooltip(event.target, text);
        return {
            currentSubTab, hasChallenge, hasUpgrade, challengeStars,
            unresearchedTechs, researchedTechs, visibleUpgrades,
            techColorClass, upgradeColorClass,
            researchTech, buyUpgrade, getTechTooltip, getUpgradeTooltip, showTooltip
        };
    }
});

// ==================== 政策面板 ====================
const PolicyPanel = defineComponent({
    template: `
        <div>
            <div v-for="pol in visiblePolicies" :key="pol.id" class="policy-group">
                <div class="policy-title">{{ pol.id }}: <span>{{ pol.currentValue }}{{ pol.unit }}</span></div>
                <div style="font-size:0.8rem; color: var(--text-secondary); margin-bottom:0.5rem;">{{ pol.desc }}</div>
                <div style="margin-bottom:0.3rem; font-size:0.75rem;">调整消耗: {{ pol.costPerUnit }} 政策点/单位</div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <button class="btn-square" @click="adjust(pol.id, -10)">-10</button>
                    <button class="btn-square" @click="adjust(pol.id, -1)">-1</button>
                    <div style="flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                        <div :style="{ width: barWidth(pol) + '%', height:'100%', background:'var(--accent)' }"></div>
                    </div>
                    <button class="btn-square" @click="adjust(pol.id, 1)">+1</button>
                    <button class="btn-square" @click="adjust(pol.id, 10)">+10</button>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem;">
                    <span>{{ pol.min }}{{ pol.unit }}</span>
                    <span>{{ pol.max }}{{ pol.unit }}</span>
                </div>
            </div>
            <p v-if="visiblePolicies.length === 0">暂无可用政策</p>
        </div>
    `,
    setup() {
        const state = GameState;
        const visiblePolicies = computed(() => {
            const list = [];
            for (const [id, pol] of Object.entries(state.policies)) {
                if (pol.visible) {
                    const cfg = POLICIES_CONFIG[id];
                    list.push({
                        id, currentValue: pol.currentValue, min: pol.min, max: pol.max, unit: pol.unit,
                        desc: cfg.desc, costPerUnit: cfg.costPerUnit || 1
                    });
                }
            }
            return list;
        });
        const barWidth = (pol) => ((pol.currentValue - pol.min) / (pol.max - pol.min)) * 100;
        const adjust = (id, delta) => {
            const pol = state.policies[id];
            const newVal = Math.min(pol.max, Math.max(pol.min, pol.currentValue + delta));
            if (Core.setPolicyValue(id, newVal)) {
                // 成功，数据自动响应
            } else {
                alert("政策点不足！");
            }
        };
        return { visiblePolicies, barWidth, adjust };
    }
});
// ==================== 贸易面板 ====================
const TradePanel = defineComponent({
    template: `
        <div>
            <div class="trade-single-card">
                <div>单次贸易量上限：{{ formatNumber(maxVolume) }}</div>
                <div>
                    自定义单次贸易量：
                    <input type="number" v-model.number="userVolume" :max="maxVolume" step="1" class="trade-volume-input">
                </div>
                <div>
                    持续贸易吞吐量上限：{{ formatNumber(throughputLimit) }} 资源/秒<br>
                    已用：{{ formatNumber(usedThroughput) }} 资源/秒
                </div>
            </div>
            <div class="trade-grid">
                <div v-for="res in tradableResources" :key="res.name" class="trade-single-card"  style="font-size:0.85rem">
                    <div style="font-weight:bold;font-size:0.95rem">{{ res.name }}</div>
                    <div>
                        价格: {{ effectivePrice(res.name).toFixed(2) }} 金
                        <span v-if="priceChangePercent(res.name) !== 0" 
                              :style="{ color: priceChangeColor(res.name) }">
                            ({{ priceChangePercent(res.name) > 0 ? '+' : '' }}{{ priceChangePercent(res.name).toFixed(1) }}%)
                        </span>
                    </div>
                    <div>库存: {{ formatNumber(res.amount) }} / {{ res.cap === Infinity ? '∞' : formatNumber(res.cap) }}</div>
                    <div style="display:flex; gap:0.5rem; margin:0.5rem 0;">
                        <input type="number" v-model.number="tradeRates[res.name]" :step="stepSize" class="trade-rate-input" style="width:100px;">
                        <span>资源/秒</span>
                        <span class="trade-status-label" :class="tradeStatusClass(res.name)">{{ tradeStatusText(res.name) }}</span>
                    </div>
                    <div>{{ formatGoldFlow(res.name) }}</div>
                    <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <button class="trade-once-buy-btn" 
                                @click="oneTimeBuy(res.name)"
                                @mouseenter="showBuyTooltip($event, res.name)">购买</button>
                        <button class="trade-once-sell-btn" 
                                @click="oneTimeSell(res.name)"
                                @mouseenter="showSellTooltip($event, res.name)">出售</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const formatNumber = window.formatNumber;
        const addEventLog = window.addEventLog;
        const ProductionEngine = window.ProductionEngine;
        const TradeEngine = window.TradeEngine;
        const showTooltip = window.showTooltip;
        const state = GameState;

        // 响应式数据
        const userVolume = ref(state.userTradeVolume);
        const tradeRates = reactive({ ...state.tradeRates });

        // 计算属性
        const maxVolume = computed(() => state.maxTradeVolume);
        const throughputLimit = computed(() => TradeEngine.getThroughputLimit(state));
        const usedThroughput = computed(() => TradeEngine.getTotalTradeRateAbs(state));
        const stepSize = computed(() => Math.max(0.01, state.maxTradeVolume * 0.001));

        const tradableResources = computed(() => {
            const list = [];
            for (const [name, res] of Object.entries(state.resources)) {
                if (name === "金") continue;
                if (res.value === undefined) continue;
                if (!res.visible && res.amount < 0.001 && (state.tradeRates[name] || 0) === 0) continue;
                list.push({ name, amount: res.amount, cap: res.cap });
            }
            return list;
        });

        // 方法
        const effectivePrice = (res) => TradeEngine.getEffectivePrice(state, res);
        const priceChangePercent = (res) => {
            const base = state.resources[res].value;
            if (!base || base === 0) return 0;
            return (effectivePrice(res) - base) / base * 100;
        };
        const priceChangeColor = (res) => {
            const percent = priceChangePercent(res);
            if (percent > 0) return 'var(--red)';
            if (percent < 0) return 'var(--accent)';
            return '';
        };
        const tradeStatusClass = (res) => {
            const rate = state.tradeRates[res] || 0;
            if (rate > 0) return 'trade-status-import';
            if (rate < 0) return 'trade-status-export';
            return 'trade-status-idle';
        };
        const tradeStatusText = (res) => {
            const rate = state.tradeRates[res] || 0;
            if (rate > 0) return '进口';
            if (rate < 0) return '出口';
            return '闲置';
        };
        const formatGoldFlow = (res) => {
            const rate = state.tradeRates[res] || 0;
            const flow = TradeEngine.getGoldFlowForResource(state, res, rate);
            if (flow > 0) return `+${formatNumber(flow)} 金/秒`;
            if (flow < 0) return `-${formatNumber(-flow)} 金/秒`;
            return '';
        };
        const oneTimeBuy = (res) => {
            const result = TradeEngine.performOneTimeTrade(state, res, 'buy', userVolume.value);
            if (result.success) addEventLog(`购买 ${formatNumber(result.actualVolume)} ${res}，消耗 ${formatNumber(result.costGold)} 金。`);
            else addEventLog(`购买失败：${result.reason}`);
            ProductionEngine.computeProductionAndCaps();
        };
        const oneTimeSell = (res) => {
            const result = TradeEngine.performOneTimeTrade(state, res, 'sell', userVolume.value);
            if (result.success) addEventLog(`出售 ${formatNumber(result.actualVolume)} ${res}，获得 ${formatNumber(result.gainGold)} 金。`);
            else addEventLog(`出售失败：${result.reason}`);
            ProductionEngine.computeProductionAndCaps();
        };
        const showBuyTooltip = (event, res) => {
            const desired = userVolume.value;
            const actual = TradeEngine.getMaxBuyableVolume(state, res, desired);
            if (actual <= 0) {
                showTooltip(event.target, `无法购买 ${res}，黄金不足或容量已满`);
                return;
            }
            const cost = TradeEngine.computeBuyCost(state, res, actual);
            showTooltip(event.target, `购买 ${formatNumber(actual)} ${res}<br>消耗 ${formatNumber(cost)} 金`);
        };
        const showSellTooltip = (event, res) => {
            const desired = userVolume.value;
            const actual = TradeEngine.getMaxSellableVolume(state, res, desired);
            if (actual <= 0) {
                showTooltip(event.target, `无法出售 ${res}，资源不足或黄金容量已满`);
                return;
            }
            const gain = TradeEngine.computeSellGain(state, res, actual);
            showTooltip(event.target, `出售 ${formatNumber(actual)} ${res}<br>获得 ${formatNumber(gain)} 金`);
        };

        // 监听 userVolume 同步到 GameState
        watch(userVolume, (newVal) => {
            if (newVal !== undefined && newVal !== state.userTradeVolume) {
                state.userTradeVolume = Math.min(maxVolume.value, Math.max(0, newVal));
            }
        });

        // 监听 tradeRates 变化，调用 TradeEngine.setTradeRate
        watch(tradeRates, (newRates) => {
            for (const [res, rate] of Object.entries(newRates)) {
                const result = TradeEngine.setTradeRate(state, res, rate);
                if (result.actualRate !== rate) {
                    tradeRates[res] = result.actualRate;
                }
            }
            ProductionEngine.computeProductionAndCaps();
        }, { deep: true });

        // 同步外部 tradeRates 变化到本地 reactive 对象
        watch(() => state.tradeRates, (newRates) => {
            for (const [res, rate] of Object.entries(newRates)) {
                if (tradeRates[res] !== rate) tradeRates[res] = rate;
            }
        }, { deep: true, immediate: true });

        return {
            userVolume,
            tradeRates,
            maxVolume,
            throughputLimit,
            usedThroughput,
            stepSize,
            tradableResources,
            effectivePrice,
            priceChangePercent,
            priceChangeColor,
            tradeStatusClass,
            tradeStatusText,
            formatGoldFlow,
            oneTimeBuy,
            oneTimeSell,
            showBuyTooltip,
            showSellTooltip,
            formatNumber
        };
    }
});
// ==================== 晶体面板 ====================
const CrystalPanel = defineComponent({
    template: `
        <div>
            <h3>装备槽位 (生效中)</h3>
            <div class="crystal-slots">
                <div v-for="(crystal, idx) in equipped" :key="'eq'+idx" class="crystal-slot">
                    <div class="crystal-card" :class="{ empty: !crystal }">
                        <div v-if="crystal">
                            <div class="crystal-name">{{ crystal.name }}</div>
                            <div class="crystal-effects" v-html="formatEffects(crystal.effects)"></div>
                            <div v-if="crystal.fragile" class="crystal-fragile-mark">脆弱：重置后消失</div>
                            <button class="btn-rect" @click="unequip(idx)">卸下</button>
                        </div>
                        <div v-else class="empty-slot">空槽位</div>
                    </div>
                </div>
            </div>
            <h3>库存槽位</h3>
            <div class="crystal-slots">
                <div v-for="(crystal, idx) in inventory" :key="'inv'+idx" class="crystal-slot">
                    <div class="crystal-card">
                        <div class="crystal-name">{{ crystal.name }}</div>
                        <div class="crystal-effects" v-html="formatEffects(crystal.effects)"></div>
                        <div v-if="crystal.fragile" class="crystal-fragile-mark">脆弱：重置后消失</div>
                        <div class="crystal-buttons">
                            <button class="btn-rect" @click="equip(idx)">装备</button>
                            <button class="btn-rect" @click="discard(idx)">丢弃</button>
                        </div>
                    </div>
                </div>
                <div v-for="i in emptySlots" :key="'empty'+i" class="crystal-slot">
                    <div class="crystal-card empty">空闲库存槽</div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const state = GameState;
        const equipped = computed(() => state.crystals.equipped);
        const inventory = computed(() => state.crystals.inventory);
        const emptySlots = computed(() => Math.max(0, 6 - inventory.value.length));
        const formatEffects = (effects) => effects.map(e => {
            let sign = e.value > 0 ? '+' : '';
            let percent = (e.value * 100).toFixed(1);
            if (e.type === 'happiness') return `幸福度 ${sign}${percent}%`;
            if (e.type === 'prod') return `${e.target} 产量 ${sign}${percent}%`;
            if (e.type === 'cons') return `${e.target} 消耗 ${sign}${percent}%`;
            if (e.type === 'cap') return `${e.target} 上限 ${sign}${percent}%`;
            return `${e.type} ${sign}${percent}%`;
        }).join('<br>');
        const equip = (idx) => {
            const crystal = inventory.value[idx];
            if (!crystal) return;
            const emptySlot = equipped.value.findIndex(s => s === null);
            if (emptySlot === -1) { alert("装备槽已满"); return; }
            state.crystals.equipped[emptySlot] = crystal;
            state.crystals.inventory.splice(idx, 1);
            ProductionEngine.computeProductionAndCaps();
        };
        const unequip = (slotIdx) => {
            const crystal = equipped.value[slotIdx];
            if (!crystal) return;
            if (inventory.value.length >= 6) { alert("库存已满"); return; }
            state.crystals.equipped[slotIdx] = null;
            state.crystals.inventory.push(crystal);
            ProductionEngine.computeProductionAndCaps();
        };
        const discard = (idx) => {
            if (confirm('确定丢弃这个晶体吗？')) {
                state.crystals.inventory.splice(idx, 1);
                ProductionEngine.computeProductionAndCaps();
            }
        };
        return { equipped, inventory, emptySlots, formatEffects, equip, unequip, discard };
    }
});

// ==================== 永恒升级面板 ====================
const PermanentPanel = defineComponent({
    template: `
        <div>
            <div class="grid-list">
                <button v-for="perm in notResearched" :key="perm.id" class="card-btn perm-btn"
                        :class="permColorClass(perm.id)" @click="buy(perm.id)"
                        @mouseenter="showTooltip($event, getTooltip(perm.id))">
                    <b>{{ perm.name }}</b>
                </button>
                <p v-if="notResearched.length === 0 && researchedList.length === 0">暂无永恒升级</p>
            </div>
            <h3 v-if="researchedList.length > 0">已研究永恒升级</h3>
            <div class="grid-list">
                <span v-for="perm in researchedList" :key="perm.id" class="card-btn researched-item"
                      @mouseenter="showTooltip($event, getTooltip(perm.id))">
                    {{ perm.name }}
                </span>
            </div>
        </div>
    `,
    setup() {
        const state = GameState;
        const notResearched = computed(() => {
            const list = [];
            for (const [id, perm] of Object.entries(state.permanent)) {
                if (perm.researched) continue;
                let canShow = true;
                if (perm.prereq) {
                    for (const p of perm.prereq) {
                        if (!state.permanent[p]?.researched) { canShow = false; break; }
                    }
                }
                if (canShow) list.push({ id, name: perm.name || id });
            }
            return list;
        });
        const researchedList = computed(() => {
            const list = [];
            for (const [id, perm] of Object.entries(state.permanent)) {
                if (perm.researched) list.push({ id, name: perm.name || id });
            }
            return list;
        });
        const permColorClass = (id) => {
            const price = state.permanent[id].price;
            const status = getAffordabilityStatus(price);
            if (status === 'insufficient') return 'insufficient-name';
            if (status === 'cap-exceeded') return 'unaffordable-name';
            return '';
        };
        const buy = (id) => Core.buyPermanent(id);
        const getTooltip = (id) => {
            const perm = state.permanent[id];
            if (!perm) return '';
            let priceHtml = Object.entries(perm.price).map(([r, amt]) => {
                const enough = (state.resources[r]?.amount || 0) >= amt;
                return `<span style="color: ${enough ? '' : 'red'}">${r} ${formatNumber(amt)}</span>`;
            }).join('<br>');
            return `${perm.desc}<hr>${priceHtml}${perm.researched ? '<br>✓ 已获得' : ''}`;
        };
        const showTooltip = (event, text) => window.showTooltip(event.target, text);
        return { notResearched, researchedList, permColorClass, buy, getTooltip, showTooltip };
    }
});

// ==================== 成就面板 ====================
const AchievementsPanel = defineComponent({
    template: `
        <div>
            <div style="margin-bottom:1rem; font-weight:bold;">🏆 已完成 {{ completedCount }}/{{ totalCount }}</div>
            <div style="display:flex; flex-wrap:wrap; gap:1rem;">
                <div v-for="ach in achievementsList" :key="ach.id" class="achievement-card"
                     @mouseenter="showTooltip($event, getTooltip(ach.id))">
                    <div style="font-weight:bold; font-size:1rem;">🏆 {{ ach.name }}</div>
                    <div style="font-size:0.85rem;">{{ ach.effectText }}</div>
                </div>
            </div>
            <p v-if="achievementsList.length === 0">暂无解锁的成就。</p>
        </div>
    `,
    setup() {
        const state = GameState;
        const totalCount = computed(() => ACHIEVEMENTS_CONFIG?.length || 0);
        const completedCount = computed(() => Object.keys(state.achievements).length);
        const achievementsList = computed(() => {
            return Object.entries(state.achievements).map(([id, ach]) => ({ id, name: ach.name, effectText: ach.effectText }));
        });
        const getTooltip = (id) => {
            const cfg = ACHIEVEMENTS_CONFIG?.find(a => a.id === id);
            return cfg ? `<strong>${cfg.name}</strong><br>${cfg.desc}` : '';
        };
        const showTooltip = (event, text) => window.showTooltip(event.target, text);
        return { totalCount, completedCount, achievementsList, getTooltip, showTooltip };
    }
});
// ==================== 重置/选项面板（含模态框） ====================
const ResetPanel = defineComponent({
    template: `
        <div>
            <div class="reset-area">
                <button class="btn-rect" @click="softReset">软重置</button>
                <button class="btn-rect" @click="hardReset">硬重置</button>
                <button class="btn-rect" @click="manualSave">手动保存</button>
                <button class="btn-rect" @click="toggleTheme">{{ themeButtonText }}</button>
            </div>
            <div class="reset-area">
                <button class="btn-rect" @click="exportFile">导出存档文件</button>
                <button class="btn-rect" @click="exportText">导出存档文本</button>
                <button class="btn-rect" @click="importTextFromPrompt">导入存档文本</button>
                <button class="btn-rect" @click="importFile">导入存档文件</button>
            </div>
            <p>每10秒自动保存</p>
            <p>按住shift键可以每次购买/加减10个建筑,按住ctrl以100为单位操作，shift+ctrl以1000为单位操作</p>
            <p>Bug、建议反馈：tlxgsgame@163.com</p>
            <hr>
            <p>Q&A</p>
            <p>问：有些建筑产出/消耗的人口/资源似乎与显示不符？</p>
            <p>答：请检查是否有其他建筑因为资源缺乏处于非满效率工作状态，这些建筑消耗的人口和资源会被乘以其效率</p>
            <p>问：为什么手动购买/出售资源时，总花费/收入 ≠ 单价 × 交易数量？</p>
            <p>答：简单来说：因为一次购买实际上是逐步购买的，后面的购买价格比一开始更高，所以总价会更高，反之出售时获利更少，这样设计是为了防止无限刷金。具体来说：设当前对数价格偏移为 <i>H</i>，基准价为 <i>V</i>，价格敏感系数为 <i>c</i>，单次贸易量上限为 <i>M</i>。则第 <i>q</i> 单位资源的价格为：<br>
            &emsp;<i>P</i>(<i>q</i>) = <i>V</i> · e<sup><i>H</i> + (<i>c</i>/<i>M</i>)·<i>q</i></sup><br>
            购买总量 <i>Q</i> 的总成本为：<br>
            &emsp;<i>Cost</i> = ∫<sub>0</sub><sup><i>Q</i></sup> <i>P</i>(<i>q</i>) d<i>q</i> = <i>V</i>·e<sup><i>H</i></sup> · (e<sup>(<i>c</i>/<i>M</i>)<i>Q</i></sup> − 1) / (<i>c</i>/<i>M</i>)<br>
            出售收益需再乘以 (1 − 税率)，因此总价与 <i>Q</i> 呈非线性关系。</p>

            <!-- 导入文本模态框 -->
            <div v-if="showImportModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content">
                    <h3>导入存档文本</h3>
                    <textarea v-model="importText" rows="6" placeholder="请粘贴加密后的存档文本..."></textarea>
                    <div class="modal-buttons">
                        <button class="btn-rect" @click="confirmImport">确认导入</button>
                        <button class="btn-rect" @click="closeModal">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const themeButtonText = ref(localStorage.getItem('theme') === 'dark' ? '浅色模式' : '深色模式');
        const showImportModal = ref(false);
        const importText = ref('');

        // 软重置
        const softReset = () => {
            if (confirm("执行软重置？所有建筑、科技、资源将被清空，但永恒升级和已获得的成就会保留。")) {
                window.softReset(0, 0);
                addEventLog("执行了软重置。");
            }
        };
        // 硬重置
        const hardReset = () => {
            if (confirm("⚠️ 硬重置将清除所有数据！确定吗？")) {
                window.hardReset();
            }
        };
        const manualSave = () => window.saveGame();
        const toggleTheme = () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeButtonText.value = isDark ? '浅色模式' : '深色模式';
        };
        const exportFile = () => window.exportGame();
        const exportText = () => window.copyGameExportText();
        const importFile = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.civ,text/plain';
            input.onchange = (e) => {
                if (e.target.files.length) window.importGameFromFile(e.target.files[0]);
            };
            input.click();
        };
        const importTextFromPrompt = () => {
            const encrypted = prompt("请粘贴存档文本：");
            if (encrypted && encrypted.trim()) {
                const success = window.importGame(encrypted.trim());
                if (!success) alert("导入失败，请检查文本是否复制完全。");
            }
        };
        const closeModal = () => {
            showImportModal.value = false;
            importText.value = '';
        };
        const confirmImport = () => {
            if (!importText.value.trim()) {
                alert("请输入存档文本");
                return;
            }
            const success = window.importGame(importText.value);
            if (success) closeModal();
        };

        return {
            themeButtonText,
            showImportModal,
            importText,
            importTextFromPrompt,
            softReset,
            hardReset,
            manualSave,
            toggleTheme,
            exportFile,
            exportText,
            importFile,
            closeModal,
            confirmImport
        };
    }
});

// ==================== 更新日志面板 ====================
const ChangelogPanel = defineComponent({
    template: `
        <div style=" overflow-y:auto; padding-left:20px;padding-right:10px;">
            <div v-for="log in logs" :key="log.version" style="margin-bottom:24px;">
                <h3>{{ log.version }} <span style="font-size:0.85rem;">({{ log.date }})</span></h3>
                <ul>
                    <li v-for="change in log.changes" :key="change">{{ change }}</li>
                </ul>
            </div>
        </div>
    `,
    setup() {
        const logs = computed(() => window.ChangelogData?.logs || []);
        return { logs };
    }
});

// 导出所有组件
window.VueComponents = {
    ResourceBar,
    HappinessDisplay,
    ActionsPanel,
    PopulationInfo,
    BuildingPanel,
    LogPanel,
    QueuePanel,
    TechPanel,
    PolicyPanel,
    TradePanel,
    CrystalPanel,
    PermanentPanel,
    AchievementsPanel,
    ResetPanel,
    ChangelogPanel
};