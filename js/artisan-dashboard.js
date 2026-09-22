document.addEventListener('DOMContentLoaded', () => {
    loadArtisanProfile();
    loadArtisanOrders();
    loadArtisanQuotes();
    document.getElementById('artisanProfileForm').addEventListener('submit', saveArtisanProfile);
});

async function loadArtisanProfile() {
    try {
        const response = await fetch('/api/v1/artisans/profile.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Profil indisponible');
        const profile = result.data;
        if (!profile) { document.getElementById('profileStatus').textContent = 'Complétez votre profil pour commencer.'; return; }
        document.getElementById('businessName').value = profile.business_name;
        document.getElementById('category').value = profile.category;
        document.getElementById('city').value = profile.city;
        document.getElementById('address').value = profile.address;
        document.getElementById('yearsExperience').value = profile.years_experience;
        document.getElementById('bio').value = profile.bio;
        document.getElementById('isAvailable').checked = Boolean(profile.is_available);
        document.getElementById('profileStatus').textContent = `Statut du profil : ${profile.verification_status}`;
    } catch (error) { document.getElementById('profileStatus').textContent = error.message; }
}

async function saveArtisanProfile(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    data.yearsExperience = Number(data.yearsExperience);
    data.isAvailable = document.getElementById('isAvailable').checked;
    try {
        const response = await fetch('/api/v1/artisans/profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Enregistrement impossible');
        showNotification(result.message, 'success');
        await loadArtisanProfile();
    } catch (error) { showNotification(error.message, 'error'); }
}

async function loadArtisanOrders() {
    const container = document.getElementById('artisanOrders');
    try {
        const response = await fetch('/api/v1/orders.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Commandes indisponibles');
        const orders = result.data || [];
        
        container.textContent = '';
        if (orders.length) {
            orders.slice(0, 10).forEach(order => {
                container.appendChild(renderOrder(order));
            });
        } else {
            const noDataElement = document.createElement('p');
            noDataElement.className = 'text-center';
            noDataElement.textContent = 'Aucune commande.';
            container.appendChild(noDataElement);
        }
        document.getElementById('ordersCount').textContent = orders.length;
    } catch (error) {
        container.textContent = '';
        const errorElement = document.createElement('p');
        errorElement.className = 'text-center';
        errorElement.textContent = error.message;
        container.appendChild(errorElement);
    }
}

function renderOrder(order) {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';
    
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = `Commande #${order.id}`;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    itemDetails.textContent = `${order.title} · ${order.client}`;
    
    itemInfo.appendChild(itemName);
    itemInfo.appendChild(itemDetails);
    
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.textContent = order.status;
    
    div.appendChild(itemInfo);
    div.appendChild(statusBadge);
    
    return div;
}

async function loadArtisanQuotes() {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    const section = document.createElement('section');
    section.className = 'dashboard-card';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    const headerTitle = document.createElement('h2');
    headerTitle.textContent = 'Appels d\'offres';
    cardHeader.appendChild(headerTitle);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.id = 'artisanQuotes';
    
    const loadingElement = document.createElement('p');
    loadingElement.className = 'text-center';
    loadingElement.textContent = 'Chargement...';
    cardBody.appendChild(loadingElement);
    
    section.appendChild(cardHeader);
    section.appendChild(cardBody);
    grid.prepend(section);

    try {
        const response = await fetch('/api/v1/artisan-quotes.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Appels d\'offres indisponibles');
        const quotes = result.data || [];
        
        cardBody.textContent = '';
        if (quotes.length) {
            quotes.forEach(quote => {
                cardBody.appendChild(renderQuote(quote));
            });
        } else {
            const noDataElement = document.createElement('p');
            noDataElement.className = 'text-center';
            noDataElement.textContent = 'Aucun appel d\'offres disponible.';
            cardBody.appendChild(noDataElement);
        }
    } catch (error) {
        cardBody.textContent = '';
        const errorElement = document.createElement('p');
        errorElement.className = 'text-center';
        errorElement.textContent = error.message;
        cardBody.appendChild(errorElement);
    }
}

function renderQuote(quote) {
    const article = document.createElement('article');
    article.className = 'list-item';
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';
    
    const itemName = document.createElement('div');
    itemName.className = 'item-name';
    itemName.textContent = quote.title;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    
    if (quote.hasResponded) {
        itemDetails.textContent = 'Proposition deja envoyee';
        itemInfo.appendChild(itemName);
        itemInfo.appendChild(itemDetails);
        article.appendChild(itemInfo);
        return article;
    }
    
    const detailsText = `${quote.category} · ${quote.city}${quote.budget ? ` · Budget ${quote.budget} FCFA` : ''}`;
    itemDetails.textContent = detailsText;
    
    const description = document.createElement('p');
    description.textContent = quote.description;
    
    itemInfo.appendChild(itemName);
    itemInfo.appendChild(itemDetails);
    itemInfo.appendChild(description);
    
    const form = document.createElement('form');
    form.className = 'quote-response-form';
    form.onsubmit = (event) => submitQuoteResponse(event, quote.id);
    
    const amountInput = document.createElement('input');
    amountInput.className = 'form-input';
    amountInput.type = 'number';
    amountInput.name = 'proposedAmount';
    amountInput.min = '1';
    amountInput.required = true;
    amountInput.placeholder = 'Montant FCFA';
    
    const daysInput = document.createElement('input');
    daysInput.className = 'form-input';
    daysInput.type = 'number';
    daysInput.name = 'estimatedDays';
    daysInput.min = '1';
    daysInput.required = true;
    daysInput.placeholder = 'Delai en jours';
    
    const messageTextarea = document.createElement('textarea');
    messageTextarea.className = 'form-textarea';
    messageTextarea.name = 'message';
    messageTextarea.required = true;
    messageTextarea.placeholder = 'Votre proposition';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary btn-small';
    submitButton.type = 'submit';
    submitButton.textContent = 'Repondre';
    
    form.appendChild(amountInput);
    form.appendChild(daysInput);
    form.appendChild(messageTextarea);
    form.appendChild(submitButton);
    
    article.appendChild(itemInfo);
    article.appendChild(form);
    
    return article;
}

async function submitQuoteResponse(event, quoteId) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    data.action = 'respond';
    data.quoteId = quoteId;
    data.proposedAmount = Number(data.proposedAmount);
    data.estimatedDays = Number(data.estimatedDays);
    try {
        const response = await fetch('/api/v1/quote-responses.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Réponse impossible');
        showNotification(result.message, 'success');
        window.location.reload();
    } catch (error) { showNotification(error.message, 'error'); }
}
