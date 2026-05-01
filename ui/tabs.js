// ui/tabs.js
function updateTabsVisibility() {
    // 升级标签
    let hasUpgrade = false;
    for (let u in GameState.upgrades) {
        if (GameState.upgrades[u].visible) {
            hasUpgrade = true;
            break;
        }
    }
    const upgradeTab = document.querySelector('.tab-btn[data-tab="upgrade"]');
    if (upgradeTab) upgradeTab.style.display = hasUpgrade ? '' : 'none';

    // 政策标签
    let hasPolicy = false;
    for (let p in GameState.policies) {
        if (GameState.policies[p].visible) {
            hasPolicy = true;
            break;
        }
    }
    const policyTab = document.querySelector('.tab-btn[data-tab="policy"]');
    if (policyTab) policyTab.style.display = hasPolicy ? '' : 'none';

    // 贸易标签
    const market = GameState.buildings["市场"];
    const hasTrade = market && market.visible;
    const tradeTab = document.querySelector('.tab-btn[data-tab="trade"]');
    if (tradeTab) tradeTab.style.display = hasTrade ? '' : 'none';

    // 晶体标签
    const hasCrystalTab = GameState.techs["军事理论"]?.researched || false;
    const crystalTab = document.querySelector('.tab-btn[data-tab="crystal"]');
    if (crystalTab) crystalTab.style.display = hasCrystalTab ? '' : 'none';

    // 永恒标签
    const relicAmount = GameState.resources["遗物"]?.amount || 0;
    let hasResearchedPermanent = false;
    for (let p in GameState.permanent) {
        if (GameState.permanent[p].researched) {
            hasResearchedPermanent = true;
            break;
        }
    }
    const hasPermanent = (relicAmount > 0) || hasResearchedPermanent;
    const permanentTab = document.querySelector('.tab-btn[data-tab="permanent"]');
    if (permanentTab) permanentTab.style.display = hasPermanent ? '' : 'none';

    const changelogTab = document.querySelector('.tab-btn[data-tab="changelog"]');
    if (changelogTab) changelogTab.style.display = '';
    const achievementsTab = document.querySelector('.tab-btn[data-tab="achievements"]');
    if (achievementsTab) achievementsTab.style.display = ''; // 始终显示
    // 如果当前激活的标签被隐藏，自动切换到第一个可见标签
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.style.display === 'none') {
        const firstVisibleTab = document.querySelector('.tab-btn:not([style*="display: none"])');
        if (firstVisibleTab) {
            firstVisibleTab.click();
        } else {
            const buildingTab = document.querySelector('.tab-btn[data-tab="building"]');
            if (buildingTab) buildingTab.click();
        }
    }
}
window.updateTabsVisibility = updateTabsVisibility;