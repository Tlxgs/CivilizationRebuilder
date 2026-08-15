// ui/importModal.js — 导入存档弹窗组件
(function () {
    const ImportModal = {
        template: `
<div id="import-modal" class="modal">
    <div class="modal-content">
        <span class="modal-close" @click="ui.importModalOpen = false">&times;</span>
        <h3>导入存档</h3>
        <textarea id="import-text" rows="6" placeholder="粘贴导出的存档代码..." v-model="text"></textarea>
        <div class="modal-buttons">
            <button id="confirm-import" class="btn-rect" @click="confirmImport">确认导入</button>
            <button id="cancel-import" class="btn-rect" @click="ui.importModalOpen = false">取消</button>
        </div>
    </div>
</div>
`,
        data() {
            return { text: '' };
        },
        methods: {
            confirmImport() {
                importGame(this.text);
                this.ui.importModalOpen = false;
                this.text = '';
            },
        },
    };
    UI.registerComponent('ImportModal', ImportModal);
})();
