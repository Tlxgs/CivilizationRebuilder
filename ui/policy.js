function renderPolicyPanel() {
    const panel = document.getElementById('panel-policy');
    let hasAny = false;
    let html = '';
    
    for (let p in GameState.policies) {
        const pol = GameState.policies[p];
        if (!pol.visible) continue;
        hasAny = true;
        const cfg = POLICIES_CONFIG[p];
        const policyPoints = GameState.resources["政策点"]?.amount || 0;
        const costPerUnit = cfg.costPerUnit || 1;
        
        html += `<div class="policy-group">
            <div class="policy-title">${p}: <span id="policy-val-${p}">${pol.currentValue}${pol.unit}</span></div>
            <div style="font-size:0.8rem; color: var(--text-secondary); margin-bottom:0.5rem;">${cfg.desc}</div>
            <div style="margin-bottom:0.3rem; font-size:0.75rem;">
                调整消耗: ${costPerUnit} 政策点/单位 | 当前政策点: ${formatNumber(policyPoints)}
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <button class="btn-square policy-dec" data-policy="${p}" data-amount="10">-10</button>
                <button class="btn-square policy-dec" data-policy="${p}" data-amount="1">-1</button>
                <div style="flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                    <div id="policy-bar-${p}" style="height:100%; background:var(--accent); border-radius:3px; width:${((pol.currentValue - pol.min) / (pol.max - pol.min)) * 100}%; transition:width 0.1s;"></div>
                </div>
                <button class="btn-square policy-inc" data-policy="${p}" data-amount="1">+1</button>
                <button class="btn-square policy-inc" data-policy="${p}" data-amount="10">+10</button>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color: var(--text-dim); margin-top:0.2rem;">
                <span>${pol.min}${pol.unit}</span>
                <span>${pol.max}${pol.unit}</span>
            </div>
        </div>`;
    }
    
    if (!hasAny) {
        panel.innerHTML = '<p>暂无可用政策</p>';
        return;
    }
    panel.innerHTML = html;
    
    document.querySelectorAll('.policy-inc, .policy-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = btn.dataset.policy;
            const amount = parseInt(btn.dataset.amount);
            const isInc = btn.classList.contains('policy-inc');
            const pol = GameState.policies[p];
            const newVal = isInc 
                ? Math.min(pol.max, pol.currentValue + amount)
                : Math.max(pol.min, pol.currentValue - amount);
            
            if (Core.setPolicyValue(p, newVal)) {
                document.getElementById(`policy-val-${p}`).textContent = `${newVal}${pol.unit}`;
                document.getElementById(`policy-bar-${p}`).style.width = `${((newVal - pol.min) / (pol.max - pol.min)) * 100}%`;
            } else {
                alert("政策点不足！");
            }
        });
    });
}

renderPolicyPanel = renderPolicyPanel;