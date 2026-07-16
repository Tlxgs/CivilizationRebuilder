// ui/tech.js

let currentTechSubTab = 'tech';    // 'tech', 'challenge', 'upgrade'

function getTotalActiveChallengeStars() {
    let stars = 0;
    for (let techId in GameState.techs) {
        const tech = GameState.techs[techId];
        if (tech.researched && tech.challenge && tech.challenge.star) {
            stars += tech.challenge.star;
        }
    }
    return stars;
}

function getTechAffordabilityStatus(tech) {
    const price = tech.price;
    for (let res in price) {
        const current = ResourcesManager.getAmount(res);
        const cap = ResourcesManager.getCap(res);
        const needed = price[res];
        
        if (current < needed) {
            return (cap < needed) ? 'cap-exceeded' : 'insufficient';
        }
    }
    return 'affordable';
}

function hasAnyChallenge() {
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (!tech.challenge) continue;
        if (tech.researched) return true;
        if (tech.unlockCondition) {
            if (typeof tech.unlockCondition === 'function' && tech.unlockCondition(GameState)) return true;
        } else {
            return true;
        }
    }
    return false;
}

function hasAnyUpgrade() {
    for (let u in GameState.upgrades) {
        if (GameState.upgrades[u].visible) return true;
    }
    return false;
}

function renderTechPanel() {
    const panel = document.getElementById('panel-tech');
    if (!panel) return;

    const showChallenge = hasAnyChallenge();
    const showUpgrade = hasAnyUpgrade();

    // 如果当前选中的子标签因条件消失而不可用，则自动切换到默认
    if (!showChallenge && currentTechSubTab === 'challenge') currentTechSubTab = 'tech';
    if (!showUpgrade && currentTechSubTab === 'upgrade') currentTechSubTab = 'tech';

    // 构建子标签
    let html = '<div class="sub-tabs">';
    if (showChallenge) {
        html += `<button class="sub-tab-btn${currentTechSubTab === 'challenge' ? ' active' : ''}" data-subtab="challenge">挑战</button>`;
    }
    html += `<button class="sub-tab-btn${currentTechSubTab === 'tech' ? ' active' : ''}" data-subtab="tech">技术</button>`;

    if (showUpgrade) {
        html += `<button class="sub-tab-btn${currentTechSubTab === 'upgrade' ? ' active' : ''}" data-subtab="upgrade">升级</button>`;
    }
    html += '</div>';

    // ========== 根据当前子标签生成内容 ==========
    if (currentTechSubTab === 'upgrade') {
        // 直接嵌入升级面板的 HTML
        html += getUpgradePanelHTML();
        panel.innerHTML = html;

        // 为升级按钮绑定 tooltip（与原 upgrade.js 逻辑一致）
        document.querySelectorAll('#panel-tech .upgrade-btn').forEach(btn => {
            const upName = btn.dataset.upgrade;
            const up = GameState.upgrades[upName];
            if (!up) return;

        let priceHtml = Object.entries(up.price).map(([r, amt]) => {
            const amount = GameState.resources[r]?.amount || 0;
            const enough = amount >= amt;
            const color = enough ? '' : 'red';
            let text = `${r} ${formatNumber(amt)}`;
            if (enough && amt > 0 && amount > 0) {
                const percent = ((amt / amount) * 100).toFixed(1);
                const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
                text += ` (${cleanPercent}%)`;
            }
            return `<span style="color: ${color};">${text}</span>`;
        }).join('\n');

            let effectText = '';
            for (let b in up.effect) {
                effectText += `${b} 效率 +${(up.effect[b]*100).toFixed(0)}%<br>`;
            }
            let text = `${up.desc}<hr> ${priceHtml}<hr>${effectText}`;
            btn.addEventListener('mouseenter', () => showTooltip(btn, text));
        });

        // 绑定子标签点击事件
        panel.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subtab = btn.dataset.subtab;
                currentTechSubTab = subtab;
                renderTechPanel();
            });
        });
        return;
    }

    // ------ 技术和挑战分支 ------
    // 收集未研究科技
    const unresearched = [];
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (tech.researched) continue;
        // 特殊解锁条件
        if (tech.unlockCondition != null) {
            if (typeof tech.unlockCondition === 'function') {
                if (!tech.unlockCondition(GameState)) continue;
            }
        }
        // 前置检查
        let canResearch = true;
        if (tech.prereq) {
            for (let p of tech.prereq) {
                if (!GameState.techs[p]?.researched) {
                    canResearch = false;
                    break;
                }
            }
        }
        if (!canResearch) continue;
        const isChallenge = !!tech.challenge;
        if (currentTechSubTab === 'challenge' && !isChallenge) continue;
        if (currentTechSubTab === 'tech' && isChallenge) continue;
        unresearched.push(t);
    }

    html += '<div class="grid-list">';
    if (currentTechSubTab === 'challenge') {
        const stars = getTotalActiveChallengeStars();
        const bonus = stars * 5;
        html += `<div style="width:100%; font-size:0.85rem; color: var(--text-dim); margin-bottom:0.8rem;">当前激活挑战星级：${stars}，永恒资源获取 +${bonus}%</div>`;
    }
    if (unresearched.length === 0) {
        html += '<p>暂无可用科技</p>';
    } else {
        for (let t of unresearched) {
            const tech = GameState.techs[t];
            const status = getTechAffordabilityStatus(tech);
            let colorClass = '';
            if (status === 'insufficient') colorClass = 'insufficient-name';
            else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';
            html += `<button class="card-btn tech-btn ${colorClass}" data-tech="${t}"><b>${t}</b></button>`;
        }
    }
    html += '</div>';

    // 已研究科技
    const researched = [];
    for (let t in GameState.techs) {
        if (GameState.techs[t].researched) {
            const isChallenge = !!GameState.techs[t].challenge;
            if (currentTechSubTab === 'challenge' && !isChallenge) continue;
            if (currentTechSubTab === 'tech' && isChallenge) continue;
            researched.push(t);
        }
    }

    html += '<h3>已研究</h3><div class="grid-list">';
    if (researched.length === 0) {
        html += '<p>暂无已研究科技</p>';
    } else {
        for (let t of researched) {
            html += `<span class="card-btn researched-item" data-tech="${t}">${t}</span>`;
        }
    }
    html += '</div>';

    panel.innerHTML = html;

    // 绑定子标签点击事件
    panel.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            currentTechSubTab = subtab;
            renderTechPanel();
        });
    });

    // 未研究科技 tooltip
    document.querySelectorAll('#panel-tech .tech-btn').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;
        let priceHtml = Object.entries(tech.price).map(([r, amt]) => {
            const amount = GameState.resources[r]?.amount || 0;
            const enough = amount + 1e-6 >= amt;
            const color = enough ? '' : 'red';
            let text = `${r} ${formatNumber(amt)}`;
            if (enough && amt > 0 && amount > 0) {
                const percent = ((amt / amount) * 100).toFixed(1);
                const cleanPercent = percent.endsWith('.0') ? percent.slice(0, -2) : percent;
                text += ` (${cleanPercent}%)`;
            }
            return `<span style="color: ${color};">${text}</span>`;
        }).join('\n');
        
        let text = `${tech.desc}<hr> ${priceHtml}`;
        if(priceHtml=='')text=`${tech.desc}`;
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });

    // 已研究科技 tooltip
    document.querySelectorAll('#panel-tech .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        const tech = GameState.techs[techName];
        if (!tech) return;
        let text = `${tech.desc}<br>✓ 已研究`;
        el.addEventListener('mouseenter', () => showTooltip(el, text));
    });
}

renderTechPanel = renderTechPanel;
getTechAffordabilityStatus = getTechAffordabilityStatus;