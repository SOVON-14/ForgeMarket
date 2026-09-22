// ForgeMarket - User Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    checkAuthentication();
    loadUserData();
    loadDashboardStats();
    loadRecentOrders();
    loadRecentMessages();
    loadRecommendedArtisans();
    loadPendingActions();
    loadClientQuotes();
    loadCartCount();
}

// Check Authentication
function checkAuthentication() {
    if (typeof AppState !== 'undefined' && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Load User Data
function loadUserData() {
    if (typeof AppState !== 'undefined' && AppState.currentUser) {
        const user = AppState.currentUser;
        document.getElementById('welcomeMessage').textContent = `Bienvenue, ${user.firstName || 'Utilisateur'} !`;

        // Update progress based on completed orders
        const completedOrders = user.completedOrders || 0;
        updateProgressSection(completedOrders);
    }
}

// Update Progress Section (5 orders rule)
function updateProgressSection(completedOrders) {
    const targetOrders = 5;
    const percentage = Math.min((completedOrders / targetOrders) * 100, 100);

    document.getElementById('progressCount').textContent = `${completedOrders}/${targetOrders}`;
    document.getElementById('progressBar').style.width = `${percentage}%`;

    const progressMessage = document.getElementById('progressMessage');
    if (completedOrders >= targetOrders) {
        progressMessage.textContent = '🎉 Félicitations ! Vous avez débloqué l\'accès aux demandes de devis détaillées';
        progressMessage.classList.add('unlocked');
    } else {
        progressMessage.textContent = `Complétez ${targetOrders - completedOrders} commande(s) supplémentaire(s) pour débloquer l'accès aux demandes de devis détaillées`;
        progressMessage.classList.remove('unlocked');
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/v1/dashboard.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Statistiques indisponibles');
        const stats = result.data;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('unreadMessages').textContent = stats.unreadMessages;
        document.getElementById('reviewsGiven').textContent = stats.reviewsGiven;
        updateProgressSection(stats.completedOrders);

        const favorites = JSON.parse(localStorage.getItem('forgeMarket_favorites') || '[]');
        document.getElementById('favoritesCount').textContent = favorites.length;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    const recentOrders = document.getElementById('recentOrders');

    try {
        const response = await fetch('/api/v1/orders.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Commandes indisponibles');
        recentOrders.innerHTML = (result.data || []).slice(0, 3).map(order => `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-name">Commande #${order.id}</div>
                    <div class="item-details">${escapeHtml(order.title)} · ${escapeHtml(order.artisan)}</div>
                </div>
                <span class="badge badge-${getStatusBadgeClass(order.status)}">${order.status}</span>
            </div>
        `).join('') || '<p class="text-center">Aucune commande récente.</p>';

    } catch (error) {
        console.error('Error loading recent orders:', error);
        recentOrders.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Recent Messages
async function loadRecentMessages() {
    const recentMessages = document.getElementById('recentMessages');

    try {
        const response = await fetch('/api/v1/messages.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Messages indisponibles');
        recentMessages.innerHTML = (result.data || []).slice(0, 3).map(message => `
            <div class="list-item">
                <img src="${message.artisanAvatar}" alt="${escapeHtml(message.artisanName)}" class="item-avatar">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(message.artisanName)}</div>
                    <div class="item-details">${escapeHtml(message.lastMessage)}</div>
                </div>
                <span class="item-details">${formatTime(message.lastMessageTime)}</span>
            </div>
        `).join('') || '<p class="text-center">Aucun message récent.</p>';

    } catch (error) {
        console.error('Error loading recent messages:', error);
        recentMessages.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Recommended Artisans
async function loadRecommendedArtisans() {
    const recommendedArtisans = document.getElementById('recommendedArtisans');

    try {
        const response = await fetch('/api/v1/artisans/index.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Artisans indisponibles');
        recommendedArtisans.innerHTML = (result.data || []).slice(0, 3).map(artisan => `
            <div class="list-item">
                <img src="${artisan.image}" alt="${escapeHtml(artisan.name)}" class="item-avatar">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(artisan.name)}</div>
                    <div class="item-details">${escapeHtml(artisan.specialty)} · ${artisan.rating}/5</div>
                </div>
                <button class="btn btn-outline btn-small" onclick="viewArtisan(${artisan.id})">Voir</button>
            </div>
        `).join('') || '<p class="text-center">Aucun artisan recommandé.</p>';

    } catch (error) {
        console.error('Error loading recommended artisans:', error);
        recommendedArtisans.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

async function loadPendingActions() {
    const pendingActions = document.getElementById('pendingActions');
    if (!pendingActions) return;

    try {
        const response = await fetch('/api/v1/orders.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Commandes indisponibles');

        const orders = result.data || [];
        const actions = [];
        const awaitingConfirmation = orders.filter(order => order.status === 'en_livraison').length;
        const awaitingReview = orders.filter(order => order.status === 'finalisee').length;

        if (awaitingConfirmation > 0) {
            actions.push(`<div class="action-item"><span class="action-icon"><i class="fas fa-box"></i></span><div class="action-content"><p>${awaitingConfirmation} commande(s) à confirmer</p><a href="orders.html" class="btn btn-primary btn-small">Voir</a></div></div>`);
        }
        if (awaitingReview > 0) {
            actions.push(`<div class="action-item"><span class="action-icon"><i class="fas fa-star"></i></span><div class="action-content"><p>${awaitingReview} commande(s) à évaluer</p><a href="orders.html" class="btn btn-primary btn-small">Évaluer</a></div></div>`);
        }

        pendingActions.innerHTML = actions.join('') || '<p class="text-center">Aucune action en attente.</p>';
    } catch (error) {
        console.error('Pending actions error:', error);
        pendingActions.innerHTML = '<p class="text-center">Impossible de charger les actions.</p>';
    }
}

async function loadClientQuotes() {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    const section = document.createElement('section');
    section.className = 'dashboard-card';
    section.innerHTML = '<div class="card-header"><h2>Mes demandes de devis</h2></div><div class="card-body" id="clientQuotes"><p class="text-center">Chargement...</p></div>';
    grid.prepend(section);

    try {
        const response = await fetch('/api/v1/client-quotes.php');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Devis indisponibles');
        const quotes = result.data || [];
        document.getElementById('clientQuotes').innerHTML = quotes.length ? quotes.map(renderClientQuote).join('') : '<p class="text-center">Aucune demande de devis.</p>';
    } catch (error) {
        document.getElementById('clientQuotes').innerHTML = `<p class="text-center">${escapeHtml(error.message)}</p>`;
    }
}

function renderClientQuote(quote) {
    const responses = quote.responses || [];
    const responseHtml = responses.length ? responses.map(response => `<div class="list-item"><div class="item-info"><div class="item-name">${escapeHtml(response.artisanName)} · ${response.amount} FCFA</div><div class="item-details">${response.days} jour(s) · ${escapeHtml(response.message)}</div></div>${response.status === 'pending' && quote.status === 'open' ? `<button class="btn btn-primary btn-small" onclick="acceptQuoteResponse(${response.id})">Accepter</button>` : `<span class="item-details">${escapeHtml(response.status)}</span>`}</div>`).join('') : '<p>Aucune proposition reçue.</p>';
    return `<article class="list-item"><div class="item-info"><div class="item-name">${escapeHtml(quote.title)}</div><div class="item-details">Statut : ${escapeHtml(quote.status)} · ${responses.length} proposition(s)</div></div><div style="width: 100%;">${responseHtml}</div></article>`;
}

async function acceptQuoteResponse(responseId) {
    if (!window.confirm('Accepter cette proposition et créer la commande ?')) return;
    try {
        const response = await fetch('/api/v1/quote-responses.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', responseId }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Impossible d’accepter la proposition');
        showNotification(result.message, 'success');
        window.location.href = 'orders.html';
    } catch (error) { showNotification(error.message, 'error'); }
}

// View Artisan
function viewArtisan(artisanId) {
    window.location.href = `artisan-profile.html?id=${artisanId}`;
}

// Load Cart Count
function loadCartCount() {
    fetch('/api/v1/cart/index.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.summary) {
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = data.summary.total_items;
                }
            }
        })
        .catch(error => console.error('Error loading cart count:', error));
}

// Utility Functions
function getStatusBadgeClass(status) {
    const statusMap = {
        'en_attente': 'warning',
        'confirmee': 'info',
        'en_fabrication': 'primary',
        'en_livraison': 'secondary',
        'livree': 'success',
        'finalisee': 'success',
        'annulee': 'error'
    };
    return statusMap[status] || 'secondary';
}

function formatTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character]));
}