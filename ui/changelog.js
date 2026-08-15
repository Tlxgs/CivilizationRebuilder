// ui/changelog.js — 更新日志组件
(function () {
    const ChangelogPanel = {
        template: `
<div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
    <div v-for="log in logs" :key="log.version" style="margin-bottom: 24px; border-left: 3px; padding-left: 15px;">
        <h3 style="margin: 0 0 5px 0;">{{ log.version }} <span style="font-size: 0.85rem; color: #6c7a8a;">({{ log.date }})</span></h3>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li v-for="(change, i) in log.changes" :key="i" style="margin: 4px 0;">{{ change }}</li>
        </ul>
    </div>
</div>
`,
        computed: {
            logs() {
                return ChangelogData.logs;
            },
        },
    };
    UI.registerComponent('ChangelogPanel', ChangelogPanel);
})();
