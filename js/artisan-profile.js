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
        // Simulate API call - replace with actual API endpoint
        // const response = await fetch(`/api/v1/artisans/${artisanId}`);
        // const data = await response.json();

        // Mock data for demonstration
        const mockArtisan = generateMockArtisanProfile(artisanId);
        currentArtisan = mockArtisan;

        // Hide loading, show content
        loadingState.classList.add('hidden');
        profileContent.classList.remove('hidden');

        // Populate profile data
        populateProfileData(mockArtisan);
        loadPortfolio(mockArtisan.id);
        loadReviews(mockArtisan.id);

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
            <p><strong>✓ Identité vérifiée</strong> - ${formatDate(artisan.verificationDate)}</p>
            <p><strong>✓ Documents validés:</strong> ${artisan.verificationDocuments.join(', ')}</p>
            <p><strong>✓ Artisan certifié</strong> par ForgeMarket</p>
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

    // Mock portfolio data
    const mockPortfolio = [
        {
            id: 1,
            title: 'Portail moderne',
            description: 'Portail en fer forgé avec design contemporain',
            image: 'https://via.placeholder.com/300x200/C2652A/FFFFFF?text=Portail',
            date: '2024-01-15'
        },
        {
            id: 2,
            title: 'Structure métallique',
            description: 'Charpente pour hangar industriel',
            image: 'https://via.placeholder.com/300x200/8C3C3C/FFFFFF?text=Structure',
            date: '2024-01-10'
        },
        {
            id: 3,
            title: 'Escalier métallique',
            description: 'Escalier sur mesure avec finition époxy',
            image: 'https://via.placeholder.com/300x200/82746E/FFFFFF?text=Escalier',
            date: '2023-12-20'
        },
        {
            id: 4,
            title: 'Clôture décorative',
            description: 'Clôture avec motifs artistiques',
            image: 'https://via.placeholder.com/300x200/C2652A/FFFFFF?text=Clôture',
            date: '2023-12-15'
        },
        {
            id: 5,
            title: 'Meuble métallique',
            description: 'Table basse en métal et bois',
            image: 'https://via.placeholder.com/300x200/8C3C3C/FFFFFF?text=Meuble',
            date: '2023-11-30'
        },
        {
            id: 6,
            title: 'Rénovation toiture',
            description: 'Remplacement complet de toiture métallique',
            image: 'https://via.placeholder.com/300x200/82746E/FFFFFF?text=Toiture',
            date: '2023-11-15'
        }
    ];

    portfolioGrid.innerHTML = mockPortfolio.map(item => `
        <div class="portfolio-item" onclick="viewPortfolioItem(${item.id})">
            <img src="${item.image}" alt="${item.title}" class="portfolio-image">
            <div class="portfolio-info">
                <h4 class="portfolio-title">${item.title}</h4>
                <p class="portfolio-description">${item.description}</p>
                <p class="portfolio-date">${formatDate(item.date)}</p>
            </div>
        </div>
    `).join('');
}

// Load Reviews
function loadReviews(artisanId) {
    const reviewsList = document.getElementById('reviewsList');

    // Mock reviews data
    const mockReviews = [
        {
            id: 1,
            author: 'Jean K.',
            rating: 5,
            date: '2024-01-20',
            text: 'Excellent travail ! L\'artisan a respecté les délais et la qualité est au rendez-vous. Je recommande vivement.',
            verified: true
        },
        {
            id: 2,
            author: 'Marie A.',
            rating: 4,
            date: '2024-01-15',
            text: 'Très professionnel et à l\'écoute. Le rendu final est conforme à mes attentes. Petit retard sur la livraison mais compensé par la qualité.',
            verified: true
        },
        {
            id: 3,
            author: 'Philippe M.',
            rating: 5,
            date: '2024-01-10',
            text: 'Service impeccable du début à la fin. Communication fluide et travail soigné. C\'est mon deuxième commande avec cet artisan.',
            verified: true
        }
    ];

    reviewsList.innerHTML = mockReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <span class="review-author">${review.author}</span>
                    ${review.verified ? '<span class="review-verified">Achat vérifié</span>' : ''}
                </div>
                <span class="review-date">${formatDate(review.date)}</span>
            </div>
            <div class="review-rating">${generateRatingStars(review.rating)}</div>
            <p class="review-text">${review.text}</p>
        </div>
    `).join('');
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
        favoriteButton.textContent = isFavorite ? '★ Retirer des favoris' : '☆ Ajouter aux favoris';
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
        stars += '★';
    }
    if (hasHalfStar) {
        stars += '½';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="rating-empty">★</span>';
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