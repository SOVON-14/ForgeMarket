// Checkout Page JavaScript

let cartData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    loadCartCount();
    prefillUserInfo();
});

function prefillUserInfo() {
    // Prefill user info if logged in
    if (window.currentUser) {
        document.getElementById('fullName').value = `${window.currentUser.first_name} ${window.currentUser.last_name}`;
        document.getElementById('phone').value = window.currentUser.phone;
    }
}

function loadCart() {
    fetch('/api/v1/cart/index.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                cartData = data;
                displayCheckoutItems(data);
                displayArtisanBreakdown(data);
                updateCheckoutTotals(data.summary);
            } else {
                showCheckoutError('Erreur lors du chargement du panier');
            }
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            showCheckoutError('Erreur de connexion au serveur');
        });
}

function displayCheckoutItems(data) {
    const container = document.getElementById('checkoutItems');

    if (!data.data || data.data.length === 0) {
        container.innerHTML = '<p>Votre panier est vide</p>';
        return;
    }

    container.innerHTML = data.data.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.primary_image || item.image_url || 'https://via.placeholder.com/80x80?text=Produit'}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/80x80?text=Produit'">
            </div>
            <div class="checkout-item-info">
                <div class="checkout-item-title">${item.title}</div>
                <div class="checkout-item-artisan">${item.artisan_name}</div>
                <div class="checkout-item-price">${formatPrice(item.price)} x ${item.quantity}</div>
            </div>
            <div class="checkout-item-total">${formatPrice(item.subtotal)}</div>
        </div>
    `).join('');
}

function displayArtisanBreakdown(data) {
    const container = document.getElementById('artisanBreakdown');

    if (!data.data || data.data.length === 0) {
        container.innerHTML = '<p>Aucun article</p>';
        return;
    }

    // Group by artisan
    const artisanGroups = {};
    data.data.forEach(item => {
        if (!artisanGroups[item.artisan_id]) {
            artisanGroups[item.artisan_id] = {
                name: item.artisan_name,
                total: 0
            };
        }
        artisanGroups[item.artisan_id].total += item.subtotal;
    });

    container.innerHTML = Object.entries(artisanGroups).map(([artisanId, group]) => `
        <div class="artisan-item">
            <div class="artisan-item-info">
                <div class="artisan-item-avatar">${getInitials(group.name)}</div>
                <div class="artisan-item-name">${group.name}</div>
            </div>
            <div class="artisan-item-amount">${formatPrice(group.total)}</div>
        </div>
    `).join('');
}

function updateCheckoutTotals(summary) {
    const subtotal = summary.total_amount;
    const deliveryFee = calculateDeliveryFee(summary.unique_artisans);
    const total = subtotal + deliveryFee;

    document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkoutDelivery').textContent = formatPrice(deliveryFee);
    document.getElementById('checkoutTotal').textContent = formatPrice(total);
}

function calculateDeliveryFee(artisanCount) {
    // Estimate delivery fee based on number of artisans
    const baseFee = 2000;
    const additionalFee = (artisanCount - 1) * 1000;
    return Math.max(baseFee, baseFee + additionalFee);
}

function placeOrder() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);

    // Validate form
    const fullName = formData.get('fullName');
    const phone = formData.get('phone');
    const address = formData.get('address');
    const city = formData.get('city');

    if (!fullName || !phone || !address || !city) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    if (!cartData || !cartData.data || cartData.data.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }

    const orderData = {
        delivery_address: `${address}, ${city}`,
        full_name: fullName,
        phone: phone,
        notes: formData.get('notes') || ''
    };

    // Show loading state
    const submitBtn = document.querySelector('.checkout-actions .btn-primary');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

    fetch('/api/v1/checkout/index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Commande créée avec succès !');
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 2000);
        } else {
            showNotification(data.error || 'Erreur lors de la création de la commande', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer la commande';
        }
    })
    .catch(error => {
        console.error('Error placing order:', error);
        showNotification('Erreur de connexion', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer la commande';
    });
}

function goBack() {
    window.location.href = 'cart.html';
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

function showCheckoutError(message) {
    const container = document.getElementById('checkoutItems');
    container.innerHTML = `
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