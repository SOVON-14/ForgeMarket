// ForgeMarket - Artisan Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeArtisanProfile();
});

let currentArtisan = null;
let isFavorite = false;

function initializeArtisanProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const artisanId = urlParams.get('id');

    if (artisanId) {
        loadArtisanProfile(artisanId);
        initializeTabs();
        initializeContactButton();
        initializeFavoriteButton();
    } else {
        showNotification('ID artisan manquant', 'error');
        window.location.href = 'artisans.html';
    }
}

// Load Artisan Profile Data
async function loadArtisanProfile(artisanId) {
    const loadingState = document.getElementById('loadingState');
    const profileContent = document.getElementById('profileContent');

    try {
        const response = await fetch(`/api/v1/artisans/show.php?id=${encodeURIComponent(artisanId)}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Profil introuvable');
        }

        currentArtisan = data.data;

        // Hide loading, show content
        loadingState.classList.add('hidden');
        profileContent.classList.remove('hidden');

        // Populate profile data
        populateProfileData(currentArtisan);
        loadPortfolio(currentArtisan.id);
        loadReviews(currentArtisan.id);

    } catch (error) {
        console.error('Error loading artisan profile:', error);
        loadingState.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger le profil de l'artisan.</p>
                <button class="btn btn-primary" onclick="window.location.href='artisans.html'">Retour aux artisans</button>
            </div>
        `;
    }
}

// Generate Mock Artisan Profile Data
function generateMockArtisanProfile(id) {
    const specialties = ['Ferronnerie', 'Soudure', 'Construction métallique', 'Menuiserie métallique'];
    const locations = ['Lomé', 'Sokodé', 'Kara', 'Atsapié', 'Tsévié'];
    const names = ['Kofi A.', 'Komlan M.', 'Yawo K.', 'Afi B.', 'Kokou T.'];

    const specialty = specialties[id % specialties.length];
    const location = locations[id % locations.length];
    const name = names[id % names.length];

    return {
        id: parseInt(id),
        name: name,
        specialty: specialty,
        location: location,
        rating: (4 + Math.random()).toFixed(1),
        reviewCount: Math.floor(Math.random() * 50) + 10,
        ordersCount: Math.floor(Math.random() * 100) + 20,
        experienceYears: Math.floor(Math.random() * 15) + 3,
        responseRate: Math.floor(Math.random() * 30) + 70,
        verified: Math.random() > 0.3,
        available: Math.random() > 0.3,
        image: `https://via.placeholder.com/300x300/C2652A/FFFFFF?text=${encodeURIComponent(name)}`,
        description: `Artisan expérimenté en ${specialty.toLowerCase()} avec plus de ${Math.floor(Math.random() * 15) + 3} ans d'expérience. Spécialisé dans les travaux sur mesure et la rénovation. Je m'engage à fournir un travail de qualité avec des matériaux durables.`,
        skills: ['Soudure MIG/MAG', 'Découpe laser', 'Finition', 'Installation', 'Réparation', 'Conception sur mesure'],
        services: [
            'Fabrication de portails et clôtures',
            'Construction de structures métalliques',
            'Réparation et entretien',
            'Travaux de ferronnerie d\'art',
            'Menuiserie métallique',
            'Installation et montage'
        ],
        verificationDate: '2023-06-15',
        verificationDocuments: ['Carte d\'identité', 'Registre de commerce', 'Attestation de formation']
    };
}

// Populate Profile Data
function populateProfileData(artisan) {
    // Basic info
    document.getElementById('artisanName').textContent = artisan.name;
    document.getElementById('artisanSpecialty').textContent = artisan.specialty;
    document.getElementById('artisanLocation').textContent = artisan.location;
    document.getElementById('artisanImage').src = artisan.image;
    document.getElementById('artisanDescription').textContent = artisan.description;

    // Rating
    document.getElementById('ratingStars').textContent = generateRatingStars(artisan.rating);
    document.getElementById('ratingValue').textContent = artisan.rating;
    document.getElementById('reviewCount').textContent = `(${artisan.reviewCount} avis)`;

    // Stats
    document.getElementById('ordersCount').textContent = artisan.ordersCount;
    document.getElementById('experienceYears').textContent = artisan.experienceYears;
    document.getElementById('responseRate').textContent = `${artisan.responseRate}%`;

    // Availability
    const availabilityStatus = document.getElementById('availabilityStatus');
    availabilityStatus.textContent = artisan.available ? 'Disponible pour nouvelles commandes' : 'Actuellement occupé';
    availabilityStatus.className = `availability-status ${artisan.available ? 'available' : 'busy'}`;

    // Badges
    const verifiedBadge = document.getElementById('verifiedBadge');
    const newBadge = document.getElementById('newBadge');

    if (artisan.verified) {
        verifiedBadge.classList.remove('hidden');
        newBadge.classList.add('hidden');
    } else {
        verifiedBadge.classList.add('hidden');
        newBadge.classList.remove('hidden');
    }

    // Skills
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = artisan.skills.map(skill =>
        `<span class="skill-tag">${skill}</span>`
    ).join('');

    // Services
    const servicesList = document.getElementById('servicesList');
    servicesList.innerHTML = artisan.services.map(service =>
        `<div class="service-item">${service}</div>`
    ).join('');

    // Verification info
    const verificationInfo = document.getElementById('verificationInfo');
    if (artisan.verified) {
        verificationInfo.innerHTML = `
            <p><strong><i class="fas fa-check-circle"></i> Identité vérifiée</strong> - ${formatDate(artisan.verificationDate)}</p>
            <p><strong><i class="fas fa-check-circle"></i> Documents validés:</strong> ${artisan.verificationDocuments.join(', ')}</p>
            <p><strong><i class="fas fa-check-circle"></i> Artisan certifié</strong> par ForgeMarket</p>
        `;
    } else {
        verificationInfo.innerHTML = `
            <p style="color: var(--warning);"><strong>⚠ En attente de vérification</strong></p>
            <p>Cet artisan est en cours de vérification par nos équipes.</p>
        `;
    }
}

// Load Portfolio
function loadPortfolio(artisanId) {
    const portfolioGrid = document.getElementById('portfolioGrid');
    portfolioGrid.innerHTML = '<p class="empty-state">Aucune réalisation publiée pour le moment.</p>';
}

// Load Reviews
function loadReviews(artisanId) {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '<p class="empty-state">Aucun avis publié pour le moment.</p>';
}

// Initialize Tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Initialize Contact Button
function initializeContactButton() {
    const contactButton = document.getElementById('contactButton');
    if (contactButton) {
        contactButton.addEventListener('click', () => {
            if (typeof AppState !== 'undefined' && AppState.isAuthenticated) {
                // Check if user has completed 5 orders for quote access
                if (typeof AppState.currentUser !== 'undefined' && AppState.currentUser.completedOrders >= 5) {
                    window.location.href = `create-quote.html?artisan=${currentArtisan.id}`;
                } else {
                    window.location.href = `messages.html?artisan=${currentArtisan.id}`;
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Veuillez vous connecter pour contacter cet artisan', 'warning');
                }
                window.location.href = 'login.html';
            }
        });
    }
}

// Initialize Favorite Button
function initializeFavoriteButton() {
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton) {
        // Check if already favorited
        const favorites = JSON.parse(localStorage.getItem('forgeMarket_favorites') || '[]');
        isFavorite = favorites.includes(currentArtisan.id);
        updateFavoriteButton();

        favoriteButton.addEventListener('click', toggleFavorite);
    }
}

function toggleFavorite() {
    const favorites = JSON.parse(localStorage.getItem('forgeMarket_favorites') || '[]');

    if (isFavorite) {
        // Remove from favorites
        const index = favorites.indexOf(currentArtisan.id);
        if (index > -1) {
            favorites.splice(index, 1);
        }
        isFavorite = false;
        if (typeof showNotification === 'function') {
            showNotification('Retiré des favoris', 'info');
        }
    } else {
        // Add to favorites
        favorites.push(currentArtisan.id);
        isFavorite = true;
        if (typeof showNotification === 'function') {
            showNotification('Ajouté aux favoris', 'success');
        }
    }

    localStorage.setItem('forgeMarket_favorites', JSON.stringify(favorites));
    updateFavoriteButton();
}

function updateFavoriteButton() {
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton) {
        favoriteButton.textContent = isFavorite ? '<i class="fas fa-star"></i> Retirer des favoris' : '<i class="far fa-star"></i> Ajouter aux favoris';
        favoriteButton.classList.toggle('btn-primary', isFavorite);
        favoriteButton.classList.toggle('btn-outline', !isFavorite);
    }
}

// View Portfolio Item
function viewPortfolioItem(itemId) {
    // In a real application, this would open a modal or navigate to a detailed view
    if (typeof showNotification === 'function') {
        showNotification('Détail de la réalisation (fonctionnalité à venir)', 'info');
    }
}

// Utility Functions
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star rating-empty"></i>';
    }

    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}