// formulas.js - 所有游戏计算公式的集中定义
const Formulas = (function() {
    // ========== 建筑与升级价格 ==========
    /**
     * 计算建筑购买价格
     * @param {Object} basePrice - 基础价格对象 {资源: 数量}
     * @param {number} baseGrowth - 基础增长率（如 1.15）
     * @param {number} count - 当前建筑数量
     * @param {number} costMultiplier - 成本乘数（来自永恒升级，默认1）
     * @returns {Object} 实际价格对象
     */
    function calcBuildingPrice(basePrice, baseGrowth, count, costMultiplier = 1.0) {
        const effectiveGrowth = 1 + (baseGrowth - 1) * costMultiplier;
        const price = {};
        for (let r in basePrice) {
            price[r] = Math.floor(basePrice[r] * Math.pow(effectiveGrowth, count));
        }
        return price;
    }

    /**
     * 计算升级价格
     * @param {Object} basePrice - 基础价格
     * @param {number} baseGrowth - 基础增长率
     * @param {number} level - 当前等级
     * @param {number} costMultiplier - 成本乘数
     * @returns {Object} 实际价格
     */
    function calcUpgradePrice(basePrice, baseGrowth, level, costMultiplier = 1.0) {
        const effectiveGrowth = 1 + (baseGrowth - 1) * costMultiplier;
        const price = {};
        for (let r in basePrice) {
            price[r] = Math.floor(basePrice[r] * Math.pow(effectiveGrowth, level));
        }
        return price;
    }

    // ========== 重置收益 ==========
    /**
     * 计算核弹重置获得的遗物数量
     * @param {number} scienceCap - 当前科学上限
     * @param {number} acceleratorCount - 粒子加速器数量（包括未激活）
     * @returns {number}
     */
    function calcRelicGainFromNuke(scienceCap, acceleratorCount = 0) {
        if (scienceCap <= 0) return 0;
        const baseGain = Math.floor(Math.pow(Math.log(scienceCap + 1), 2));
        const multiplier = 1 + acceleratorCount * 0.02;
        return Math.floor(baseGain * multiplier);
    }

    /**
     * 计算真空衰变获得的额外遗物（核弹的两倍）
     */
    function calcRelicGainFromVacuum(scienceCap, acceleratorCount = 0) {
        return calcRelicGainFromNuke(scienceCap, acceleratorCount) * 2;
    }

    // ========== 幸福度相关 ==========

    /**
     * 计算幸福度对产量的影响系数
     * @param {number} happiness - 当前幸福度百分比
     * @returns {number}
     */
    function calcHappinessFactor(happiness) {
        return happiness / 100;
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

    // ========== 热度衰减 ==========
    /**
     * 计算热度随时间衰减后的值
     * @param {number} heat - 当前热度
     * @param {number} deltaSec - 时间增量（秒）
     * @param {number} decayRate - 衰减速率（每秒衰减比例）
     */
    function calcHeatDecay(heat, deltaSec, decayRate = 0.001) {
        if (heat > 1) {
            return Math.max(1, heat - heat * decayRate * deltaSec);
        } else if (heat < 1) {
            return Math.min(1, heat + heat * decayRate * deltaSec);
        }
        return heat;
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
        return Math.floor(2 + quality * Math.random() * 3);
    }

    /**
     * 计算晶体词条的基础数值（未应用品质和正负）
     */
    function calcCrystalEffectBaseValue(quality, baseMin = 0.01, baseMax = 0.11) {
        const base = baseMin + Math.random() * (baseMax - baseMin);
        return base * (0.3 + quality * 0.7);
    }

    /**
     * 计算晶体词条为正面效果的概率
     */
    function calcCrystalPositiveChance(quality) {
        return Math.min(0.8, 0.4 + quality * 0.15);
    }

    /**
     * 战争失败概率
     */
    function calcWarFailChance(armsAmount) {
        if (armsAmount < 100) return 1.0;
        return Math.max(0.1, 1 - 0.3 * Math.log10(armsAmount / 100 + 1));
    }

    // ========== 杂项 ==========
    /**
     * 资源产量贡献值（用于显示，实际计算由 modifiers 系统处理）
     */
    function calcBuildingProduction(resource, baseValue, activeCount, prodFactor, happinessFactor, eventMultiplier = 1.0) {
        return baseValue * activeCount * prodFactor * happinessFactor * eventMultiplier;
    }

    function calcBuildingConsumption(resource, baseValue, activeCount, consFactor) {
        return baseValue * activeCount * consFactor;
    }

    function calcBuildingCapProvide(resource, baseValue, activeCount, capFactor) {
        return baseValue * activeCount * capFactor;
    }

    // 公开 API
    return {
        // 价格
        calcBuildingPrice,
        calcUpgradePrice,
        // 重置收益
        calcRelicGainFromNuke,
        calcRelicGainFromVacuum,
        // 幸福度
        calcHappinessFactor,
        // 贸易
        calcMarketTradeVolume,
        calcBuyResourceParams,
        calcSellResourceParams,
        // 热度
        calcHeatDecay,
        // 晶体
        calcCrystalQuality,
        calcCrystalEffectCount,
        calcCrystalEffectBaseValue,
        calcCrystalPositiveChance,
        calcWarFailChance,
        // 生产计算辅助
        calcBuildingProduction,
        calcBuildingConsumption,
        calcBuildingCapProvide
    };
})();

window.Formulas = Formulas;