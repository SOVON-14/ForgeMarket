// ForgeMarket - Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    checkAdminAccess();
    loadDashboardStats();
    loadPendingArtisans();
    loadRecentOrders();
    loadActiveDisputes();
}

// Check Admin Access
function checkAdminAccess() {
    if (typeof AppState !== 'undefined') {
        if (!AppState.isAuthenticated) {
            window.location.href = 'login.html';
        } else if (AppState.currentUser.role !== 'admin') {
            alert('Accès non autorisé. Cette page est réservée aux administrateurs.');
            window.location.href = 'index.html';
        }
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        // Simulate API call
        // const response = await fetch('/api/v1/admin/stats');
        // const data = await response.json();

        // Mock data
            const response = await fetch('/api/v1/admin-dashboard.php');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Statistiques indisponibles');
            const mockStats = result.data.stats;

        // Animate numbers
        animateNumber('totalUsers', mockStats.totalUsers);
        animateNumber('totalArtisans', mockStats.totalArtisans);
        animateNumber('totalOrders', mockStats.totalOrders);
        document.getElementById('totalRevenue').textContent = formatCurrency(mockStats.totalRevenue);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Pending Artisans
async function loadPendingArtisans() {
    const pendingArtisans = document.getElementById('pendingArtisans');

    try {
        // Simulate API call
        // const response = await fetch('/api/v1/admin/artisans/pending');
        // const data = await response.json();

        // Mock data
            const response = await fetch('/api/v1/admin-dashboard.php');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Artisans indisponibles');
            const mockArtisans = result.data.pendingArtisans;

        pendingArtisans.innerHTML = mockArtisans.map(artisan => `
            <div class="list-item">
                <img src="https://via.placeholder.com/40/C2652A/FFFFFF?text=${artisan.name[0]}" alt="${artisan.name}" class="item-avatar">
                <div class="item-info">
                    <div class="item-name">${artisan.name}</div>
                    <div class="item-details">${artisan.specialty} • Soumis le ${formatDate(artisan.submittedAt)}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary btn-small" onclick="approveArtisan(${artisan.id})">Approuver</button>
                    <button class="btn btn-outline btn-small" onclick="rejectArtisan(${artisan.id})">Refuser</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading pending artisans:', error);
        pendingArtisans.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    const recentOrders = document.getElementById('recentOrders');

    try {
        // Simulate API call
        // const response = await fetch('/api/v1/admin/orders/recent');
        // const data = await response.json();

        // Mock data
            const response = await fetch('/api/v1/admin-dashboard.php');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Commandes indisponibles');
            const mockOrders = result.data.recentOrders;

        recentOrders.innerHTML = mockOrders.map(order => `
            <div class="list-item">
                <div class="item-info">
                        <div class="item-name">Commande #${order.id}</div>
                        <div class="item-details">${escapeHtml(order.client)} · ${escapeHtml(order.artisan)}</div>
                </div>
                <div class="item-actions">
                    <span class="badge badge-${getStatusBadgeClass(order.status)}">${order.status}</span>
                    <span class="item-details">${formatCurrency(order.amount)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
        recentOrders.innerHTML = '<p class="text-center">Erreur de chargement</p>';
    }
}

// Load Active Disputes
async function loadActiveDisputes() {
    const activeDisputes = document.getElementById('activeDisputes');

    try {
        // Simulate API call
        // const response = await fetch('/api/v1/admin/disputes/active');
        // const data = await response.json();

        // Mock data
            const response = await fetch('/api/v1/admin-dashboard.php');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Litiges indisponibles');
            const mockDisputes = result.data.activeDisputes;

        activeDisputes.innerHTML = mockDisputes.map(dispute => `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-name">${dispute.id} - ${dispute.type}</div>
                    <div class="item-details">${dispute.order} • ${dispute.client} vs ${dispute.artisan}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary btn-small" onclick="handleDispute('${dispute.id}')">Gérer</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading active disputes:', error);
        activeDisputes.innerHTML = '<p class="text-center">Aucun litige en cours</p>';
    }
}

// Admin Actions
function approveArtisan(artisanId) {
    if (confirm('Voulez-vous approuver cet artisan ?')) {
        console.log('Approving artisan:', artisanId);
        // In real app, call API to approve
        loadPendingArtisans();
    }
}

function rejectArtisan(artisanId) {
    if (confirm('Voulez-vous refuser cet artisan ?')) {
        const reason = prompt('Motif du refus :');
        if (reason) {
            console.log('Rejecting artisan:', artisanId, 'Reason:', reason);
            // In real app, call API to reject with reason
            loadPendingArtisans();
        }
    }
}

function handleDispute(disputeId) {
    window.location.href = `admin-dispute-details.html?id=${disputeId}`;
}

function exportReport() {
    alert('Export du rapport en cours... (fonctionnalité à venir)');
}

function viewAuditLog() {
    window.location.href = 'admin-audit.html';
}

// Utility Functions
function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 60;
    const increment = targetNumber / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= targetNumber) {
            element.textContent = targetNumber.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

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

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character])); }