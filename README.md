# 《文明重建者》

《文明重建者》是一款文明模拟放置游戏。从帐篷和伐木场开始，逐步发展工业、科技，最终走向星际殖民。包含大量科技建筑、贸易系统、晶体装备、多种重置机制和永恒升级。

**游戏链接**：https://tlxgs.github.io/CivilizationRebuilder/

---

## 运行方式

无需构建工具，直接双击 `index.html`（file:// 协议）或部署到任意静态服务器（GitHub Pages）即可运行。
UI 使用本地 `vendor/vue.global.prod.js`（Vue 3 全局构建包，含模板编译器），不依赖 CDN，可完全离线运行。

## 项目结构

```
├── index.html              入口页面：加载顺序 = 框架 → 配置 → 引擎 → UI 组件 → 装配 → 主入口
├── main.js                 主入口：初始化数据 → 读档 → 离线结算 → 包装 Vue 响应式 → 挂载 UI → 启动循环
├── style.css               全部样式（浅色/深色主题）
├── vendor/                 Vue 3 本地全局构建包
├── config/                 静态配置（资源/建筑/科技/政策/升级/永恒/成就/事件/局域资源）
├── 引擎层（纯逻辑，不依赖 DOM）
│   ├── data.js             GameState 状态结构初始化
│   ├── utils.js            工具函数（格式化/解锁条件/可见性刷新/随机种子）
│   ├── core.js             GameEngine：购买建筑/研究科技/购买升级/政策/永恒/行动
│   ├── production.js       ProductionEngine：产量/上限/效率迭代计算
│   ├── effectsManager.js   EffectsManager：效果注册与倍率聚合
│   ├── tradeEngine.js      TradeEngine：贸易系统（持续贸易/单次交易/热度）
│   ├── queue.js            购买队列（引擎侧：入队/出队/自动执行）
│   ├── gameloop.js         GameLoop：200ms 真实时间循环，驱动资源/天数/事件/队列
│   ├── logic.js            重置逻辑（软重置/核弹/真空衰变/共生/奇点/意识上传/硬重置）
│   ├── saveLoad.js         存档/读档/加密导出/导入
│   ├── formulas.js         全部游戏公式的集中定义
│   ├── recourcesManager.js 资源增减/消耗/负担时间估算
│   ├── eventEffects.js     随机事件快照与即时效果
│   ├── debug.js            控制台调试工具（debugUnlockTech / debugBuild 等）
│   └── changeLog.js        更新日志数据
└── ui/                     Vue 3 组件层（只读 GameState，响应式驱动渲染）
    ├── common.js           UI 全局状态（选项卡/悬停高亮/修饰键/Tooltip）+ 组件注册表
    ├── app.js              根组件：三栏布局 + 面板容器 + 日期/季节/幸福度
    ├── index.js            Vue 应用装配 + no-op 兼容桩（renderAll/refreshUI 等）
    ├── resourceBar.js      资源条（含悬浮贡献详情）
    ├── actions.js          行动面板
    ├── tabs.js             主选项卡（按解锁状态显示/隐藏）
    ├── buildings.js        建筑面板（大分类/类型分组/模式切换/加减/购买）
    ├── tech.js             科技面板（技术/挑战/升级子选项卡）
    ├── policy.js           政策面板
    ├── trade.js            贸易面板
    ├── crystal.js          晶体面板
    ├── permanent.js        永恒升级面板
    ├── achievements.js     成就面板
    ├── reset.js            选项面板（重置/存档/主题）
    ├── changelog.js        更新日志面板
    ├── log.js              事件日志
    ├── queue.js            购买队列显示
    ├── importModal.js      导入存档弹窗
    ├── tooltip.js          全局 Tooltip 宿主
    ├── population.js       人口信息
    └── ...（组件按需扩展）
```

## 架构说明

- **引擎与 UI 解耦**：引擎层（根目录 JS）只操作 `GameState`，不触碰 DOM；`renderAll()` / `refreshUI()` 等旧渲染入口保留为 no-op 兼容桩（见 `ui/index.js`），保证引擎调用安全。
- **响应式渲染**：`main.js` 在启动时执行 `GameState = Vue.reactive(GameState)`，引擎对状态的任何修改都会被 Vue 追踪并自动驱动界面更新，不再需要手动全量重建 DOM。
- **组件注册**：每个 `ui/*.js` 通过 `UI.registerComponent(name, comp)` 注册，`ui/index.js` 统一装配进 Vue 应用；新增界面只需新增一个组件文件并注册。
- **Tooltip**：全局单例（`ui/tooltip.js`），通过 `v-tooltip="'静态HTML'"` 或 `v-tooltip="() => '动态HTML'"` 指令绑定。
- **键盘修饰键**：Shift=×10、Ctrl=×100、Shift+Ctrl=×1000，由 `ui/common.js` 统一管理。

## 开发辅助

- `node tools/check-templates.js`：校验全部 Vue 组件模板可编译（无需浏览器）。
- `node tools/smoke/smoke.js`：jsdom 冒烟测试（加载→渲染→交互→存档），需先 `npm install jsdom`。

## 贡献指南

欢迎任何形式的贡献！请通过以下流程参与：

1. **Fork 项目**：点击 GitHub 页面右上角的「Fork」按钮，将代码复制到你的账号下。
2. **创建分支**：在你 Fork 的仓库中创建一个新分支（分支名应简要说明改动内容，如 `add-new-building`）。
3. **编写代码**：在分支上进行修改，保持现有代码风格和中文注释。
4. **测试**：在本地运行测试，确保不破坏现有游戏逻辑（尤其是存档读档机制）。
5. **提交 Pull Request**：回到本项目主页，点击「New Pull Request」，选择你的分支并提交，在描述中说明改动内容。

### 注意事项
- 若添加新建筑、科技，请参考现有数值体系，保持游戏平衡。
- UI 文本及注释请使用**中文**，保持统一风格。
- 如有疑问，可先提交 Issue 进行讨论。

感谢你的参与！
