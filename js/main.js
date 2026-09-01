// ForgeMarket - Main JavaScript

// Application State
const AppState = {
    currentUser: null,
    isAuthenticated: false,
    notifications: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadUserSession();
    initializeNotifications();
    initializeForms();
    initializeSearch();
    checkAuthentication();
}

// User Session Management
function loadUserSession() {
    const savedUser = localStorage.getItem('forgeMarket_user');
    if (savedUser) {
        try {
            AppState.currentUser = JSON.parse(savedUser);
            AppState.isAuthenticated = true;
            updateUIForAuthenticatedUser();
        } catch (error) {
            console.error('Error loading user session:', error);
            localStorage.removeItem('forgeMarket_user');
        }
    }
}

function saveUserSession(user) {
    AppState.currentUser = user;
    AppState.isAuthenticated = true;
    localStorage.setItem('forgeMarket_user', JSON.stringify(user));
    updateUIForAuthenticatedUser();
}

function clearUserSession() {
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    localStorage.removeItem('forgeMarket_user');
    updateUIForAuthenticatedUser();
}

function updateUIForAuthenticatedUser() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    if (AppState.isAuthenticated) {
        navAuth.innerHTML = `
            <a href="dashboard.html" class="btn btn-outline">Mon Tableau de Bord</a>
            <button onclick="logout()" class="btn btn-primary">Déconnexion</button>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline">Connexion</a>
            <a href="register.html" class="btn btn-primary">Inscription</a>
        `;
    }
}

// Authentication Functions
function checkAuthentication() {
    const protectedRoutes = ['dashboard.html', 'orders.html', 'messages.html', 'profile.html'];
    const currentPath = window.location.pathname.split('/').pop();

    if (protectedRoutes.includes(currentPath) && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

function logout() {
    clearUserSession();
    window.location.href = 'index.html';
}

// Notification System
function initializeNotifications() {
    // Check for notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';
    notification.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Form Handling
function initializeForms() {
    const forms = document.querySelectorAll('form[data-ajax="true"]');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';
    }

    try {
        const response = await fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message || 'Opération réussie', 'success');
            if (form.dataset.redirect) {
                window.location.href = form.dataset.redirect;
            } else {
                form.reset();
            }
        } else {
            showNotification(result.error || 'Une erreur est survenue', 'error');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Soumettre';
        }
    }
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-box .btn');

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchSelect = document.querySelector('.search-select');

    if (!searchInput) return;

    const query = searchInput.value.trim();
    const category = searchSelect ? searchSelect.value : '';

    if (query) {
        const params = new URLSearchParams({
            q: query,
            category: category
        });
        window.location.href = `artisans.html?${params.toString()}`;
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (AppState.currentUser && AppState.currentUser.token) {
        defaultOptions.headers['Authorization'] = `Bearer ${AppState.currentUser.token}`;
    }

    const response = await fetch(`/api/v1${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Loading States
function showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
    element.disabled = true;
}

function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
}

// Progress Bar for 5 Orders Rule
function updateOrderProgress(currentOrders, targetOrders = 5) {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (progressBar && progressText) {
        const percentage = Math.min((currentOrders / targetOrders) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${currentOrders}/${targetOrders} commandes finalisées`;

        if (currentOrders >= targetOrders) {
            progressBar.style.backgroundColor = 'var(--success)';
            progressText.textContent = 'Accès aux demandes de devis débloqué !';
        }
    }
}

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);