// ui/reset.js
function renderResetPanel() {
    const panel = document.getElementById('panel-reset');
    panel.innerHTML = `
        <div class="reset-area">
            <button class="btn-rect" id="hard-reset" title="彻底清除存档，重新开始游戏">硬重置</button>
            <button class="btn-rect" id="manual-save">手动保存</button>
            <button class="btn-rect" id="export-save">导出存档</button>
            <button class="btn-rect" id="import-save">导入存档</button>
        </div>
        <p>每10秒自动保存</p>
        <p>按住shift键可以每次购买/加减10个建筑</p>
        <p>本游戏灵感来源于《猫国建设者》《进化》等优秀游戏</p>
        <p>目前游戏还处于开发阶段，存档不稳定，因此请经常导出存档</p>
        <p>如果你发现进度过于缓慢，代表你基本通关了</p>
        <p>有任何建议或者遇到bug都可以发送到tlxgsgame@163.com，你的任何想法都可能进入到未来的游戏中！
    `;
}
window.renderResetPanel = renderResetPanel;