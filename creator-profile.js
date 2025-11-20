// ============================================
// CREATOR PROFILE LOGIC
// ============================================

console.log('👤 Creator Profile Loading...');

let currentCreator = null;
let isSubscribed = false;

// ============================================
// GET CREATOR ID FROM URL
// ============================================

function getCreatorIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ============================================
// LOAD CREATOR PROFILE
// ============================================

async function loadCreatorProfile() {
    const creatorId = getCreatorIdFromUrl();

    if (!creatorId) {
        document.getElementById('loadingContainer').innerHTML = `
            <div class="loading">
                <h3>❌ Invalid Creator ID</h3>
                <p>No creator specified</p>
            </div>
        `;
        return;
    }

    try {
        // Get creator data
        const creatorDoc = await db.collection('creators').doc(creatorId).get();

        if (!creatorDoc.exists) {
            document.getElementById('loadingContainer').innerHTML = `
                <div class="loading">
                    <h3>❌ Creator Not Found</h3>
                    <p>This creator doesn't exist</p>
                </div>
            `;
            return;
        }

        currentCreator = {
            uid: creatorDoc.id,
            ...creatorDoc.data()
        };

        console.log('✅ Creator loaded:', currentCreator.channelName);

        // Check subscription status
        if (window.currentUser && window.hasActiveSubscription) {
            isSubscribed = await window.hasActiveSubscription(creatorId);
        }

        // Display profile
        displayCreatorProfile();

        // Load audiobooks
        loadCreatorAudiobooks(creatorId);

    } catch (error) {
        console.error('❌ Load error:', error);
        document.getElementById('loadingContainer').innerHTML = `
            <div class="loading">
                <h3>❌ Error Loading Profile</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// DISPLAY PROFILE
// ============================================

function displayCreatorProfile() {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('profileContainer').style.display = 'block';

    document.getElementById('creatorAvatar').src = currentCreator.profileImage;
    document.getElementById('creatorName').textContent = currentCreator.channelName;
    document.getElementById('creatorBio').textContent = currentCreator.description || 'Audiobook Creator';

    document.getElementById('totalBooks').textContent = currentCreator.totalAudiobooks || 0;
    document.getElementById('totalSubscribers').textContent = currentCreator.totalSubscribers || 0;
    document.getElementById('creatorRating').textContent = (currentCreator.rating || 0).toFixed(1);

    // Update subscribe button
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    if (isSubscribed) {
        subscribeBtn.className = 'subscribe-btn subscribed';
        subscribeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Subscribed';
    } else {
        subscribeBtn.className = 'subscribe-btn';
        subscribeBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Subscribe for ₹29/month';
    }
}

// ============================================
// LOAD CREATOR'S AUDIOBOOKS
// ============================================

async function loadCreatorAudiobooks(creatorId) {
    const container = document.getElementById('audiobooksGrid');

    try {
        const snapshot = await db.collection('audiobooks')
            .where('creatorId', '==', creatorId)
            .get();

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="loading">
                    <h3>📭 No Audiobooks Yet</h3>
                    <p>This creator hasn't uploaded any audiobooks yet</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const book = doc.data();
            const hasAccess = isSubscribed;

            html += `
                <div class="audiobook-card" onclick='${hasAccess ? `openAudiobook("${doc.id}")` : `showSubscribePrompt()`}'>
                    <img src="${book.coverUrl}" alt="${book.title}" class="audiobook-cover"
                         onerror="this.src='https://via.placeholder.com/150x200/ab47bc/FFFFFF?text=${encodeURIComponent(book.title)}'">
                    <div class="audiobook-info">
                        <div class="audiobook-title">${book.title}</div>
                        <div class="audiobook-author">${book.author}</div>
                    </div>
                    ${!hasAccess ? '<div class="lock-overlay"><i class="fa-solid fa-lock"></i></div>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('❌ Load audiobooks error:', error);
        container.innerHTML = `
            <div class="loading">
                <h3>❌ Error Loading Audiobooks</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// HANDLE SUBSCRIBE
// ============================================

function handleSubscribe() {
    if (!window.currentUser) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    if (isSubscribed) {
        alert(`You're already subscribed to ${currentCreator.channelName}!`);
        return;
    }

    if (window.subscribeToCreator) {
        window.subscribeToCreator(currentCreator.uid, currentCreator.channelName);
    }
}

// ============================================
// SHOW SUBSCRIBE PROMPT
// ============================================

function showSubscribePrompt() {
    alert(`Subscribe to ${currentCreator.channelName} for ₹29/month to access all audiobooks!`);
    handleSubscribe();
}

// ============================================
// OPEN AUDIOBOOK
// ============================================

function openAudiobook(bookId) {
    // Redirect to main app with book
    window.location.href = `index.html?play=${bookId}`;
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to load
    setTimeout(() => {
        loadCreatorProfile();
    }, 1000);
});

console.log('✅ Creator Profile Ready');