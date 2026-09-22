document.addEventListener('DOMContentLoaded', loadDisputes);

async function loadDisputes() {
    const container = document.getElementById('disputesList');
    container.textContent = '';
    const loadingElement = document.createElement('p');
    loadingElement.className = 'text-center';
    loadingElement.textContent = 'Chargement des litiges...';
    container.appendChild(loadingElement);
    
    try {
        const response = await fetch('/api/v1/disputes.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Chargement impossible');
        const disputes = result.data || [];
        
        container.textContent = '';
        if (disputes.length) {
            disputes.forEach(dispute => {
                container.appendChild(renderDispute(dispute));
            });
        } else {
            const noDataElement = document.createElement('p');
            noDataElement.className = 'text-center';
            noDataElement.textContent = 'Aucun litige.';
            container.appendChild(noDataElement);
        }
    } catch (error) {
        container.textContent = '';
        const errorElement = document.createElement('p');
        errorElement.className = 'text-center';
        errorElement.textContent = error.message;
        container.appendChild(errorElement);
    }
}

function renderDispute(dispute) {
    const active = ['open', 'under_review'].includes(dispute.status);
    const article = document.createElement('article');
    article.className = 'list-item';
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';
    
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = `Litige #${dispute.id} · Commande #${dispute.order_id}`;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    itemDetails.textContent = `${dispute.client_name} vs ${dispute.artisan_name} · ${dispute.reason}`;
    
    const description = document.createElement('p');
    description.textContent = dispute.description;
    
    const statusDetails = document.createElement('div');
    statusDetails.className = 'item-details';
    statusDetails.textContent = `Statut : ${dispute.status}`;
    
    itemInfo.appendChild(itemName);
    itemInfo.appendChild(itemDetails);
    itemInfo.appendChild(description);
    itemInfo.appendChild(statusDetails);
    
    if (dispute.resolution) {
        const resolution = document.createElement('p');
        resolution.textContent = `Résolution : ${dispute.resolution}`;
        itemInfo.appendChild(resolution);
    }
    
    article.appendChild(itemInfo);
    
    if (active) {
        const itemActions = document.createElement('div');
        itemActions.className = 'item-actions';
        
        const resolveBtn = document.createElement('button');
        resolveBtn.className = 'btn btn-primary btn-small';
        resolveBtn.textContent = 'Résoudre';
        resolveBtn.onclick = () => resolveDispute(dispute.id, 'resolve');
        
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'btn btn-outline btn-small';
        rejectBtn.textContent = 'Rejeter';
        rejectBtn.onclick = () => resolveDispute(dispute.id, 'reject');
        
        itemActions.appendChild(resolveBtn);
        itemActions.appendChild(rejectBtn);
        article.appendChild(itemActions);
    }
    
    return article;
}

async function resolveDispute(disputeId, action) {
    const resolution = window.prompt('Saisissez la décision administrative :');
    if (!resolution) return;
    try {
        const response = await fetch('/api/v1/disputes.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disputeId, action, resolution }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Mise à jour impossible');
        showNotification(result.message, 'success');
        await loadDisputes();
    } catch (error) { showNotification(error.message, 'error'); }
}
