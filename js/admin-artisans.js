document.addEventListener('DOMContentLoaded', loadPendingArtisans);

async function loadPendingArtisans() {
    const container = document.getElementById('pendingArtisans');
    container.innerHTML = '<p class="text-center">Chargement des demandes...</p>';

    try {
        const response = await fetch('/api/v1/admin/artisans.php?status=pending');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Accès impossible');
        }

        const artisans = data.data || [];
        if (artisans.length === 0) {
            container.innerHTML = '<p class="text-center">Aucune demande en attente.</p>';
            return;
        }

        container.innerHTML = artisans.map(createArtisanRequest).join('');
    } catch (error) {
        console.error('Pending artisans error:', error);
        container.innerHTML = '<p class="text-center">Impossible de charger les demandes.</p>';
    }
}

function createArtisanRequest(artisan) {
    const fullName = `${artisan.first_name} ${artisan.last_name}`;
    const submittedAt = new Date(artisan.created_at).toLocaleDateString('fr-FR');

    return `
        <article class="list-item">
            <div class="item-info">
                <div class="item-name">${escapeHtml(fullName)}</div>
                <div class="item-details">${escapeHtml(artisan.business_name)} · ${escapeHtml(artisan.category)} · ${escapeHtml(artisan.city)}</div>
                <div class="item-details">Soumis le ${submittedAt} · ${escapeHtml(artisan.email)}</div>
                <p>${escapeHtml(artisan.bio)}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-small" onclick="updateArtisanStatus(${artisan.id}, 'verified')">Valider</button>
                <button class="btn btn-outline btn-small" onclick="updateArtisanStatus(${artisan.id}, 'rejected')">Refuser</button>
            </div>
        </article>
    `;
}

async function updateArtisanStatus(artisanId, status) {
    if (status === 'rejected' && !window.confirm('Refuser ce profil artisan ?')) {
        return;
    }

    try {
        const response = await fetch('/api/v1/admin/artisans.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artisanId, status })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Mise à jour impossible');
        }

        showNotification(data.message, 'success');
        await loadPendingArtisans();
    } catch (error) {
        console.error('Artisan status error:', error);
        showNotification(error.message, 'error');
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character]));
}
