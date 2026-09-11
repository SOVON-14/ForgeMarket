// ForgeMarket - Review Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeReviewPage();
});

let currentOrder = null;

function initializeReviewPage() {
    checkAuthentication();
    loadOrderDetails();
    initializeRatingSystem();
    initializeReviewForm();
}

// Check Authentication
function checkAuthentication() {
    if (typeof AppState !== 'undefined' && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Load Order Details
async function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');

    if (!orderId) {
        showNotification('ID de commande manquant', 'error');
        window.location.href = 'orders.html';
        return;
    }

    const orderDetails = document.getElementById('orderDetails');

    try {
        const response = await fetch(`/api/v1/reviews.php?order_id=${encodeURIComponent(orderId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Commande indisponible');
        currentOrder = data.data;

        displayOrderDetails(currentOrder);
    } catch (error) {
        console.error('Error loading order details:', error);
        orderDetails.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les détails de la commande.</p>
            </div>
        `;
    }
}

// Generate Mock Order Data
function generateMockOrder(orderId) {
    return {
        id: orderId,
        title: 'Fabrication d\'un portail en fer forgé',
        artisan: 'Kofi A.',
        artisanId: 1,
        price: 150000,
        status: 'finalisee',
        createdAt: '2024-01-15',
        completedAt: '2024-01-20',
        address: 'Lomé, Togo'
    };
}

// Display Order Details
function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');

    orderDetails.innerHTML = `
        <div class="order-detail-item">
            <span class="order-detail-label">Commande #</span>
            <span class="order-detail-value">${order.id}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Description</span>
            <span class="order-detail-value">${order.title}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Artisan</span>
            <span class="order-detail-value">${order.artisan}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Prix</span>
            <span class="order-detail-value">${formatCurrency(order.price)}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Date de commande</span>
            <span class="order-detail-value">${formatDate(order.createdAt)}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Date de finalisation</span>
            <span class="order-detail-value">${formatDate(order.completedAt)}</span>
        </div>
    `;
}

// Initialize Rating System
function initializeRatingSystem() {
    // Overall rating
    const overallStars = document.querySelectorAll('#overallStars .star');
    const overallRatingInput = document.getElementById('overallRating');
    const ratingLabel = document.getElementById('ratingLabel');

    const ratingLabels = {
        1: 'Médiocre',
        2: 'Insuffisant',
        3: 'Correct',
        4: 'Bon',
        5: 'Excellent'
    };

    overallStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            overallRatingInput.value = rating;
            ratingLabel.textContent = ratingLabels[rating];

            // Update visual
            overallStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            overallStars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#FFD700';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });

        star.addEventListener('mouseleave', function() {
            const currentRating = parseInt(overallRatingInput.value);
            overallStars.forEach((s, index) => {
                if (index < currentRating) {
                    s.style.color = '#FFD700';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });

    // Detailed ratings
    const miniStarsGroups = document.querySelectorAll('.mini-stars');
    miniStarsGroups.forEach(group => {
        const criteria = group.getAttribute('data-criteria');
        const stars = group.querySelectorAll('.mini-star');
        const input = group.parentElement.querySelector('input[type="hidden"]');

        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                input.value = rating;

                // Update visual
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = '#ddd';
                    }
                });
            });

            star.addEventListener('mouseleave', function() {
                const currentRating = parseInt(input.value);
                stars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = '#ddd';
                    }
                });
            });
        });
    });
}

// Initialize Review Form
function initializeReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const commentInput = document.getElementById('reviewComment');
    const charCount = document.querySelector('.char-count');

    if (reviewForm) {
        // Character count
        if (commentInput && charCount) {
            commentInput.addEventListener('input', function() {
                const length = this.value.length;
                if (length >= 20) {
                    charCount.textContent = `${length} caractères <i class="fas fa-check"></i>`;
                    charCount.style.color = 'var(--success)';
                } else {
                    charCount.textContent = `${length}/20 caractères minimum`;
                    charCount.style.color = 'var(--text-light)';
                }
            });
        }

        // Form submission
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const reviewData = {
                orderId: currentOrder.id,
                artisanId: currentOrder.artisanId,
                overallRating: parseInt(formData.get('overallRating')),
                qualityRating: parseInt(formData.get('qualityRating')),
                timelinessRating: parseInt(formData.get('timelinessRating')),
                communicationRating: parseInt(formData.get('communicationRating')),
                valueRating: parseInt(formData.get('valueRating')),
                comment: formData.get('comment'),
                pros: formData.get('pros'),
                cons: formData.get('cons'),
                recommend: formData.get('recommend') === 'on'
            };

            // Validation
            if (reviewData.overallRating === 0) {
                alert('Veuillez sélectionner une note globale');
                return;
            }

            if (reviewData.comment.length < 20) {
                alert('Le commentaire doit contenir au moins 20 caractères');
                return;
            }

            try {
                const response = await fetch('/api/v1/reviews.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reviewData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Évaluation impossible');

                // Show success message
                alert(result.message || 'Merci pour votre évaluation !');

                // Redirect to orders
                window.location.href = 'orders.html';
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('Erreur lors de la soumission de l\'évaluation. Veuillez réessayer.');
            }
        });
    }
}

// Utility Functions
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
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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