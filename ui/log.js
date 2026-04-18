// ui/log.js
function renderLogPanel() {
    const container = document.getElementById('event-log-list');
    if (!container) return;
    if (!GameState.eventLogs || GameState.eventLogs.length === 0) {
        container.innerHTML = '<div class="log-entry" style="color:#8a9aac;">暂无事件日志</div>';
        return;
    }
    let html = '';
    for (let log of GameState.eventLogs) {
        html += `<div class="log-entry">
                    <span class="log-date">[${log.dateStr}]</span>
                    <span>${log.text}</span>
                 </div>`;
    }
    container.innerHTML = html;
}

window.renderLogPanel = renderLogPanel;