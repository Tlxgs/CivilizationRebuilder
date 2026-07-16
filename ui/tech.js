// ui/tech.js

let currentTechSubTab = 'tech';    // 'tech', 'challenge', 'upgrade'




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

    if (!showChallenge && currentTechSubTab === 'challenge') currentTechSubTab = 'tech';
    if (!showUpgrade && currentTechSubTab === 'upgrade') currentTechSubTab = 'tech';

    let html = '<div class="sub-tabs">';
    if (showChallenge) {
        html += `<button class="sub-tab-btn${currentTechSubTab === 'challenge' ? ' active' : ''}" data-subtab="challenge">挑战</button>`;
    }
    html += `<button class="sub-tab-btn${currentTechSubTab === 'tech' ? ' active' : ''}" data-subtab="tech">技术</button>`;
    if (showUpgrade) {
        html += `<button class="sub-tab-btn${currentTechSubTab === 'upgrade' ? ' active' : ''}" data-subtab="upgrade">升级</button>`;
    }
    html += '</div>';

    if (currentTechSubTab === 'upgrade') {
        html += getUpgradePanelHTML();
        panel.innerHTML = html;

        // 升级工具提示：动态生成
        document.querySelectorAll('#panel-tech .upgrade-btn').forEach(btn => {
            const upName = btn.dataset.upgrade;
            btn.addEventListener('mouseenter', () => {
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
                showTooltip(btn, text);
            });
        });

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
    const unresearched = [];
    for (let t in GameState.techs) {
        const tech = GameState.techs[t];
        if (tech.researched) continue;
        if (tech.unlockCondition != null) {
            if (typeof tech.unlockCondition === 'function') {
                if (!tech.unlockCondition(GameState)) continue;
            }
        }
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
            const status = getAffordabilityStatus(tech.price);
            let colorClass = '';
            if (status === 'insufficient') colorClass = 'insufficient-name';
            else if (status === 'cap-exceeded') colorClass = 'unaffordable-name';
            html += `<button class="card-btn tech-btn ${colorClass}" data-tech="${t}"><b>${t}</b></button>`;
        }
    }
    html += '</div>';

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

    // 子标签绑定
    panel.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            currentTechSubTab = subtab;
            renderTechPanel();
        });
    });

    // 未研究科技 tooltip（动态生成）
    document.querySelectorAll('#panel-tech .tech-btn').forEach(el => {
        const techName = el.dataset.tech;
        el.addEventListener('mouseenter', () => {
            const tech = GameState.techs[techName];
            if (!tech) return;

            let priceHtml = '';
            if (tech.price && Object.keys(tech.price).length > 0) {
                priceHtml = Object.entries(tech.price).map(([r, amt]) => {
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
                priceHtml = '<hr>' + priceHtml;
            }

            let text = `${tech.desc}${priceHtml}`;
            showTooltip(el, text);
        });
    });

    // 已研究科技 tooltip
    document.querySelectorAll('#panel-tech .researched-item').forEach(el => {
        const techName = el.dataset.tech;
        el.addEventListener('mouseenter', () => {
            const tech = GameState.techs[techName];
            if (!tech) return;
            let text = `${tech.desc}<br>✓ 已研究`;
            showTooltip(el, text);
        });
    });
}
function refreshTechPanel() {
    const panel = document.getElementById('panel-tech');
    if (!panel) return;

    // 更新未研究科技按钮的颜色状态
    document.querySelectorAll('.tech-btn:not(.researched-item)').forEach(btn => {
        const techKey = btn.dataset.tech;
        if (!techKey) return;
        const tech = GameState.techs[techKey];
        if (!tech || tech.researched) {
            // 如果科技已研究但按钮还在未研究区域，需要完全重绘
            if (tech && tech.researched) {
                renderTechPanel();
                return;
            }
            return;
        }
        const status = getAffordabilityStatus(tech.price);
        btn.classList.remove('insufficient-name', 'unaffordable-name');
        if (status === 'insufficient') btn.classList.add('insufficient-name');
        else if (status === 'cap-exceeded') btn.classList.add('unaffordable-name');
    });
}
