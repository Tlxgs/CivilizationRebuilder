// ui/log.js — 事件日志组件
(function () {
    const LogPanel = {
        template: `
<div id="event-log-list" class="event-log-list">
    <div v-if="logs.length === 0" class="log-entry" style="color:#8a9aac;">暂无事件日志</div>
    <div v-for="(log, i) in logs" :key="i" class="log-entry">
        <span class="log-date">[{{ log.dateStr }}]</span>
        <span>{{ log.text }}</span>
    </div>
</div>
`,
        computed: {
            logs() {
                return this.GS.eventLogs || [];
            },
        },
    };
    UI.registerComponent('LogPanel', LogPanel);
})();
