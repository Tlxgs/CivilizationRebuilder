// ui/policy.js — 政策面板组件
(function () {
    const PolicyPanel = {
        template: `
<div>
    <p v-if="visiblePolicies.length === 0">暂无可用政策</p>
    <div v-for="p in visiblePolicies" :key="p" class="policy-group">
        <div class="policy-title">{{ p }}: <span>{{ GS.policies[p].currentValue }}{{ GS.policies[p].unit }}</span></div>
        <div style="font-size:0.8rem; color: var(--text-secondary); margin-bottom:0.5rem;">{{ policyDesc(p) }}</div>
        <div style="margin-bottom:0.3rem; font-size:0.75rem;">
            调整消耗: {{ costPerUnit(p) }} 政策点/单位
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
            <button class="btn-square policy-dec" :data-policy="p" data-amount="10" @click="adjust(p, -10)">-10</button>
            <button class="btn-square policy-dec" :data-policy="p" data-amount="1" @click="adjust(p, -1)">-1</button>
            <div style="flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                <div style="height:100%; background:var(--accent); border-radius:3px; width:{{ barWidth(p) }}%; transition:width 0.1s;"></div>
            </div>
            <button class="btn-square policy-inc" :data-policy="p" data-amount="1" @click="adjust(p, 1)">+1</button>
            <button class="btn-square policy-inc" :data-policy="p" data-amount="10" @click="adjust(p, 10)">+10</button>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; color: var(--text-dim); margin-top:0.2rem;">
            <span>{{ GS.policies[p].min }}{{ GS.policies[p].unit }}</span>
            <span>{{ GS.policies[p].max }}{{ GS.policies[p].unit }}</span>
        </div>
    </div>
</div>
`,
        computed: {
            visiblePolicies() {
                return Object.keys(this.GS.policies).filter(p => this.GS.policies[p].visible);
            },
        },
        methods: {
            policyDesc(p) {
                return POLICIES_CONFIG[p]?.desc || '';
            },
            costPerUnit(p) {
                return POLICIES_CONFIG[p]?.costPerUnit || 1;
            },
            barWidth(p) {
                const pol = this.GS.policies[p];
                return (((pol.currentValue - pol.min) / (pol.max - pol.min)) * 100).toFixed(1);
            },
            adjust(p, delta) {
                const pol = this.GS.policies[p];
                const newVal = Math.min(pol.max, Math.max(pol.min, pol.currentValue + delta));
                if (!Core.setPolicyValue(p, newVal)) {
                    alert("政策点不足！");
                }
            },
        },
    };
    UI.registerComponent('PolicyPanel', PolicyPanel);
})();
