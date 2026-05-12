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
        <p>按住shift键可以每次购买/加减10个建筑,按住ctrl以100为单位操作，shift+ctrl以1000为单位操作</p>
        <p>Bug、建议反馈:tlxgsgame@163.com
        <br>
        <hr>
        <br>
        <p>Q&A</p>
        <p>问：有些建筑产出/消耗的人口/资源似乎与显示不符？</p>
        <p>答：请检查是否有其他建筑因为资源缺乏处于非满效率工作状态，这些建筑消耗的人口和资源会被乘以其效率</p>
        <p>问：为什么手动购买/出售资源时，总花费/收入 ≠ 单价 × 交易数量？</p>
        <p>答：简单来说：因为一次购买实际上是逐步购买的，后面的购买价格比一开始更高，所以总价会更高，反之出售时获利更少，这样设计是为了防止无限刷金。具体来说：设当前对数价格偏移为 <i>H</i>，基准价为 <i>V</i>，价格敏感系数为 <i>c</i>，单次贸易量上限为 <i>M</i>。则第 <i>q</i> 单位资源的价格为：<br>
        &emsp;<i>P</i>(<i>q</i>) = <i>V</i> · e<sup><i>H</i> + (<i>c</i>/<i>M</i>)·<i>q</i></sup><br>
        购买总量 <i>Q</i> 的总成本为：<br>
        &emsp;<i>Cost</i> = ∫<sub>0</sub><sup><i>Q</i></sup> <i>P</i>(<i>q</i>) d<i>q</i> = <i>V</i>·e<sup><i>H</i></sup> · (e<sup>(<i>c</i>/<i>M</i>)<i>Q</i></sup> − 1) / (<i>c</i>/<i>M</i>)<br>
        出售收益需再乘以 (1 − 税率)，因此总价与 <i>Q</i> 呈非线性关系。</p>
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

renderResetPanel = renderResetPanel;