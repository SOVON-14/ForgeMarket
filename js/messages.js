// ForgeMarket - Messages Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMessagesPage();
});

let currentConversation = null;
let conversations = [];
let messages = [];

function initializeMessagesPage() {
    checkAuthentication();
    loadConversations();
    initializeNewConversationModal();
    initializeMessageInput();
    initializeFileAttachments();
}

// Check Authentication
function checkAuthentication() {
    if (typeof AppState !== 'undefined' && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Load Conversations
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');

    try {
        const response = await fetch('/api/v1/messages.php');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Conversations indisponibles');
        conversations = data.data || [];

        displayConversations(conversations);

        // Check if artisan ID is in URL
        const urlParams = new URLSearchParams(window.location.search);
        const artisanId = urlParams.get('artisan');
        if (artisanId) {
            const conversation = conversations.find(c => c.artisanId === parseInt(artisanId));
            if (conversation) {
                selectConversation(conversation.id);
            } else {
                // Create new conversation with this artisan
                createConversationWithArtisan(parseInt(artisanId));
            }
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les conversations.</p>
            </div>
        `;
    }
}

// Display Conversations
function displayConversations(convs) {
    const conversationsList = document.getElementById('conversationsList');

    conversationsList.innerHTML = convs.map(conv => `
        <div class="conversation-item ${conv.unread ? 'unread' : ''} ${currentConversation === conv.id ? 'active' : ''}"
             onclick="selectConversation(${conv.id})">
            <div class="conversation-header">
                <img src="${conv.artisanAvatar}" alt="${escapeHtml(conv.artisanName)}" class="conversation-avatar">
                <div>
                    <h4 class="conversation-name">${escapeHtml(conv.artisanName)}</h4>
                </div>
            </div>
            <p class="conversation-preview">${escapeHtml(conv.lastMessage)}</p>
            <div class="conversation-meta">
                <span>${formatTime(conv.lastMessageTime)}</span>
                ${conv.unread ? '<span class="unread-badge">Nouveau</span>' : ''}
            </div>
        </div>
    `).join('');
}

// Select Conversation
function selectConversation(conversationId) {
    currentConversation = conversationId;
    const conversation = conversations.find(c => c.id === conversationId);

    if (conversation) {
        // Update UI
        document.getElementById('noConversationSelected').classList.add('hidden');
        document.getElementById('conversationView').classList.remove('hidden');

        // Update conversation header
        document.getElementById('conversationAvatar').src = conversation.artisanAvatar;
        document.getElementById('conversationName').textContent = conversation.artisanName;
        document.getElementById('conversationStatus').textContent = conversation.online ? 'En ligne' : 'Hors ligne';

        // Mark as read
        conversation.unread = false;
        displayConversations(conversations);

        // Load messages
        loadMessages(conversationId);

        // Mobile: show chat area
        if (window.innerWidth <= 768) {
            document.querySelector('.conversations-sidebar').classList.add('hidden');
            document.querySelector('.chat-area').classList.add('active');
        }
    }
}

// Load Messages
async function loadMessages(conversationId) {
    const messagesList = document.getElementById('messagesList');

    try {
        const response = await fetch(`/api/v1/messages.php?user_id=${encodeURIComponent(conversationId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Messages indisponibles');
        messages = (data.data || []).map(message => ({ ...message, conversationId, content: message.body, timestamp: message.created_at, status: message.read_at ? 'read' : 'sent' }));

        displayMessages(messages);
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesList.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les messages.</p>
            </div>
        `;
    }
}

// Display Messages
function displayMessages(msgs) {
    const messagesList = document.getElementById('messagesList');

    messagesList.innerHTML = msgs.map(msg => `
        <div class="message ${msg.sender === 'me' ? 'sent' : 'received'}">
            <div class="message-header">
                <span class="message-sender">${msg.sender === 'me' ? 'Vous' : 'Artisan'}</span>
                <span class="message-time">${formatTime(msg.timestamp)}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
            ${msg.sender === 'me' ? `<div class="message-status">${getMessageStatus(msg.status)}</div>` : ''}
        </div>
    `).join('');
}

// Get Message Status
function getMessageStatus(status) {
    switch (status) {
        case 'sent':
            return '<i class="fas fa-check"></i>';
        case 'delivered':
            return '<i class="fas fa-check-double"></i>';
        case 'read':
            return '<i class="fas fa-check-double"></i> (lu)';
        default:
            return '';
    }
}

// Initialize Message Input
function initializeMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessageBtn');

    if (messageInput && sendButton) {
        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send on Enter (shift+enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', sendMessage);
    }
}

// Send Message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content || !currentConversation) return;

    try { const response = await fetch('/api/v1/messages.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientUserId: currentConversation, body: content }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Message impossible à envoyer'); messageInput.value = ''; messageInput.style.height = 'auto'; await loadMessages(currentConversation); await loadConversations(); } catch (error) { showNotification(error.message, 'error'); }
}

// Initialize File Attachments
function initializeFileAttachments() {
    const attachFileBtn = document.getElementById('attachFileBtn');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const fileInput = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput');

    if (attachFileBtn && fileInput) {
        attachFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
    }

    if (attachImageBtn && imageInput) {
        attachImageBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    console.log('Files selected:', files);
    // In real app, upload files and send as message
}

function handleImageUpload(event) {
    const files = event.target.files;
    console.log('Images selected:', files);
    // In real app, upload images and send as message
}

// New Conversation Modal
function initializeNewConversationModal() {
    const newConversationBtn = document.getElementById('newConversationBtn');
    const modal = document.getElementById('newConversationModal');

    if (newConversationBtn) {
        newConversationBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            loadArtisansForNewConversation();
        });
    }

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeNewConversationModal();
        }
    });
}

async function loadArtisansForNewConversation() {
    const select = document.getElementById('newConversationArtisan');

    const response = await fetch('/api/v1/artisans/index.php');
    const data = await response.json();
    const mockArtisans = data.data || [];

    select.innerHTML = '<option value="">Choisir un artisan</option>' +
        mockArtisans.map(artisan =>
            `<option value="${artisan.id}">${artisan.name} - ${artisan.specialty}</option>`
        ).join('');
}

function closeNewConversationModal() {
    document.getElementById('newConversationModal').classList.add('hidden');
}

function startNewConversation() {
    const artisanId = document.getElementById('newConversationArtisan').value;
    const message = document.getElementById('newConversationMessage').value.trim();

    if (!artisanId || !message) {
        alert('Veuillez sélectionner un artisan et écrire un message');
        return;
    }

    // Create new conversation
    createConversationWithArtisan(parseInt(artisanId), message);
    closeNewConversationModal();
}

async function createConversationWithArtisan(artisanId, initialMessage = '') {
    if (!initialMessage) return;
    try { const response = await fetch('/api/v1/messages.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artisanId, body: initialMessage }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Conversation impossible à créer'); await loadConversations(); const conversation = conversations.find(item => item.artisanId === Number(artisanId)); if (conversation) selectConversation(conversation.id); } catch (error) { showNotification(error.message, 'error'); }
}

// Utility Functions
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)} j`;

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
}

function scrollToBottom() {
    const messagesList = document.getElementById('messagesList');
    messagesList.scrollTop = messagesList.scrollHeight;
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character])); }

function viewOrder() {
    // Navigate to order details if linked to an order
    console.log('View order');
}

function reportUser() {
    if (confirm('Voulez-vous vraiment signaler cet utilisateur ?')) {
        console.log('Report user');
    }
}

// Mobile: Back to conversations list
function showConversationsList() {
    document.querySelector('.conversations-sidebar').classList.remove('hidden');
    document.querySelector('.chat-area').classList.remove('active');
}