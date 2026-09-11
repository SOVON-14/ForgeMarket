// ForgeMarket - Artisans Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeArtisansPage();
});

let currentPage = 1;
const itemsPerPage = 9;
let allArtisans = [];
let filteredArtisans = [];

function initializeArtisansPage() {
    loadArtisans();
    initializeFilters();
    initializeSearch();
    initializeSorting();
    initializePagination();
}

// Load Artisans Data
async function loadArtisans() {
    const grid = document.getElementById('artisansGrid');
    const resultsCount = document.getElementById('resultsCount');

    try {
        const response = await fetch('/api/v1/artisans/index.php');
        if (!response.ok) {
            throw new Error('Artisans API request failed');
        }

        const data = await response.json();
        allArtisans = data.data || [];
        filteredArtisans = [...allArtisans];

        displayArtisans(filteredArtisans);
        updateResultsCount(filteredArtisans.length);
    } catch (error) {
        console.error('Error loading artisans:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les artisans. Veuillez réessayer.</p>
                <button class="btn btn-primary" onclick="loadArtisans()">Réessayer</button>
            </div>
        `;
    }
}

// Display Artisans
function displayArtisans(artisans) {
    const grid = document.getElementById('artisansGrid');

    if (artisans.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>Aucun artisan trouvé</h3>
                <p>Essayez de modifier vos critères de recherche.</p>
                <button class="btn btn-outline" onclick="resetFilters()">Réinitialiser les filtres</button>
            </div>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedArtisans = artisans.slice(startIndex, endIndex);

    grid.innerHTML = paginatedArtisans.map(artisan => createArtisanCard(artisan)).join('');
}

// Create Artisan Card HTML
function createArtisanCard(artisan) {
    const ratingStars = generateRatingStars(artisan.rating);
    const availabilityClass = artisan.available ? 'available' : 'busy';
    const availabilityText = artisan.available ? 'Disponible' : 'Occupé';
    const verifiedBadge = artisan.verified ? '<span class="artisan-badge verified">Vérifié</span>' : '<span class="artisan-badge new">Nouveau</span>';

    return `
        <div class="artisan-card" onclick="viewArtisanProfile(${artisan.id})">
            <div style="position: relative;">
                <img src="${artisan.image}" alt="${artisan.name}" class="artisan-image">
                ${verifiedBadge}
            </div>
            <div class="artisan-content">
                <div class="artisan-header">
                    <div>
                        <h3 class="artisan-name">${artisan.name}</h3>
                        <p class="artisan-specialty">${artisan.specialty}</p>
                    </div>
                </div>

                <div class="artisan-rating">
                    <span class="stars">${ratingStars}</span>
                    <span class="rating-count">(${artisan.reviewCount} avis)</span>
                </div>

                <div class="artisan-location">${artisan.location}</div>

                <div class="artisan-stats">
                    <span class="artisan-stat">${artisan.ordersCount} commandes</span>
                </div>

                <div class="artisan-availability ${availabilityClass}">
                    ${availabilityText}
                </div>

                <div class="artisan-footer">
                    <button class="btn btn-outline" onclick="event.stopPropagation(); viewArtisanProfile(${artisan.id})">Voir le profil</button>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); contactArtisan(${artisan.id})">Contacter</button>
                </div>
            </div>
        </div>
    `;
}

// Generate Rating Stars
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

// Initialize Filters
function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');

    [categoryFilter, locationFilter, ratingFilter, availabilityFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

// Apply Filters
function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;
    const rating = document.getElementById('ratingFilter').value;
    const availability = document.getElementById('availabilityFilter').value;

    filteredArtisans = allArtisans.filter(artisan => {
        if (category && artisan.specialty.toLowerCase() !== category.toLowerCase()) return false;
        if (location && artisan.location.toLowerCase() !== location.toLowerCase()) return false;
        if (rating && parseFloat(artisan.rating) < parseFloat(rating)) return false;
        if (availability === 'available' && !artisan.available) return false;
        if (availability === 'busy' && artisan.available) return false;
        return true;
    });

    currentPage = 1;
    displayArtisans(filteredArtisans);
    updateResultsCount(filteredArtisans.length);
    updatePagination();
}

// Initialize Search
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Debounced search
        const debouncedSearch = debounce(performSearch, 500);
        searchInput.addEventListener('input', debouncedSearch);
    }
}

// Perform Search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (query) {
        filteredArtisans = allArtisans.filter(artisan =>
            artisan.name.toLowerCase().includes(query) ||
            artisan.specialty.toLowerCase().includes(query) ||
            artisan.location.toLowerCase().includes(query)
        );
    } else {
        filteredArtisans = [...allArtisans];
    }

    currentPage = 1;
    displayArtisans(filteredArtisans);
    updateResultsCount(filteredArtisans.length);
    updatePagination();
}

// Initialize Sorting
function initializeSorting() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySorting);
    }
}

// Apply Sorting
function applySorting() {
    const sortBy = document.getElementById('sortSelect').value;

    switch (sortBy) {
        case 'rating':
            filteredArtisans.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            break;
        case 'orders':
            filteredArtisans.sort((a, b) => b.ordersCount - a.ordersCount);
            break;
        case 'name':
            filteredArtisans.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'recent':
            filteredArtisans.sort((a, b) => b.id - a.id);
            break;
    }

    displayArtisans(filteredArtisans);
}

// Initialize Pagination
function initializePagination() {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayArtisans(filteredArtisans);
                updatePagination();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredArtisans.length / itemsPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                displayArtisans(filteredArtisans);
                updatePagination();
            }
        });
    }
}

// Update Pagination
function updatePagination() {
    const maxPage = Math.ceil(filteredArtisans.length / itemsPerPage);
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === maxPage || maxPage === 0;
    if (pageNumbers) pageNumbers.textContent = maxPage > 0 ? `Page ${currentPage} sur ${maxPage}` : 'Page 0 sur 0';
}

// Update Results Count
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} artisan${count !== 1 ? 's' : ''} trouvé${count !== 1 ? 's' : ''}`;
    }
}

// Reset Filters
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    document.getElementById('availabilityFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'rating';

    filteredArtisans = [...allArtisans];
    currentPage = 1;
    displayArtisans(filteredArtisans);
    updateResultsCount(filteredArtisans.length);
    updatePagination();
}

// View Artisan Profile
function viewArtisanProfile(artisanId) {
    window.location.href = `artisan-profile.html?id=${artisanId}`;
}

// Contact Artisan
function contactArtisan(artisanId) {
    if (typeof AppState !== 'undefined' && AppState.isAuthenticated) {
        window.location.href = `messages.html?artisan=${artisanId}`;
    } else {
        if (typeof showNotification === 'function') {
            showNotification('Veuillez vous connecter pour contacter un artisan', 'warning');
        }
        window.location.href = 'login.html';
    }
}

// Utility: Debounce function
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