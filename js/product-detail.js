// Product Detail Page JavaScript

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        loadProduct(productId);
        loadRelatedProducts(productId);
    } else {
        showProductNotFound();
    }

    loadCartCount();
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelectorAll('.quantity-input button').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.querySelector('.quantity-input input');
            let value = parseInt(input.value);

            if (this.textContent === '+') {
                value++;
            } else if (this.textContent === '-' && value > 1) {
                value--;
            }

            input.value = value;
            currentQuantity = value;
        });
    });
}

function loadProduct(productId) {
    fetch(`/api/v1/products/show.php?id=${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                currentProduct = data.data;
                displayProduct(data.data);
                document.getElementById('breadcrumbProduct').textContent = data.data.title;
            } else {
                showProductNotFound();
            }
        })
        .catch(error => {
            console.error('Error loading product:', error);
            showProductNotFound();
        });
}

function displayProduct(product) {
    const detailContainer = document.getElementById('productDetail');

    const imageUrl = product.primary_image || 'https://via.placeholder.com/400x400?text=Produit';
    const stockStatus = product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock';
    const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
    const disabled = product.stock === 0 ? 'disabled' : '';

    const imagesHtml = product.images && product.images.length > 0
        ? product.images.map((img, index) => `
            <div class="product-detail-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img.image_url}', this)">
                <img src="${img.image_url}" alt="${product.title}">
            </div>
        `).join('')
        : '';

    detailContainer.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-detail-gallery">
                <div class="product-detail-main-image">
                    <img src="${imageUrl}" alt="${product.title}" id="mainImage" onerror="this.src='https://via.placeholder.com/400x400?text=Produit'">
                </div>
                <div class="product-detail-thumbnails">
                    ${imagesHtml}
                </div>
            </div>
            <div class="product-detail-info">
                <div class="product-detail-category">${product.category_name}</div>
                <h1>${product.title}</h1>
                <div class="product-detail-price">${formatPrice(product.price)}</div>
                <div class="product-stock ${stockClass}">${stockStatus}</div>

                <div class="product-detail-description">
                    ${product.description}
                </div>

                <div class="product-detail-meta">
                    <div class="meta-item">
                        <i class="fas fa-tools"></i>
                        <span>Expérience: ${product.years_experience || 'N/A'} ans</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-truck"></i>
                        <span>Livraison: ${product.delivery_days || '7'} jours</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-eye"></i>
                        <span>Vues: ${product.views_count}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-shopping-bag"></i>
                        <span>Ventes: ${product.orders_count}</span>
                    </div>
                </div>

                <div class="product-detail-artisan">
                    <div class="artisan-avatar">${getInitials(product.artisan_name)}</div>
                    <div class="artisan-info">
                        <h4>${product.artisan_name}</h4>
                        <p>${product.artisan_city} ${product.verification_status === 'verified' ? '<i class="fas fa-check-circle" style="color: #4CAF50;"></i>' : ''}</p>
                    </div>
                    <a href="artisan-profile.html?id=${product.artisan_id}" class="btn-secondary">
                        <i class="fas fa-user"></i> Voir profil
                    </a>
                </div>

                <div class="product-detail-actions">
                    <div class="quantity-input">
                        <button>-</button>
                        <input type="number" value="1" min="1" max="${product.stock}" readonly>
                        <button>+</button>
                    </div>
                    <button class="btn-primary" onclick="addToCart(${product.id})" ${disabled}>
                        <i class="fas fa-shopping-cart"></i> Ajouter au panier
                    </button>
                </div>

                <div class="product-rating">
                    ${generateStars(product.artisan_rating)}
                    <span>(${product.artisan_rating || 'N/A'})</span>
                </div>
            </div>
        </div>
    `;
}

function changeMainImage(imageUrl, thumbnail) {
    document.getElementById('mainImage').src = imageUrl;
    document.querySelectorAll('.product-detail-thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

function loadRelatedProducts(productId) {
    fetch(`/api/v1/products/index.php?limit=4`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const relatedProducts = data.data.filter(p => p.id !== productId).slice(0, 4);
                displayRelatedProducts(relatedProducts);
            }
        })
        .catch(error => console.error('Error loading related products:', error));
}

function displayRelatedProducts(products) {
    const container = document.getElementById('relatedProducts');

    if (products.length === 0) {
        container.innerHTML = '<p>Aucun produit similaire</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.primary_image || 'https://via.placeholder.com/300x200?text=Produit'}" alt="${product.title}">
                <span class="product-badge">${product.category_name}</span>
            </div>
            <div class="product-info">
                <div class="product-title">${product.title}</div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-artisan">
                    <div class="product-artisan-avatar">${getInitials(product.artisan_name)}</div>
                    <span>${product.artisan_name}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const quantity = parseInt(document.querySelector('.quantity-input input').value);

    const data = {
        product_id: productId,
        quantity: quantity
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

function showProductNotFound() {
    const detailContainer = document.getElementById('productDetail');
    detailContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Produit non trouvé</h3>
            <p>Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
            <button class="btn-primary" onclick="window.location.href='catalogue.html'">
                <i class="fas fa-shopping-bag"></i> Voir le catalogue
            </button>
        </div>
    `;
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