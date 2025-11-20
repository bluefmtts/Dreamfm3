// ============================================
// DREAMFM - MAIN APP LOGIC (UPDATED - 10 FREE CHAPTERS)
// ============================================

console.log("🚀 DreamFM App Starting...");

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded");
    setupEventListeners();
    loadHomePage();
    initializeUserData();
});

// User Data Storage (LocalStorage)
function initializeUserData() {
    if (!localStorage.getItem('likedBooks')) {
        localStorage.setItem('likedBooks', JSON.stringify([]));
    }
    if (!localStorage.getItem('historyBooks')) {
        localStorage.setItem('historyBooks', JSON.stringify([]));
    }
    if (!localStorage.getItem('userCoins')) {
        localStorage.setItem('userCoins', '0');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Bottom Navigation
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Navigate to page
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    console.log("✅ Event listeners setup complete");
}

// ============================================
// NAVIGATION SYSTEM (3 PAGES ONLY)
// ============================================

function navigateTo(page) {
    console.log("📍 Navigating to:", page);
    
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'creators':
            window.location.href = 'creators-list.html';
            break;
        case 'profile':
            loadProfilePage();
            break;
        default:
            loadHomePage();
    }
}

// ============================================
// HOME PAGE (MIXED AUDIOBOOKS - SABKA EK SAATH)
// ============================================

function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error("❌ mainContent element not found!");
        return;
    }
    
    console.log("📄 Loading Home Page...");
    
    mainContent.innerHTML = `
        <div class="home-page">
            <!-- Section 1: Featured Audiobooks -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>🔥 Top Picks for You</h2>
                </div>
                <div class="carousel" id="featuredCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 2: Recently Added -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>📚 Recently Added</h2>
                </div>
                <div class="carousel" id="recentCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 3: Most Popular -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>⭐ Most Popular</h2>
                </div>
                <div class="carousel" id="popularCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 4: All Audiobooks (GRID - 2 per row mobile) -->
            <section class="all-audiobooks-section">
                <div class="section-header">
                    <h2>🎧 All Audiobooks</h2>
                </div>
                <div class="all-audiobooks-grid" id="allAudiobooksGrid">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
        </div>
    `;
    
    // Load audiobooks (MIXED - owner + creators)
    loadAudiobooks();
}

// ============================================
// LOAD AUDIOBOOKS (MIXED - SABKA EK SAATH)
// ============================================

async function loadAudiobooks() {
    try {
        console.log("📡 Fetching ALL audiobooks (owner + creators)...");
        
        // Fetch ALL audiobooks - no filter by creator
        const snapshot = await db.collection('audiobooks')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            console.warn("⚠️ No audiobooks found");
            document.getElementById('featuredCarousel').innerHTML = `
                <div class="no-books">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                    <h3>No audiobooks yet</h3>
                    <p>Check back soon!</p>
                </div>
            `;
            return;
        }
        
        console.log(`✅ Loaded ${snapshot.size} audiobooks (mixed content)`);
        
        // Store all books
        window.allAudiobooks = [];
        snapshot.forEach(doc => {
            window.allAudiobooks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Display in different sections - 4 BOOKS HAR SECTION ME
        displayFeaturedBooks(window.allAudiobooks.slice(0, 4));
        displayRecentBooks(window.allAudiobooks.slice(0, 4));
        displayPopularBooks(window.allAudiobooks.slice(0, 4));
        
        // Display ALL audiobooks in GRID (2 per row mobile)
        displayAllAudiobooks(window.allAudiobooks);
        
    } catch (error) {
        console.error("❌ Error loading audiobooks:", error);
        document.getElementById('featuredCarousel').innerHTML = `
            <div class="no-books">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <h3>Error Loading Audiobooks</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Display Featured Books - 4 books
function displayFeaturedBooks(books) {
    const container = document.getElementById('featuredCarousel');
    if (!container) return;
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Display Recent Books - 4 books
function displayRecentBooks(books) {
    const container = document.getElementById('recentCarousel');
    if (!container) return;
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Display Popular Books - 4 books
function displayPopularBooks(books) {
    const container = document.getElementById('popularCarousel');
    if (!container) return;
    
    // Sort by plays
    const sorted = [...books].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    
    container.innerHTML = '';
    sorted.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Display ALL Audiobooks - Grid Layout (2 per row mobile)
function displayAllAudiobooks(books) {
    const container = document.getElementById('allAudiobooksGrid');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="no-books">
                <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                <h3>No audiobooks available</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// ============================================
// CREATE MOBILE BOOK CARD (WITH CREATOR NAME - BLUE/GOLD) ✅
// ============================================

function createMobileBookCard(book) {
    const rating = book.rating || 4.5;
    const plays = book.plays || Math.floor(Math.random() * 10000000);
    const playsFormatted = formatPlays(plays);
    
    // Check if creator content (show lock if premium)
    const isCreatorContent = book.creatorId && book.isPremium;
    const lockIcon = isCreatorContent ? '<span class="lock-icon"><i class="fa-solid fa-lock"></i></span>' : '';
    
    // 🎨 CREATOR NAME - Blue/Gold gradient, small size (niche title ke)
    const creatorTag = book.creatorId ? 
        `<p class="creator-name-tag">By ${book.creatorName || book.author}</p>` : '';
    
    return `
        <div class="audio-card" onclick="openBook('${book.id}')">
            <div class="card-image">
                ${lockIcon}
                <img src="${book.coverUrl || 'https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'">
                <span class="plays-badge">${playsFormatted}+</span>
            </div>
            <div class="card-info">
                <div class="stats">
                    <span>${playsFormatted} PLAYS</span>
                    <span><i class="fa-solid fa-star"></i> ${rating.toFixed(1)}</span>
                </div>
                <p class="title">${book.title}</p>
                ${creatorTag}
            </div>
        </div>
    `;
}

// Format Plays Number
function formatPlays(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

// ============================================
// OPEN BOOK (DIRECT PLAY - NO SUBSCRIPTION CHECK) ✅ FIXED
// ============================================

async function openBook(bookId) {
    console.log("📖 Opening book:", bookId);
    
    // Find book
    const book = window.allAudiobooks.find(b => b.id === bookId);
    
    if (!book) {
        console.error("❌ Book not found:", bookId);
        showToast("❌ Book not found!");
        return;
    }
    
    // ✅ DIRECTLY PLAY - NO SUBSCRIPTION CHECK HERE
    // Chapter unlock logic player me hai (pehle 10 free, baad me membership/coins)
    console.log("✅ Opening audiobook - First 10 chapters are FREE!");
    
    // Add to history
    addToHistory(book);
    
    // Play audiobook (unlock logic player.js me hai)
    playAudiobook(bookId, book);
}

// Add to History
function addToHistory(book) {
    let history = JSON.parse(localStorage.getItem('historyBooks') || '[]');
    
    // Remove if already exists
    history = history.filter(b => b.id !== book.id);
    
    // Add to beginning
    history.unshift({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        timestamp: Date.now()
    });
    
    // Keep only last 5
    history = history.slice(0, 5);
    
    localStorage.setItem('historyBooks', JSON.stringify(history));
}

// ============================================
// PROFILE PAGE (WITH COINS & SUBSCRIPTIONS)
// ============================================

function loadProfilePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!window.currentUser) {
        mainContent.innerHTML = `
            <div class="profile-page">
                <div class="empty-state">
                    <div style="font-size: 5rem; margin-bottom: 20px;">🔒</div>
                    <h1>Login Required</h1>
                    <p>Please login to access your profile</p>
                </div>
            </div>
        `;
        return;
    }
    
    const user = window.currentUser;
    const userCoins = parseInt(localStorage.getItem('userCoins') || '0');
    const likedBooks = JSON.parse(localStorage.getItem('likedBooks') || '[]');
    const historyBooks = JSON.parse(localStorage.getItem('historyBooks') || '[]');
    
    mainContent.innerHTML = `
        <div class="profile-page">
            <!-- Profile Header -->
            <div class="profile-header">
                <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email}" 
                     class="profile-avatar-large">
                <h1>${user.displayName || 'User'}</h1>
                <p>${user.email}</p>
            </div>
            
            <!-- Stats -->
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-icon">🪙</div>
                    <h3>${userCoins}</h3>
                    <p>Coins</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <h3>${likedBooks.length}</h3>
                    <p>Liked</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <h3>${historyBooks.length}</h3>
                    <p>History</p>
                </div>
            </div>
            
            <!-- Coins & Subscriptions Section -->
            <section class="profile-section">
                <div class="section-header">
                    <h2>💳 Coins & Subscriptions</h2>
                </div>
                
                <!-- Coin Balance Card -->
                <div class="coin-balance-card" style="margin-bottom: 15px;">
                    <div class="coin-icon">🪙</div>
                    <div class="coin-info">
                        <h2>${userCoins} Coins</h2>
                        <p>Your current balance</p>
                    </div>
                </div>
                
                <!-- Buy Coins Packages -->
                <div class="coins-grid" style="margin-bottom: 20px;">
                    <div class="coin-package" onclick="purchaseCoins(1, 50)">
                        <div class="coin-icon-pkg">🪙</div>
                        <h3>50 Coins</h3>
                        <div class="coin-price">₹1</div>
                        <button class="coin-btn">Buy Now</button>
                    </div>
                    
                    <div class="coin-package popular" onclick="purchaseCoins(5, 300)">
                        <div class="popular-badge">🔥 POPULAR</div>
                        <div class="coin-icon-pkg">🪙</div>
                        <h3>300 Coins</h3>
                        <div class="coin-price">₹5</div>
                        <div class="coin-bonus">+20% Bonus</div>
                        <button class="coin-btn">Buy Now</button>
                    </div>
                    
                    <div class="coin-package best-value" onclick="purchaseCoins(10, 700)">
                        <div class="popular-badge">💎 BEST VALUE</div>
                        <div class="coin-icon-pkg">🪙</div>
                        <h3>700 Coins</h3>
                        <div class="coin-price">₹10</div>
                        <div class="coin-bonus">+40% Bonus</div>
                        <button class="coin-btn">Buy Now</button>
                    </div>
                </div>
            </section>
            
            <!-- Actions -->
            <div class="profile-actions">
                <button class="profile-btn" onclick="window.location.href='my-subscriptions.html'">
                    <i class="fa-solid fa-list"></i>
                    My Subscriptions
                </button>
                <button class="profile-btn" onclick="window.location.href='creators-list.html'">
                    <i class="fa-solid fa-users"></i>
                    Browse Creators
                </button>
                <button class="profile-btn" onclick="window.logout()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                </button>
            </div>
        </div>
    `;
}

// Purchase Coins
window.purchaseCoins = function(price, coins) {
    const confirm = window.confirm(`Purchase ${coins} coins for ₹${price}?`);
    
    if (confirm) {
        const currentCoins = parseInt(localStorage.getItem('userCoins') || '0');
        localStorage.setItem('userCoins', (currentCoins + coins).toString());
        showToast(`🪙 ${coins} coins added!`);
        loadProfilePage(); // Reload to update balance
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show Toast Notification
function showToast(message) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions globally accessible
window.navigateTo = navigateTo;
window.loadHomePage = loadHomePage;
window.loadProfilePage = loadProfilePage;

console.log('✅ DreamFM App Ready (10 Free Chapters + Creator Name Display)');