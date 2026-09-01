// ForgeMarket - Orders Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeOrdersPage();
});

let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';

function initializeOrdersPage() {
    checkAuthentication();
    loadOrders();
    initializeFilters();
}

// Check Authentication
function checkAuthentication() {
    if (typeof AppState !== 'undefined' && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Load Orders Data
async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');

    try {
        // Simulate API call - replace with actual API endpoint
        // const response = await fetch('/api/v1/orders');
        // const data = await response.json();

        // Mock data for demonstration
        const mockOrders = generateMockOrders();
        allOrders = mockOrders;
        filteredOrders = [...allOrders];

        // Update progress
        updateOrderProgress();

        // Display orders
        if (filteredOrders.length === 0) {
            ordersList.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            ordersList.classList.remove('hidden');
            emptyState.classList.add('hidden');
            displayOrders(filteredOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger vos commandes. Veuillez réessayer.</p>
                <button class="btn btn-primary" onclick="loadOrders()">Réessayer</button>
            </div>
        `;
    }
}

// Generate Mock Orders Data
function generateMockOrders() {
    const statuses = ['en_attente', 'confirmee', 'en_fabrication', 'en_livraison', 'livree', 'finalisee', 'annulee'];
    const artisans = ['Kofi A.', 'Komlan M.', 'Yawo K.', 'Afi B.'];
    const descriptions = [
        'Fabrication d\'un portail en fer forgé de 3m de large',
        'Construction d\'une structure métallique pour hangar',
        'Réparation de toiture en tôle ondulée',
        'Fabrication de fenêtres métalliques sur mesure',
        'Installation de clôture avec portail automatique'
    ];

    return Array.from({ length: 6 }, (_, i) => {
        const status = statuses[i % statuses.length];
        const artisan = artisans[i % artisans.length];
        const description = descriptions[i % descriptions.length];

        return {
            id: `ORD-${String(i + 1).padStart(4, '0')}`,
            title: description.substring(0, 50) + '...',
            description: description,
            artisan: artisan,
            artisanId: i + 1,
            status: status,
            price: Math.floor(Math.random() * 200000) + 50000,
            createdAt: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            expectedDelivery: new Date(Date.now() + ((7 - i) * 24 * 60 * 60 * 1000)).toISOString(),
            actualDelivery: status === 'finalisee' || status === 'livree' ? new Date(Date.now() - ((i - 2) * 24 * 60 * 60 * 1000)).toISOString() : null,
            address: 'Lomé, Togo',
            isDelayed: status === 'en_fabrication' && i === 2
        };
    });
}

// Display Orders
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

// Create Order Card HTML
function createOrderCard(order) {
    const statusLabels = {
        en_attente: 'En attente',
        confirmee: 'Confirmée',
        en_fabrication: 'En fabrication',
        en_livraison: 'En livraison',
        livree: 'Livrée',
        finalisee: 'Finalisée',
        annulee: 'Annulée',
        en_retard: 'En retard',
        en_litige: 'En litige'
    };

    const timelineSteps = getOrderTimelineSteps(order.status);

    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <div class="order-id">#${order.id}</div>
                    <h3 class="order-title">${order.title}</h3>
                    <div class="order-artisan">${order.artisan}</div>
                </div>
                <div class="order-status">
                    <span class="status-badge ${order.status}">${statusLabels[order.status] || order.status}</span>
                    <div class="order-date">${formatDate(order.createdAt)}</div>
                </div>
            </div>

            <div class="order-body">
                <div class="order-description">
                    ${order.description}
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <span class="order-detail-label">Prix:</span>
                        <span class="order-detail-value">${formatCurrency(order.price)}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Livraison prévue:</span>
                        <span class="order-detail-value">${formatDate(order.expectedDelivery)}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Adresse:</span>
                        <span class="order-detail-value">${order.address}</span>
                    </div>
                </div>
                <div class="order-price">
                    <div class="order-price-value">${formatCurrency(order.price)}</div>
                </div>
            </div>

            <div class="order-timeline">
                <div class="timeline-title">Avancement</div>
                <div class="timeline-steps">
                    ${timelineSteps.map(step => `
                        <div class="timeline-step ${step.status}">
                            <div class="timeline-step-circle"></div>
                            <div class="timeline-step-label">${step.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${order.isDelayed ? `
                <div class="order-warning">
                    Cette commande est en retard. L'artisan a informé d'un nouveau délai.
                </div>
            ` : ''}

            <div class="order-footer">
                <div class="order-actions">
                    ${getOrderActions(order)}
                </div>
            </div>
        </div>
    `;
}

// Get Order Timeline Steps
function getOrderTimelineSteps(currentStatus) {
    const steps = [
        { key: 'en_attente', label: 'En attente' },
        { key: 'confirmee', label: 'Confirmée' },
        { key: 'en_fabrication', label: 'Fabrication' },
        { key: 'en_livraison', label: 'Livraison' },
        { key: 'livree', label: 'Livrée' },
        { key: 'finalisee', label: 'Finalisée' }
    ];

    const statusOrder = ['en_attente', 'confirmee', 'en_fabrication', 'en_livraison', 'livree', 'finalisee'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
        let status = '';
        if (index < currentIndex) {
            status = 'completed';
        } else if (index === currentIndex) {
            status = 'active';
        }
        return { ...step, status };
    });
}

// Get Order Actions Based on Status
function getOrderActions(order) {
    const actions = [];

    switch (order.status) {
        case 'en_attente':
            actions.push(`<button class="btn btn-outline" onclick="cancelOrder('${order.id}')">Annuler</button>`);
            break;
        case 'confirmee':
        case 'en_fabrication':
            actions.push(`<button class="btn btn-outline" onclick="viewOrderDetails('${order.id}')">Détails</button>`);
            actions.push(`<button class="btn btn-outline" onclick="contactArtisan('${order.artisanId}')">Contacter</button>`);
            break;
        case 'en_livraison':
            actions.push(`<button class="btn btn-primary" onclick="confirmDelivery('${order.id}')">Confirmer réception</button>`);
            actions.push(`<button class="btn btn-outline" onclick="reportIssue('${order.id}')">Signaler problème</button>`);
            break;
        case 'livree':
            actions.push(`<button class="btn btn-primary" onclick="confirmPayment('${order.id}')">Confirmer paiement</button>`);
            actions.push(`<button class="btn btn-outline" onclick="reportIssue('${order.id}')">Signaler problème</button>`);
            break;
        case 'finalisee':
            actions.push(`<button class="btn btn-primary" onclick="leaveReview('${order.id}')">Évaluer</button>`);
            actions.push(`<button class="btn btn-outline" onclick="viewOrderDetails('${order.id}')">Détails</button>`);
            break;
        case 'annulee':
            actions.push(`<button class="btn btn-outline" onclick="viewOrderDetails('${order.id}')">Détails</button>`);
            break;
        default:
            actions.push(`<button class="btn btn-outline" onclick="viewOrderDetails('${order.id}')">Détails</button>`);
    }

    return actions.join('');
}

// Initialize Filters
function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');

            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Apply filter
            currentFilter = filter;
            applyFilter();
        });
    });
}

// Apply Filter
function applyFilter() {
    if (currentFilter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }

    displayOrders(filteredOrders);
}

// Update Order Progress (5 orders rule)
function updateOrderProgress() {
    const completedOrders = allOrders.filter(order => order.status === 'finalisee').length;
    const targetOrders = 5;
    const percentage = Math.min((completedOrders / targetOrders) * 100, 100);

    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('progressBar').style.width = `${percentage}%`;

    const progressMessage = document.getElementById('progressMessage');
    if (completedOrders >= targetOrders) {
        progressMessage.textContent = '🎉 Félicitations ! Vous avez débloqué l\'accès aux demandes de devis détaillées';
        progressMessage.classList.add('unlocked');
    } else {
        progressMessage.textContent = `Complétez ${targetOrders - completedOrders} commande(s) supplémentaire(s) pour débloquer l'accès aux demandes de devis détaillées`;
        progressMessage.classList.remove('unlocked');
    }

    // Update user session
    if (typeof AppState !== 'undefined' && AppState.currentUser) {
        AppState.currentUser.completedOrders = completedOrders;
        localStorage.setItem('forgeMarket_user', JSON.stringify(AppState.currentUser));
    }
}

// Order Actions
function cancelOrder(orderId) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
        // In real app, call API to cancel order
        console.log('Cancelling order:', orderId);
    }
}

function viewOrderDetails(orderId) {
    window.location.href = `order-details.html?id=${orderId}`;
}

function contactArtisan(artisanId) {
    window.location.href = `messages.html?artisan=${artisanId}`;
}

function confirmDelivery(orderId) {
    if (confirm('Confirmez-vous avoir reçu la commande ?')) {
        // In real app, call API to confirm delivery
        console.log('Confirming delivery:', orderId);
    }
}

function confirmPayment(orderId) {
    if (confirm('Confirmez-vous avoir effectué le paiement à l\'artisan ?')) {
        // In real app, call API to confirm payment and finalize order
        console.log('Confirming payment:', orderId);
    }
}

function reportIssue(orderId) {
    window.location.href = `dispute.html?order=${orderId}`;
}

function leaveReview(orderId) {
    window.location.href = `review.html?order=${orderId}`;
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
    }).format(amount);
}