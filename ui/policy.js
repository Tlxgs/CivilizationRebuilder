// ui/policy.js
function getPolicyOptionTooltip(policyGroup, optionKey) {
    const policy = GameState.policies[policyGroup];
    if (!policy) return "";
    const option = policy.options[optionKey];
    if (!option) return "";
    
    const cost = option.price || 0;
    let html = `<strong>${optionKey}</strong><br>`;
    if (cost > 0) html += `消耗: ${cost} 政策点<br>`;
    else html += `消耗: 0 政策点<br>`;
    
    const effects = [];
    if (option.prodFactor) {
        for (let [building, factor] of Object.entries(option.prodFactor)) {
            if (factor > 0) effects.push(`${building} 产量 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 产量 ${(factor * 100).toFixed(0)}%`);
        }
    }
    if (option.consFactor) {
        for (let [building, factor] of Object.entries(option.consFactor)) {
            if (factor > 0) effects.push(`${building} 消耗 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 消耗 ${(factor * 100).toFixed(0)}%`);
        }
    }
    if (option.capFactor) {
        for (let [building, factor] of Object.entries(option.capFactor)) {
            if (factor > 0) effects.push(`${building} 上限 +${(factor * 100).toFixed(0)}%`);
            else if (factor < 0) effects.push(`${building} 上限 ${(factor * 100).toFixed(0)}%`);
        }
    }
    
    if (effects.length === 0) {
        html += "无特殊效果";
    } else {
        html += "<br><strong>效果：</strong><br>" + effects.join("<br>");
    }
    return html;
}

function renderPolicyPanel() {
    const panel = document.getElementById('panel-policy');
    let hasAny = false;
    let html = '';
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        if (!pol.visible) continue;
        hasAny = true;
        html += `<div class="policy-group"><div class="policy-title">${p}</div>`;
        for (let opt in pol.options) {
            const optData = pol.options[opt];
            const isActive = (pol.activePolicy === opt);
            html += `<div class="policy-option" data-group="${p}" data-option="${opt}">
                        <label class="radio-label">
                            <input type="radio" name="${p}" value="${opt}" ${isActive ? 'checked' : ''}>
                            <span class="policy-option-name">${opt}</span>
                        </label>
                    </div>`;
        }
        html += '</div>';
    }
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用政策</p>';
        return;
    }
    panel.innerHTML = html;
    
    document.querySelectorAll('.policy-option').forEach(container => {
        const group = container.dataset.group;
        const option = container.dataset.option;
        const tooltipText = getPolicyOptionTooltip(group, option);
        container.addEventListener('mouseenter', () => {
            showTooltip(container, tooltipText);
        });
    });
}
window.renderPolicyPanel = renderPolicyPanel;