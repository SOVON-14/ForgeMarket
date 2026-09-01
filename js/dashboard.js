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
        // Simulate API call
        // const response = await fetch('/api/v1/dashboard/stats');
        // const data = await response.json();

        // Mock data
        const mockStats = {
            totalOrders: 8,
            unreadMessages: 3,
            reviewsGiven: 5,
            favoritesCount: 2
        };

        document.getElementById('totalOrders').textContent = mockStats.totalOrders;
        document.getElementById('unreadMessages').textContent = mockStats.unreadMessages;
        document.getElementById('reviewsGiven').textContent = mockStats.reviewsGiven;

        // Load favorites from localStorage
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
        // Simulate API call
        // const response = await fetch('/api/v1/orders/recent');
        // const data = await response.json();

        // Mock data
        const mockOrders = [
            { id: 'ORD-0008', title: 'Portail en fer forgé', status: 'en_fabrication', artisan: 'Kofi A.' },
            { id: 'ORD-0007', title: 'Structure métallique', status: 'finalisee', artisan: 'Komlan M.' },
            { id: 'ORD-0006', title: 'Réparation toiture', status: 'en_livraison', artisan: 'Yawo K.' }
        ];

        recentOrders.innerHTML = mockOrders.map(order => `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-name">${order.id}</div>
                    <div class="item-details">${order.title} • ${order.artisan}</div>
                </div>
                <span class="badge badge-${getStatusBadgeClass(order.status)}">${order.status}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
        recentOrders.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Recent Messages
async function loadRecentMessages() {
    const recentMessages = document.getElementById('recentMessages');

    try {
        // Simulate API call
        // const response = await fetch('/api/v1/messages/recent');
        // const data = await response.json();

        // Mock data
        const mockMessages = [
            { id: 1, artisan: 'Kofi A.', lastMessage: 'Bonjour, je suis disponible...', time: '2h' },
            { id: 2, artisan: 'Komlan M.', lastMessage: 'Le devis est prêt', time: '1j' },
            { id: 3, artisan: 'Yawo K.', lastMessage: 'Merci pour votre confiance', time: '2j' }
        ];

        recentMessages.innerHTML = mockMessages.map(message => `
            <div class="list-item">
                <img src="https://via.placeholder.com/40/C2652A/FFFFFF?text=${message.artisan[0]}" alt="${message.artisan}" class="item-avatar">
                <div class="item-info">
                    <div class="item-name">${message.artisan}</div>
                    <div class="item-details">${message.lastMessage}</div>
                </div>
                <span class="item-details">${message.time}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent messages:', error);
        recentMessages.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Recommended Artisans
async function loadRecommendedArtisans() {
    const recommendedArtisans = document.getElementById('recommendedArtisans');

    try {
        // Simulate API call
        // const response = await fetch('/api/v1/artisans/recommended');
        // const data = await response.json();

        // Mock data
        const mockArtisans = [
            { id: 1, name: 'Kofi A.', specialty: 'Ferronnerie', rating: 4.8 },
            { id: 2, name: 'Komlan M.', specialty: 'Soudure', rating: 4.5 },
            { id: 3, name: 'Yawo K.', specialty: 'Construction métallique', rating: 4.7 }
        ];

        recommendedArtisans.innerHTML = mockArtisans.map(artisan => `
            <div class="list-item">
                <img src="https://via.placeholder.com/40/C2652A/FFFFFF?text=${artisan.name[0]}" alt="${artisan.name}" class="item-avatar">
                <div class="item-info">
                    <div class="item-name">${artisan.name}</div>
                    <div class="item-details">${artisan.specialty} • ⭐ ${artisan.rating}</div>
                </div>
                <button class="btn btn-outline btn-small" onclick="viewArtisan(${artisan.id})">Voir</button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recommended artisans:', error);
        recommendedArtisans.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// View Artisan
function viewArtisan(artisanId) {
    window.location.href = `artisan-profile.html?id=${artisanId}`;
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