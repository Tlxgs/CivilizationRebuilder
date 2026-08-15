// ui/population.js — 人口信息组件
(function () {
    const PopulationInfo = {
        template: `
<div id="population-info" class="population-info" :class="popClass">{{ popText }}</div>
`,
        computed: {
            pop() {
                return this.GS.localResources?.population;
            },
            popText() {
                const pop = this.pop;
                if (!pop) return '';
                const used = Math.floor(pop.used);
                const cap = Math.floor(pop.capacity);
                return `人口: ${used} / ${cap}`;
            },
            popClass() {
                const pop = this.pop;
                if (!pop) return '';
                const used = Math.floor(pop.used);
                const cap = Math.floor(pop.capacity);
                if (used > cap) return 'pop-danger';
                if (used === cap) return 'pop-warning';
                return '';
            },
        },
    };
    UI.registerComponent('PopulationInfo', PopulationInfo);
})();
