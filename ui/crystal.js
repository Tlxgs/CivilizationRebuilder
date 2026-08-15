// ui/crystal.js — 晶体面板组件
(function () {
    // 格式化晶体词条（返回 HTML）
    function formatCrystalEffects(effects) {
        if (!effects || effects.length === 0) return "无效果";
        return effects.map(e => {
            let sign = e.value > 0 ? '+' : '';
            let percent = (e.value * 100).toFixed(1);
            if (e.type === 'happiness') return `幸福度 ${sign}${percent}%`;
            if (e.type === 'prod') return `${e.target} 产量 ${sign}${percent}%`;
            if (e.type === 'cons') return `${e.target} 消耗 ${sign}${percent}%`;
            if (e.type === 'cap') return `${e.target} 上限 ${sign}${percent}%`;
            return `${e.type} ${sign}${percent}%`;
        }).join('<br>');
    }

    const CrystalPanel = {
        template: `
<div style="margin-bottom: 20px;">
    <h3>装备槽位 (生效中)</h3>
    <div class="crystal-slots">
        <div v-for="(c, i) in equippedSlots" :key="i" class="crystal-slot">
            <div class="crystal-card" :class="{ empty: !c }">
                <template v-if="c">
                    <div class="crystal-name">{{ c.name }}</div>
                    <div class="crystal-effects" v-html="crystalEffectsHtml(c.effects)"></div>
                    <div v-if="c.fragile" class="crystal-fragile-mark">脆弱：重置后消失</div>
                    <button class="btn-rect unequip-crystal" :data-slot="i" @click="unequip(i)">卸下</button>
                </template>
                <div v-else class="empty-slot">空槽位</div>
            </div>
        </div>
    </div>
    <h3>库存槽位</h3>
    <div class="crystal-slots">
        <div v-for="(c, i) in inventorySlots" :key="i" class="crystal-slot">
            <div v-if="c" class="crystal-card">
                <div class="crystal-name">{{ c.name }}</div>
                <div class="crystal-effects" v-html="crystalEffectsHtml(c.effects)"></div>
                <div v-if="c.fragile" class="crystal-fragile-mark">脆弱：重置后消失</div>
                <div class="crystal-buttons">
                    <button class="btn-rect equip-crystal" :data-inv-index="i" @click="equip(i)">装备</button>
                    <button class="btn-rect discard-crystal" :data-inv-index="i" @click="discard(i)">丢弃</button>
                </div>
            </div>
            <div v-else class="crystal-card empty">空闲库存槽</div>
        </div>
    </div>
</div>
`,
        computed: {
            equippedSlots() {
                return this.GS.crystals?.equipped || [];
            },
            // 库存最多展示 6 个槽位（不足部分以 null 占位）
            inventorySlots() {
                const inventory = this.GS.crystals?.inventory || [];
                const slots = inventory.slice(0, 6);
                while (slots.length < 6) slots.push(null);
                return slots;
            },
        },
        methods: {
            crystalEffectsHtml(effects) {
                return formatCrystalEffects(effects);
            },
            equip(i) {
                const inventory = this.GS.crystals.inventory;
                if (i < inventory.length) equipCrystal(i);
            },
            unequip(i) {
                unequipCrystal(i);
            },
            discard(i) {
                const inventory = this.GS.crystals.inventory;
                if (i >= inventory.length) return;
                if (confirm('确定丢弃这个晶体吗？')) discardCrystal(i);
            },
        },
    };
    UI.registerComponent('CrystalPanel', CrystalPanel);
})();
