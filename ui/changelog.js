// ui/changelog.js
function renderChangelogPanel() {
    const panel = document.getElementById('panel-changelog');
    if (!panel) return;
    
    let html = '<div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">';
    
    for (let log of ChangelogData.logs) {
        html += `
            <div style="margin-bottom: 24px; border-left: 3px solid #2a7faa; padding-left: 15px;">
                <h3 style="margin: 0 0 5px 0; color: #1e384b;">${log.version} <span style="font-size: 0.85rem; color: #6c7a8a;">(${log.date})</span></h3>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #2d3f53;">
        `;
        for (let change of log.changes) {
            html += `<li style="margin: 4px 0;">${change}</li>`;
        }
        html += `
                </ul>
            </div>
        `;
    }
    
    panel.innerHTML = html;
}
window.renderChangelogPanel = renderChangelogPanel;