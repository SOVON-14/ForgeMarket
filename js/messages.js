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
        // Simulate API call
        // const response = await fetch('/api/v1/conversations');
        // const data = await response.json();

        // Mock data
        const mockConversations = generateMockConversations();
        conversations = mockConversations;

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

// Generate Mock Conversations
function generateMockConversations() {
    const artisans = ['Kofi A.', 'Komlan M.', 'Yawo K.', 'Afi B.'];
    const lastMessages = [
        'Bonjour, je suis disponible pour votre projet',
        'Pouvez-vous me donner plus de détails ?',
        'Le devis est prêt, je vous l\'envoie',
        'Merci pour votre confiance !'
    ];

    return Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        artisanId: i + 1,
        artisanName: artisans[i],
        artisanAvatar: `https://via.placeholder.com/50/C2652A/FFFFFF?text=${artisans[i][0]}`,
        lastMessage: lastMessages[i],
        lastMessageTime: new Date(Date.now() - (i * 3600000)).toISOString(),
        unread: i === 0,
        online: i % 2 === 0
    }));
}

// Display Conversations
function displayConversations(convs) {
    const conversationsList = document.getElementById('conversationsList');

    conversationsList.innerHTML = convs.map(conv => `
        <div class="conversation-item ${conv.unread ? 'unread' : ''} ${currentConversation === conv.id ? 'active' : ''}"
             onclick="selectConversation(${conv.id})">
            <div class="conversation-header">
                <img src="${conv.artisanAvatar}" alt="${conv.artisanName}" class="conversation-avatar">
                <div>
                    <h4 class="conversation-name">${conv.artisanName}</h4>
                </div>
            </div>
            <p class="conversation-preview">${conv.lastMessage}</p>
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
        // Simulate API call
        // const response = await fetch(`/api/v1/conversations/${conversationId}/messages`);
        // const data = await response.json();

        // Mock data
        const mockMessages = generateMockMessages(conversationId);
        messages = mockMessages;

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

// Generate Mock Messages
function generateMockMessages(conversationId) {
    const myMessages = [
        'Bonjour, je voudrais discuter de mon projet',
        'Il s\'agit d\'un portail en fer forgé',
        'Quels sont vos tarifs ?'
    ];
    const artisanMessages = [
        'Bonjour ! Je suis à votre écoute',
        'Excellent choix ! Pouvez-vous me donner les dimensions ?',
        'Mes tarifs commencent à 50 000 FCFA selon la complexité'
    ];

    const msgs = [];
    for (let i = 0; i < 6; i++) {
        const isMine = i % 2 === 0;
        msgs.push({
            id: i + 1,
            conversationId: conversationId,
            sender: isMine ? 'me' : 'artisan',
            content: isMine ? myMessages[i / 2] : artisanMessages[Math.floor(i / 2)],
            timestamp: new Date(Date.now() - ((5 - i) * 600000)).toISOString(),
            status: isMine ? 'read' : null
        });
    }

    return msgs;
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
            <div class="message-content">${msg.content}</div>
            ${msg.sender === 'me' ? `<div class="message-status">${getMessageStatus(msg.status)}</div>` : ''}
        </div>
    `).join('');
}

// Get Message Status
function getMessageStatus(status) {
    switch (status) {
        case 'sent':
            return '✓';
        case 'delivered':
            return '✓✓';
        case 'read':
            return '✓✓ (lu)';
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
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content || !currentConversation) return;

    const newMessage = {
        id: messages.length + 1,
        conversationId: currentConversation,
        sender: 'me',
        content: content,
        timestamp: new Date().toISOString(),
        status: 'sent'
    };

    messages.push(newMessage);
    displayMessages(messages);
    scrollToBottom();

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Update conversation preview
    const conversation = conversations.find(c => c.id === currentConversation);
    if (conversation) {
        conversation.lastMessage = content;
        conversation.lastMessageTime = new Date().toISOString();
        displayConversations(conversations);
    }

    // Simulate API call
    // In real app, send to server via WebSocket or HTTP
    console.log('Sending message:', newMessage);
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

function loadArtisansForNewConversation() {
    const select = document.getElementById('newConversationArtisan');

    // Mock data
    const mockArtisans = [
        { id: 1, name: 'Kofi A.', specialty: 'Ferronnerie' },
        { id: 2, name: 'Komlan M.', specialty: 'Soudure' },
        { id: 3, name: 'Yawo K.', specialty: 'Construction métallique' }
    ];

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

function createConversationWithArtisan(artisanId, initialMessage = '') {
    // In real app, call API to create conversation
    const newConversation = {
        id: conversations.length + 1,
        artisanId: artisanId,
        artisanName: 'Nouvel Artisan',
        artisanAvatar: `https://via.placeholder.com/50/C2652A/FFFFFF?text=NA`,
        lastMessage: initialMessage || 'Nouvelle conversation',
        lastMessageTime: new Date().toISOString(),
        unread: false,
        online: false
    };

    conversations.unshift(newConversation);
    displayConversations(conversations);
    selectConversation(newConversation.id);

    if (initialMessage) {
        // Send initial message
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            messageInput.value = initialMessage;
            sendMessage();
        }, 100);
    }
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