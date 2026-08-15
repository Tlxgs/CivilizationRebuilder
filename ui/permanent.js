// ui/permanent.js — 永恒升级面板组件
(function () {
    const PermanentPanel = {
        template: `
<div>
    <div class="grid-list">
        <button v-for="p in availablePermanents" :key="p" class="card-btn perm-btn" :class="affordClass(p)" :data-permanent="p" @click="buy(p)" v-tooltip="() => permanentTooltip(p)"><b>{{ permName(p) }}</b></button>
    </div>
    <template v-if="researchedPermanents.length">
        <h3>已研究永恒升级</h3>
        <div class="grid-list">
            <span v-for="p in researchedPermanents" :key="p" class="card-btn researched-item" :data-permanent="p" v-tooltip="() => permanentTooltip(p)">{{ permName(p) }}</span>
        </div>
    </template>
    <p v-if="availablePermanents.length === 0 && researchedPermanents.length === 0">暂无永恒升级</p>
</div>
`,
        computed: {
            // 未研究且满足前置条件的永恒升级
            availablePermanents() {
                const result = [];
                for (let p in this.GS.permanent) {
                    const perm = this.GS.permanent[p];
                    if (perm.researched) continue;
                    let canShow = true;
                    if (perm.prereq) {
                        for (let prereq of perm.prereq) {
                            if (!this.GS.permanent[prereq]?.researched) {
                                canShow = false;
                                break;
                            }
                        }
                    }
                    if (canShow) result.push(p);
                }
                return result;
            },
            researchedPermanents() {
                return Object.keys(this.GS.permanent).filter(p => this.GS.permanent[p].researched);
            },
        },
        methods: {
            permName(p) {
                return this.GS.permanent[p].name || p;
            },
            buy(p) {
                Core.buyPermanent(p);
            },
            affordClass(p) {
                const status = getAffordabilityStatus(this.GS.permanent[p].price);
                if (status === 'insufficient') return 'insufficient-name';
                if (status === 'cap-exceeded') return 'unaffordable-name';
                return '';
            },
            permanentTooltip(p) {
                const perm = this.GS.permanent[p];
                if (!perm) return '';
                const priceHtml = Object.entries(perm.price).map(([r, amt]) => {
                    const enough = (this.GS.resources[r]?.amount || 0) >= amt;
                    const color = enough ? '' : 'red';
                    return `<span style="color: ${color};">${r} ${formatNumber(amt)}</span>`;
                }).join('\n');
                let text = `${perm.desc}<hr>${priceHtml}`;
                if (perm.researched) text += '<br>✓ 已获得';
                return text;
            },
        },
    };
    UI.registerComponent('PermanentPanel', PermanentPanel);
})();
