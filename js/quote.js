// ForgeMarket - Quote/Tender Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeQuotePage();
});

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

function initializeQuotePage() {
    checkAuthentication();
    checkQuoteAccess();
    initializeTypeSelection();
    initializeArtisanSelect();
    initializeForm();
    initializeVoiceRecorder();
}

// Check Authentication
function checkAuthentication() {
    if (typeof AppState !== 'undefined' && !AppState.isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Check Quote Access (5 orders rule)
function checkQuoteAccess() {
    const accessDenied = document.getElementById('accessDenied');
    const quoteFormContainer = document.getElementById('quoteFormContainer');

    // Get completed orders from user session or localStorage
    let completedOrders = 0;
    if (typeof AppState !== 'undefined' && AppState.currentUser) {
        completedOrders = AppState.currentUser.completedOrders || 0;
    } else {
        const savedUser = localStorage.getItem('forgeMarket_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            completedOrders = user.completedOrders || 0;
        }
    }

    const targetOrders = 5;

    if (completedOrders < targetOrders) {
        // Show access denied
        accessDenied.classList.remove('hidden');
        quoteFormContainer.classList.add('hidden');

        // Update progress
        document.getElementById('currentProgress').textContent = completedOrders;
        const percentage = (completedOrders / targetOrders) * 100;
        document.getElementById('progressBar').style.width = `${percentage}%`;
    } else {
        // Show quote form
        accessDenied.classList.add('hidden');
        quoteFormContainer.classList.remove('hidden');
    }
}

// Initialize Type Selection
function initializeTypeSelection() {
    const typeRadios = document.querySelectorAll('input[name="quoteType"]');
    const directSection = document.getElementById('directRequestSection');
    const tenderSection = document.getElementById('tenderRequestSection');

    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'direct') {
                directSection.classList.remove('hidden');
                tenderSection.classList.add('hidden');
            } else {
                directSection.classList.add('hidden');
                tenderSection.classList.remove('hidden');
            }
        });
    });
}

// Initialize Artisan Select
async function initializeArtisanSelect() {
    const artisanSelect = document.getElementById('artisanSelect');

    try {
        const response = await fetch('/api/v1/artisans/index.php');
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error || 'Artisans indisponibles');
        const artisans = responseData.data || [];

        artisanSelect.innerHTML = '<option value="">Sélectionnez un artisan</option>' +
            artisans.map(artisan =>
                `<option value="${artisan.id}">${artisan.name} - ${artisan.specialty}</option>`
            ).join('');

        // Pre-select artisan if provided in URL
        const urlParams = new URLSearchParams(window.location.search);
        const artisanId = urlParams.get('artisan');
        if (artisanId) {
            artisanSelect.value = artisanId;
            // Auto-select direct request type
            document.querySelector('input[name="quoteType"][value="direct"]').checked = true;
            document.querySelector('input[name="quoteType"][value="direct"]').dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error('Error loading artisans:', error);
    }
}

// Initialize Form
function initializeForm() {
    const quoteForm = document.getElementById('quoteForm');

    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(quoteForm);
            const quoteType = document.querySelector('input[name="quoteType"]:checked').value;

            const quoteData = {
                type: quoteType,
                title: formData.get('title'),
                description: formData.get('description'),
                deadline: formData.get('deadline'),
                address: formData.get('address'),
                // Direct request specific
                artisanId: quoteType === 'direct' ? formData.get('artisanSelect') : null,
                // Tender specific
                category: quoteType === 'tender' ? formData.get('category') : null,
                location: quoteType === 'tender' ? formData.get('location') : null,
                budget: quoteType === 'tender' ? formData.get('budget') : null,
                // Files would be handled separately in real implementation
                files: [],
                voiceNote: audioChunks.length > 0
            };

            try {
                const response = await fetch('/api/v1/quotes.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quoteData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Demande impossible');

                // Show success message
                alert('Demande de devis envoyée avec succès ! Vous recevrez les propositions des artisans.');

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Error submitting quote:', error);
                alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
            }
        });
    }
}

// Initialize Voice Recorder
function initializeVoiceRecorder() {
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const recordingStatus = document.getElementById('recordingStatus');

    if (recordButton && stopButton) {
        recordButton.addEventListener('click', startRecording);
        stopButton.addEventListener('click', stopRecording);
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            console.log('Audio recorded:', audioBlob);
            // In real implementation, upload this blob to server
        };

        mediaRecorder.start();
        isRecording = true;

        // Update UI
        document.getElementById('recordButton').classList.add('hidden');
        document.getElementById('stopButton').classList.remove('hidden');
        document.getElementById('recordingStatus').innerHTML = '<span class="recording-indicator"></span>Enregistrement...';

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Impossible d\'accéder au microphone. Vérifiez vos permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Update UI
        document.getElementById('recordButton').classList.remove('hidden');
        document.getElementById('stopButton').classList.add('hidden');
        document.getElementById('recordingStatus').textContent = 'Message vocal enregistré <i class="fas fa-check"></i>';
    }
}

// Set minimum date for deadline to today
const deadlineInput = document.getElementById('deadline');
if (deadlineInput) {
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.setAttribute('min', today);
}