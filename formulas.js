// formulas.js - 所有游戏计算公式的集中定义
const Formulas = (function() {

    // ========== 重置收益 ==========
    /**
     * 计算核弹重置获得的遗物数量
     * @param {number} scienceCap - 当前科学上限
     * @param {number} acceleratorCount - 粒子加速器数量（包括未激活）
     * @param {number} populationCap - 当前人口容量（新增）
     * @returns {number}
     */
    function calcRelicGainFromNuke(scienceCap, acceleratorCount = 0, populationCap = 0) {
        if (scienceCap <= 0) return 0;
        const baseGain = Math.pow(Math.log(scienceCap + 1), 2);
        const multiplier = 1 + acceleratorCount * 0.02;
        const populationBonus = populationCap / 15;
        return Math.floor((baseGain + populationBonus)*multiplier);
    }


    /**
     * 计算真空衰变获得的额外遗物（核弹的两倍）
     * @param {number} scienceCap - 当前科学上限
     * @param {number} acceleratorCount - 粒子加速器数量
     * @param {number} populationCap - 当前人口容量
     */
    function calcRelicGainFromVacuum(scienceCap, acceleratorCount = 0, populationCap = 0) {
        return calcRelicGainFromNuke(scienceCap, acceleratorCount, populationCap) * 2;
    }


    // ========== 贸易 ==========
    /**
     * 计算市场单次交易量（金等值）
     */
    function calcMarketTradeVolume(marketActive = 0, starMarketActive = 0) {
        return marketActive * 50 + starMarketActive * 10000;
    }

    /**
     * 计算购买资源所需的金和获得的资源量
     */
    function calcBuyResourceParams(volume, resourceValue, heat = 1.0) {
        const costGold = volume * heat;
        const gainResource = volume / resourceValue;
        return { costGold, gainResource };
    }

    /**
     * 计算出售资源消耗的资源量和获得的金
     */
    function calcSellResourceParams(volume, resourceValue, heat = 1.0, sellRatio = 0.8) {
        const sellAmount = volume / resourceValue;
        const gainGold = volume * heat * sellRatio;
        return { sellAmount, gainGold };
    }

    // ========== 晶体系统 ==========
    /**
     * 根据军备数量计算晶体品质
     */
    function calcCrystalQuality(armsAmount) {
        if (armsAmount < 100) return 0;
        return Math.log10(armsAmount / 100);
    }

    /**
     * 计算晶体词条数量
     */
    function calcCrystalEffectCount(quality) {
        return Math.floor(Math.min(10,2 + quality * randomSeeded()*randomSeeded() * 2.8));
    }

    /**
     * 计算晶体词条的基础数值（未应用品质和正负）
     */
    function calcCrystalEffectBaseValue(quality, baseMin = 0.01, baseMax = 0.11) {
        const base = baseMin + randomSeeded() * (baseMax - baseMin);
        return base * (0.3 + quality * 0.7);
    }

    /**
     * 计算晶体词条为正面效果的概率
     */
    function calcCrystalPositiveChance(quality) {
        return Math.min(0.60, 0.4 + quality * 0.04);
    }

    /**
     * 战争失败概率
     */
    function calcWarFailChance(armsAmount) {
        if (armsAmount < 100) return 1.0;
        return Math.max(0.1, 1 - 0.3 * Math.log10(armsAmount / 100 + 1));
    }

    function calcHappinessSoftCapBase(state) {
        const singularityCount = ResourcesManager.getAmount("奇点");
        const hasUpgrade = state.permanent["幸福度I"]?.researched;
        const more = Math.sqrt(singularityCount)*10;
        return 500 + (hasUpgrade ? more : 0);
    }
    function calcHappinessSoftCap(happiness, state) {
        const softCap = calcHappinessSoftCapBase(state);
        if (happiness <= softCap) return happiness;
        return softCap -100+ 200*Math.sqrt(0.25+0.005*(happiness - softCap));
    }
    // 公开 API
    return {
        // 重置收益
        calcRelicGainFromNuke,
        calcRelicGainFromVacuum,
        // 贸易
        calcMarketTradeVolume,
        calcBuyResourceParams,
        calcSellResourceParams,

        // 晶体
        calcCrystalQuality,
        calcCrystalEffectCount,
        calcCrystalEffectBaseValue,
        calcCrystalPositiveChance,
        calcWarFailChance,
        calcHappinessSoftCap,
        calcHappinessSoftCapBase,

    };
})();

window.Formulas = Formulas;