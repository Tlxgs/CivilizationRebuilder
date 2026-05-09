// debug.js
// 挂载到 window 的交互式调试工具，推荐在浏览器控制台使用

(function() {
    // ---- 内部辅助 ----
    function refresh() {
        // 刷新所有可能受影响的UI和计算
        ProductionEngine.refreshEffects();
        ProductionEngine.computeProductionAndCaps();
        ProductionEngine.updateBuildingPrices();
        ProductionEngine.updateUpgradePrices();
        refreshAllVisibility();
        renderAll();
    }

    // ========== 科技调试 ==========

    /**
     * 解锁单个科技（无视任何条件）
     * @param {string} techId
     */
    function debugUnlockTech(techId) {
        const tech = GameState.techs[techId];
        if (!tech) return console.error('科技不存在: ' + techId);
        if (tech.researched) return console.warn('科技已研究: ' + techId);
        tech.researched = true;
        // 如果该科技是挑战，自动记录（如果需要）
        if (tech.challenge) {
            if (!GameState._debugChallenges) GameState._debugChallenges = [];
            if (!GameState._debugChallenges.includes(techId)) GameState._debugChallenges.push(techId);
        }
        refresh();
        console.log('✅ 已解锁科技: ' + techId);
    }

    /**
     * 批量解锁科技
     * @param {string|string[]|function} filter - 关键字、数组或过滤函数
     */
    function debugUnlockTechs(filter) {
        let targets = [];
        if (Array.isArray(filter)) {
            targets = filter;
        } else if (typeof filter === 'function') {
            targets = Object.keys(GameState.techs).filter(filter);
        } else if (typeof filter === 'string') {
            targets = Object.keys(GameState.techs).filter(id => id.includes(filter));
        } else {
            targets = Object.keys(GameState.techs);
        }
        targets.forEach(id => {
            if (!GameState.techs[id]) return;
            if (!GameState.techs[id].researched) GameState.techs[id].researched = true;
        });
        refresh();
        console.log(`🔧 批量解锁完成，共处理 ${targets.length} 个科技`);
    }

    /**
     * 解锁所有非挑战科技
     */
    function debugUnlockAllNonChallengeTechs() {
        const count = Object.values(GameState.techs).filter(t => !t.challenge && !t.researched).length;
        Object.entries(GameState.techs).forEach(([id, t]) => {
            if (!t.challenge && !t.researched) t.researched = true;
        });
        refresh();
        console.log(`🔓 已解锁所有非挑战科技 (${count} 个)`);
    }

    /**
     * 重置指定科技的研究状态
     * @param {string} techId
     */
    function debugResetTech(techId) {
        const tech = GameState.techs[techId];
        if (!tech) return console.error('科技不存在: ' + techId);
        if (!tech.researched) return console.warn('科技未研究: ' + techId);
        tech.researched = false;
        refresh();
        console.log('🔄 已重置科技: ' + techId);
    }

    /**
     * 在控制台表格形式列出所有科技及其研究状态
     */
    function debugListTechs() {
        const data = Object.entries(GameState.techs).map(([id, t]) => ({
            ID: id,
            Researched: t.researched ? '是' : '否',
            Challenge: t.challenge ? '是' : '否'
        }));
        console.table(data);
    }

    // ========== 资源调试 ==========

    const PERMANENT_RESOURCES = ['遗物', '暗能量', '孢子', '时间晶体'];

    /**
     * 将所有非永恒资源填满到上限
     */
    function debugFillResources() {
        let count = 0;
        for (let r in GameState.resources) {
            if (PERMANENT_RESOURCES.includes(r)) continue;
            const res = GameState.resources[r];
            if (res.cap === Infinity) {
                res.amount = 1e9;   // 无上限时给一个很大的数
            } else {
                res.amount = res.cap;
            }
            if (res.amount > 0) res.visible = true;
            count++;
        }
        refresh();
        console.log(`💰 已填充 ${count} 种非永恒资源到上限`);
    }

    /**
     * 将指定资源设为指定数量
     * @param {string} resName
     * @param {number} amount
     */
    function debugSetResource(resName, amount) {
        const res = GameState.resources[resName];
        if (!res) return console.error('资源不存在: ' + resName);
        res.amount = amount;
        if (amount > 0) res.visible = true;
        refresh();
        console.log(`⚡ ${resName} 已设置为 ${amount}`);
    }

    /**
     * 获得大量永恒资源（用于测试）
     * @param {number} amount - 每种永恒资源获得的数量
     */
    function debugGiveEternal(amount = 1000) {
        PERMANENT_RESOURCES.forEach(r => {
            const res = GameState.resources[r];
            if (res) {
                res.amount += amount;
                res.visible = true;
            }
        });
        refresh();
        console.log(`🌌 已获得 ${amount} 遗物/暗能量/孢子/时间晶体`);
    }

    /**
     * 将所有资源（包括永恒）填满上限
     */
    function debugFillAll() {
        for (let r in GameState.resources) {
            const res = GameState.resources[r];
            if (res.cap === Infinity) {
                res.amount = 1e9;
            } else {
                res.amount = res.cap;
            }
            if (res.amount > 0) res.visible = true;
        }
        refresh();
        console.log('✨ 所有资源已填满上限');
    }

    // ========== 建筑调试 ==========

    /**
     * 快速建造指定建筑（免费）
     * @param {string} buildingId
     * @param {number} count
     */
    function debugBuild(buildingId, count = 1) {
        const b = GameState.buildings[buildingId];
        if (!b) return console.error('建筑不存在: ' + buildingId);
        b.count += count;
        b.active += count;
        refresh();
        console.log(`🏗️  ${buildingId} 数量 +${count}，现为 ${b.count}`);
    }

    // ---- 暴露全局命令 ----
    debugUnlockTech = debugUnlockTech;
    debugUnlockTechs = debugUnlockTechs;
    debugUnlockAllNonChallengeTechs = debugUnlockAllNonChallengeTechs;
    debugResetTech = debugResetTech;
    debugListTechs = debugListTechs;
    debugFillResources = debugFillResources;
    debugSetResource = debugSetResource;
    debugGiveEternal = debugGiveEternal;
    debugFillAll = debugFillAll;
    debugBuild = debugBuild;

    // 使用说明
    console.log(
        '%c🛠️  调试工具已加载 %c| %c在控制台输入以下命令：',
        'font-size: 1.2em; color: #4a9fc8;',
        '',
        'color: #aaa;'
    );
    console.log(
        '%c  debugUnlockTech("科技名")      - 解锁单个科技\n' +
        '  debugUnlockTechs("关键字")     - 模糊匹配批量解锁\n' +
        '  debugUnlockAllNonChallengeTechs() - 解锁全部非挑战科技\n' +
        '  debugResetTech("科技名")       - 重置科技研究\n' +
        '  debugListTechs()               - 表格列出所有科技\n' +
        '  debugFillResources()           - 填充所有非永恒资源到上限\n' +
        '  debugSetResource("资源名",数量) - 设置指定资源量\n' +
        '  debugGiveEternal(数量)         - 获得大量永恒资源\n' +
        '  debugFillAll()                 - 填满全部资源（含永恒）\n' +
        '  debugBuild("建筑名",数量)      - 免费建造\n',
        'color: #2a7faa;'
    );
    window.debugUnlockTech = debugUnlockTech;
    window.debugUnlockTechs = debugUnlockTechs;
    window.debugUnlockAllNonChallengeTechs = debugUnlockAllNonChallengeTechs;
    window.debugResetTech = debugResetTech;
    window.debugListTechs = debugListTechs;
    window.debugFillResources = debugFillResources;
    window.debugSetResource = debugSetResource;
    window.debugGiveEternal = debugGiveEternal;
    window.debugFillAll = debugFillAll;
    window.debugBuild = debugBuild;
})();
