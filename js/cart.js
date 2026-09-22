// Cart Page JavaScript

let cartData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    loadCartCount();
});

function loadCart() {
    fetch('/api/v1/cart/index.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                cartData = data;
                displayCart(data);
            } else {
                showCartError('Erreur lors du chargement du panier');
            }
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            showCartError('Erreur de connexion au serveur');
        });
}

function displayCart(data) {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');

    if (!data.data || data.data.length === 0) {
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';
    emptyCart.style.display = 'none';

    cartItems.innerHTML = data.data.map(item => createCartItem(item)).join('');
    updateSummary(data.summary);
}

function createCartItem(item) {
    const imageUrl = item.primary_image || item.image_url || 'https://via.placeholder.com/120x120?text=Produit';

    return `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/120x120?text=Produit'">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-category">${item.category_name}</div>
                <div class="cart-item-artisan">
                    <div class="cart-item-artisan-avatar">${getInitials(item.artisan_name)}</div>
                    <span>${item.artisan_name}</span>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" readonly>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-price">${formatPrice(item.price)}</div>
                <div class="cart-item-subtotal">${formatPrice(item.subtotal)}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

function updateSummary(summary) {
    document.getElementById('summaryItems').textContent = summary.total_items;
    document.getElementById('summarySubtotal').textContent = formatPrice(summary.total_amount);
    document.getElementById('summaryDelivery').textContent = 'Calculé à la commande';
    document.getElementById('summaryTotal').textContent = formatPrice(summary.total_amount);
    document.getElementById('artisanCount').textContent = summary.unique_artisans;
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;

    const data = {
        cart_item_id: itemId,
        quantity: newQuantity
    };

    fetch('/api/v1/cart/index.php', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCart();
            loadCartCount();
        } else {
            showNotification(data.error || 'Erreur lors de la mise à jour', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating quantity:', error);
        showNotification('Erreur de connexion', 'error');
    });
}

function removeFromCart(itemId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    fetch(`/api/v1/cart/index.php?id=${itemId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Article supprimé du panier');
            loadCart();
            loadCartCount();
        } else {
            showNotification(data.error || 'Erreur lors de la suppression', 'error');
        }
    })
    .catch(error => {
        console.error('Error removing from cart:', error);
        showNotification('Erreur de connexion', 'error');
    });
}

function proceedToCheckout() {
    if (!cartData || !cartData.data || cartData.data.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }

    window.location.href = 'checkout.html';
}

function continueShopping() {
    window.location.href = 'catalogue.html';
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

function showCartError(message) {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="loadCart()">Réessayer</button>
        </div>
    `;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
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