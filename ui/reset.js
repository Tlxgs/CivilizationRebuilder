// ui/reset.js
function renderResetPanel() {
    const panel = document.getElementById('panel-reset');
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeBtnText = currentTheme === 'dark' ? '浅色模式' : '深色模式';

    panel.innerHTML = `
        <div class="reset-area">
            <button class="btn-rect" id="soft-reset" title="重新开始游戏,只保留成就、永恒等">软重置</button>
            <button class="btn-rect" id="hard-reset" title="彻底清除存档">硬重置</button>
            
            <button class="btn-rect" id="manual-save">手动保存</button>
            <button class="btn-rect" id="toggle-theme">${themeBtnText}</button>
        </div>
        <div class="reset-area" style="margin-top: 1rem;">
            <button class="btn-rect" id="export-file-btn">导出存档文件</button>
            <button class="btn-rect" id="export-text-btn">导出存档文本</button>
            <button class="btn-rect" id="import-text-btn">导入存档文本</button>
            <button class="btn-rect" id="import-file-btn">导入存档文件</button>
        </div>
        <p>每10秒自动保存</p>
        <p>按住shift键可以每次购买/加减10个建筑</p>
        <p>本游戏灵感来源于《猫国建设者》《进化》《激燃太空》等优秀游戏</p>
        <p>目前游戏还处于开发阶段，存档不稳定，因此请经常导出存档</p>
        <p>目前内容较少，太空阶段还没有做完</p>
        <p>有任何建议或者遇到bug都可以发送到tlxgsgame@163.com，你的任何想法都可能进入到未来的游戏中！</p>
        <p>Q&A</p>
        <p>问：有些建筑产出/消耗的人口/资源似乎与显示不符？</p>
        <p>答：请检查是否有其他建筑因为资源缺乏处于非满效率工作状态，这些建筑消耗的人口和资源会被乘以其效率</p>
    `;

    // 绑定功能按钮事件
    document.getElementById('export-file-btn')?.addEventListener('click', () => exportGame());
    document.getElementById('export-text-btn')?.addEventListener('click', () => copyGameExportText());
    document.getElementById('import-text-btn')?.addEventListener('click', () => {
        document.getElementById('import-modal').style.display = 'flex';
    });
    document.getElementById('import-file-btn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.civ,text/plain';
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                importGameFromFile(e.target.files[0]);
            }
        };
        input.click();
    });
    const softResetBtn = document.getElementById('soft-reset');
    if (softResetBtn) {
        softResetBtn.addEventListener('click', () => {
            if (confirm("执行软重置？\n所有建筑、科技、资源将被清空，但永恒升级和已获得的成就会保留。")) {
                softReset(0, 0);
                addEventLog("执行了软重置。");
                renderAll();
            }
        });
    }
    // 主题切换按钮
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        // 更新按钮文字
        const btn = document.getElementById('toggle-theme');
        if (btn) btn.textContent = isDark ? '浅色模式' : '深色模式';
    });
}

window.renderResetPanel = renderResetPanel;