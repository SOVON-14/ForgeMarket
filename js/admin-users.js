document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('usersList');
    try {
        const response = await fetch('/api/v1/admin-users.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Utilisateurs indisponibles');
        
        container.textContent = '';
        if (result.data.length) {
            result.data.forEach(user => {
                container.appendChild(renderUser(user));
            });
        } else {
            const noDataElement = document.createElement('p');
            noDataElement.className = 'text-center';
            noDataElement.textContent = 'Aucun utilisateur.';
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

function renderUser(user) {
    const article = document.createElement('article');
    article.className = 'list-item';
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';
    
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = `${user.first_name} ${user.last_name}`;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    itemDetails.textContent = `${user.email} · ${user.phone}`;
    
    itemInfo.appendChild(itemName);
    itemInfo.appendChild(itemDetails);
    
    const roleBadge = document.createElement('span');
    roleBadge.className = 'badge';
    roleBadge.textContent = user.role;
    
    article.appendChild(itemInfo);
    article.appendChild(roleBadge);
    
    return article;
}
