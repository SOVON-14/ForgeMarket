// Catalog Page JavaScript

let currentPage = 1;
let totalPages = 1;
let currentView = 'grid';

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadArtisans();
    setupEventListeners();
    loadCartCount();
});

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            toggleView();
        });
    });

    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
        }
    });

    document.getElementById('nextPage').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts();
        }
    });
}

function loadArtisans() {
    fetch('/api/v1/artisans/index.php?verified_only=true')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const select = document.getElementById('artisanFilter');
                data.data.forEach(artisan => {
                    const option = document.createElement('option');
                    option.value = artisan.id;
                    option.textContent = artisan.business_name || `${artisan.first_name} ${artisan.last_name}`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading artisans:', error));
}

function applyFilters() {
    currentPage = 1;
    loadProducts();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('artisanFilter').value = '';
    document.getElementById('sortFilter').value = 'created_at';
    currentPage = 1;
    loadProducts();
}

function loadProducts() {
    const search = document.getElementById('searchInput').value;
    const categoryId = document.getElementById('categoryFilter').value;
    const artisanId = document.getElementById('artisanFilter').value;
    const sortValue = document.getElementById('sortFilter').value;

    let [sort, order] = sortValue.split('_');
    if (!order) order = 'DESC';

    const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sort: sort,
        order: order
    });

    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);
    if (artisanId) params.append('artisan_id', artisanId);

    fetch(`/api/v1/products/index.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProducts(data.data);
                updatePagination(data.pagination);
            } else {
                showError('Erreur lors du chargement des produits');
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showError('Erreur de connexion au serveur');
        });
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos filtres de recherche</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const imageUrl = product.primary_image || 'https://via.placeholder.com/300x200?text=Produit';
    const stockStatus = product.stock > 0 ? 'En stock' : 'Rupture de stock';
    const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
    const disabled = product.stock === 0 ? 'disabled' : '';

    return `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/300x200?text=Produit'">
                <span class="product-badge">${product.category_name}</span>
                <span class="product-stock ${stockClass}">${stockStatus}</span>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category_name}</div>
                <div class="product-title">${product.title}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-artisan">
                        <div class="product-artisan-avatar">${getInitials(product.artisan_name)}</div>
                        <span>${product.artisan_name}</span>
                    </div>
                </div>
                <div class="product-rating">
                    ${generateStars(product.artisan_rating)}
                    <span>(${product.artisan_rating || 'N/A'})</span>
                </div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})" ${disabled}>
                    <i class="fas fa-shopping-cart"></i> Ajouter au panier
                </button>
            </div>
        </div>
    `;
}

function toggleView() {
    const grid = document.getElementById('productsGrid');
    if (currentView === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

function updatePagination(pagination) {
    totalPages = pagination.pages;
    document.getElementById('resultsCount').textContent = pagination.total;
    document.getElementById('pageInfo').textContent = `Page ${pagination.page} sur ${pagination.pages}`;

    document.getElementById('prevPage').disabled = pagination.page === 1;
    document.getElementById('nextPage').disabled = pagination.page === pagination.pages;
}

function addToCart(productId) {
    const data = {
        product_id: productId,
        quantity: 1
    };

    fetch('/api/v1/cart/index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Produit ajouté au panier !');
            loadCartCount();
        } else {
            showNotification(data.error || 'Erreur lors de l\'ajout au panier', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        showNotification('Erreur de connexion', 'error');
    });
}

function loadCartCount() {
    fetch('/api/v1/cart/index.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.summary) {
                document.getElementById('cartCount').textContent = data.summary.total_items;
            }
        })
        .catch(error => console.error('Error loading cart count:', error));
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function generateStars(rating) {
    const stars = Math.round(rating || 0);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= stars) {
            html += '<i class="fas fa-star"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="loadProducts()">Réessayer</button>
        </div>
    `;
}