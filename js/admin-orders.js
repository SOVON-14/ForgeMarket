document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('ordersList');
    try {
        const response = await fetch('/api/v1/admin-orders.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Commandes indisponibles');
        
        container.textContent = '';
        if (result.data.length) {
            result.data.forEach(order => {
                container.appendChild(renderOrder(order));
            });
        } else {
            const noDataElement = document.createElement('p');
            noDataElement.className = 'text-center';
            noDataElement.textContent = 'Aucune commande.';
            container.appendChild(noDataElement);
        }
    } catch (error) {
        container.textContent = '';
        const errorElement = document.createElement('p');
        errorElement.className = 'text-center';
        errorElement.textContent = error.message;
        container.appendChild(errorElement);
    }
});

function renderOrder(order) {
    const article = document.createElement('article');
    article.className = 'list-item';
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';
    
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = `Commande #${order.id} · ${order.title}`;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    itemDetails.textContent = `${order.client} → ${order.artisan}`;
    
    itemInfo.appendChild(itemName);
    itemInfo.appendChild(itemDetails);
    
    const itemActions = document.createElement('div');
    itemActions.className = 'item-actions';
    
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.textContent = order.status;
    
    const amountDetails = document.createElement('span');
    amountDetails.className = 'item-details';
    amountDetails.textContent = `${Number(order.amount).toLocaleString('fr-FR')} FCFA`;
    
    itemActions.appendChild(statusBadge);
    itemActions.appendChild(amountDetails);
    
    article.appendChild(itemInfo);
    article.appendChild(itemActions);
    
    return article;
}
