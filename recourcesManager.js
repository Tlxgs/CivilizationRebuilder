// resourcesManager.js

const ResourcesManager = (function() {
    /**
     * 
     * @param {string} resourceID 资源名 
     * @returns 是否合法
     */
    function isValid(resourceID){
        if (!GameState.resources)
        {
            console.error("资源未初始化");
            return false;
        }
        if (!GameState.resources[resourceID])
        {
            console.error(`${resourceID}资源不存在`);
            return false;
        }
        return true;

    }
    /**
     * 获取资源数量
     * @param {string} resourceID 资源名
     * @returns {number} 资源数量
     */
    function getAmount(resourceID){
        if (!isValid(resourceID))return 0;
        const amount=GameState.resources[resourceID]?.amount||0;
        return amount;
    }
    /**
     * 获取资源上限
     * @param {string} resourceID 资源名
     * @returns {number} 上限值
     */
    function getCap(resourceID){
        if (!isValid(resourceID))return 0;
        const cap=GameState.resources[resourceID]?.cap||0;
        return cap;
    }
    /**
     * 增加单个资源（内部方法）
     * @param {string} resourceID 资源名 
     * @param {number} addAmount 增加数量（可为负）
     * @returns 是否成功
     */
    function addSingle(resourceID, addAmount) {
        if (!isValid(resourceID)) return false;
        let res = GameState.resources[resourceID];
        res.amount += addAmount;
        if (res.amount > res.cap) res.amount = res.cap;
        if (res.amount < 0) res.amount = 0;
        if (res.amount > 0) res.visible = true;
        return true;
    }

    /**
     * 批量增加资源（基于 map）
     * @param {Object.<string, number>} resourceMap - 资源名 -> 增加量
     * @returns 是否全部成功
     */
    function add(resourceMap) {
        for (let r in resourceMap) {
            if (!addSingle(r, resourceMap[r])) {console.trace();return false;}
        }
        return true;
    }
    /**
     * 消耗资源
     * @param {string} resourceID 资源名
     * @param {number} consumeAmount 消耗量
     * @param {boolean} isForced 是否强制消耗
     * @returns 是否成功消耗
     */
    function consumeSingle(resourceID,consumeAmount,isForced=false){
        if (!isValid(resourceID)) return false;
        if (!isForced){
            if (getAmount(resourceID)<consumeAmount)return false;
        }
        addSingle(resourceID,-consumeAmount);
    }
    function canAfford(costMap) {
        for (let r in costMap) {
            if (getAmount(r) < costMap[r]) return false;
        }
        return true;
    }

    function consume(costMap) {
        if (!canAfford(costMap)) return false;
        for (let r in costMap) {
            consumeSingle(r,costMap[r]);
        }
        return true;
    }
    /**
     * 计算买得起某个 costMap 的预估时间
     * @param {Object.<string, number>} costMap
     * @returns {{ maxTime: number, parts: string[], allPossible: boolean }}
     */
    function getTimeToAfford(costMap) {
        const speed = GameState.speed || 1;
        let maxTime = 0;
        let parts = [];
        let allPossible = true;
        for (let r in costMap) {
            const needed = costMap[r];
            const current = getAmount(r);
            const deficit = needed - current;
            if (deficit <= 0) continue;
            const production = (GameState.resources[r]?.production || 0); // 游戏秒产量
            const effectiveProd = production * speed;                     // 真实秒产量
            if (effectiveProd <= 1e-9) {
                allPossible = false;
            } else {
                const seconds = deficit / effectiveProd;
                parts.push(`${r}: ${formatTime(seconds)}`);
                if (seconds > maxTime) maxTime = seconds;
            }
        }
        return { maxTime, parts, allPossible };
    }

    /**
     * 返回可直接显示的时间提示字符串
     */
    function getAffordabilityTimeText(costMap) {
        const { maxTime, parts, allPossible } = getTimeToAfford(costMap);
        if (parts.length === 0) return '';
        let text = '预计还需: ';

        if (allPossible) {
            text += `${formatTime(maxTime)}`;
        }
        return text;
    }
    return {
        isValid,
        add,
        consume,
        getAmount,
        getCap,
        consumeSingle,
        canAfford,
        getTimeToAfford,        // 新增
        getAffordabilityTimeText // 新增
    };
})();
