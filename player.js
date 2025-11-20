// ============================================
// DREAMFM SECURE AUDIO PLAYER (UPDATED - 10 FREE CHAPTERS)
// ============================================

console.log("🎧 Secure Player.js loaded");

// Global Player State
const PlayerState = {
    currentBook: null,
    currentChapter: 1,
    isPlaying: false,
    audioElement: null,
    playbackSpeed: 1.0,
    volume: 1.0,
    blobUrl: null,
    unlockedChapters: []
};

// 🔒 SECURITY: Disable Right Click & DevTools
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'AUDIO' || e.target.closest('.audio-player')) {
        e.preventDefault();
        showToast('⚠️ Download not allowed');
    }
});

// 🔒 Disable common download shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 's') || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u')) {
        if (document.querySelector('.full-player').style.display === 'block') {
            e.preventDefault();
            showToast('⚠️ Action not allowed');
        }
    }
});

// 🔒 DevTools Detection
let devtoolsOpen = false;
const detectDevTools = () => {
    const threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold) {
        if (!devtoolsOpen && PlayerState.isPlaying) {
            devtoolsOpen = true;
            console.log('DevTools detected - pausing for security');
            PlayerState.audioElement.pause();
            PlayerState.isPlaying = false;
            updatePlayButton();
            showToast('⚠️ Please close DevTools to continue');
        }
    } else {
        devtoolsOpen = false;
    }
};
setInterval(detectDevTools, 1000);

// Initialize Audio Element
function initializePlayer() {
    PlayerState.audioElement = document.getElementById('audioElement');
    
    if (!PlayerState.audioElement) {
        console.error("❌ Audio element not found!");
        return;
    }
    
    // 🔒 Hide controls (custom player only)
    PlayerState.audioElement.controls = false;
    PlayerState.audioElement.controlsList = 'nodownload noplaybackrate';
    
    // Event Listeners
    PlayerState.audioElement.addEventListener('loadedmetadata', onAudioLoaded);
    PlayerState.audioElement.addEventListener('timeupdate', onTimeUpdate);
    PlayerState.audioElement.addEventListener('ended', onAudioEnded);
    PlayerState.audioElement.addEventListener('error', onAudioError);
    
    // Control Buttons
    document.getElementById('miniPlayBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
    
    document.getElementById('playPauseBtn')?.addEventListener('click', togglePlayPause);
    document.getElementById('prevChapterBtn')?.addEventListener('click', previousChapter);
    document.getElementById('nextChapterBtn')?.addEventListener('click', nextChapter);
    document.getElementById('closePlayer')?.addEventListener('click', closeFullPlayer);
    
    // Open full player when clicking mini player
    const miniPlayerContent = document.querySelector('.mini-player-content');
    miniPlayerContent?.addEventListener('click', openFullPlayer);
    
    document.getElementById('seekBar')?.addEventListener('input', onSeek);
    document.getElementById('volumeSlider')?.addEventListener('input', onVolumeChange);
    document.getElementById('speedBtn')?.addEventListener('click', cycleSpeed);
    document.getElementById('chaptersBtn')?.addEventListener('click', toggleChaptersList);
    
    console.log("✅ Secure Player initialized");
}

// ============================================
// 🔒 PLAY AUDIOBOOK (Subscription already checked in app.js)
// ============================================

async function playAudiobook(bookId, bookData) {
    console.log("🎵 Playing:", bookData.title);
    
    // Subscription already checked in openBook() function
    // So directly play
    
    PlayerState.currentBook = {
        id: bookId,
        ...bookData
    };
    PlayerState.currentChapter = 1;
    PlayerState.unlockedChapters = []; // Reset unlocked chapters
    
    updatePlayerUI();
    loadChapter(1);
    
    document.getElementById('miniPlayer').style.display = 'block';
    openFullPlayer();
}

// ============================================
// 🔒 LOAD CHAPTER (10 FREE + MEMBERSHIP + COINS) ✅ UPDATED
// ============================================

async function loadChapter(chapterNum) {
    const book = PlayerState.currentBook;
    
    if (!book) {
        console.error("❌ No book loaded");
        return;
    }
    
    // ✅ PEHLE 10 CHAPTERS = FREE (SABKE LIYE)
    if (chapterNum <= 10) {
        console.log(`✅ Chapter ${chapterNum} is FREE (first 10 chapters)`);
        loadChapterAudio(chapterNum);
        return;
    }
    
    // 🔒 CHAPTER 11+ = CHECK MEMBERSHIP FIRST, THEN COINS
    if (chapterNum > 10) {
        
        // Check if already unlocked with coins
        if (PlayerState.unlockedChapters.includes(chapterNum)) {
            loadChapterAudio(chapterNum);
            return;
        }
        
        // Check membership (for creator content only)
        if (book.creatorId && book.isPremium) {
            console.log(`🔒 Chapter ${chapterNum} - Checking membership...`);
            
            const hasMembership = await window.hasActiveSubscription(book.creatorId);
            
            if (hasMembership) {
                console.log(`✅ Membership active - Chapter ${chapterNum} unlocked!`);
                loadChapterAudio(chapterNum);
                return;
            } else {
                console.log(`❌ No membership - Need coins to unlock`);
            }
        }
        
        // No membership - Ask for coin unlock
        const unlocked = await checkAndUnlockChapter(chapterNum);
        if (!unlocked) {
            return; // User cancelled or insufficient coins
        }
        
        loadChapterAudio(chapterNum);
    }
}

// 🔒 LOAD CHAPTER AUDIO (actual loading)
async function loadChapterAudio(chapterNum) {
    const book = PlayerState.currentBook;
    
    PlayerState.currentChapter = chapterNum;
    
    // Clean up old blob URL
    if (PlayerState.blobUrl) {
        URL.revokeObjectURL(PlayerState.blobUrl);
    }
    
    // Generate secure URL
    const audioUrl = generateAudioURL(book.audioSlug, chapterNum);
    console.log("🔒 Loading audio...");
    
    try {
        const response = await fetch(audioUrl);
        
        if (!response.ok) {
            throw new Error('Audio file not found');
        }
        
        const blob = await response.blob();
        PlayerState.blobUrl = URL.createObjectURL(blob);
        
        PlayerState.audioElement.src = PlayerState.blobUrl;
        PlayerState.audioElement.load();
        
        updatePlayerUI();
        showToast(`📖 Chapter ${chapterNum} loaded`);
        
    } catch (error) {
        console.error('❌ Load error:', error);
        showToast(`❌ Chapter ${chapterNum} not available`);
    }
}

// 💰 Check and Unlock Chapter with Coins (for chapter 11+) ✅ UPDATED
async function checkAndUnlockChapter(chapterNum) {
    const CHAPTER_COST = 10; // 10 coins per chapter
    
    // Ask user to unlock with coins
    const confirmUnlock = confirm(
        `🔒 Chapter ${chapterNum} is locked!\n\n` +
        `Unlock with ${CHAPTER_COST} coins?\n` +
        `(Or subscribe to get all chapters free for 1 month)`
    );
    
    if (!confirmUnlock) {
        return false;
    }
    
    // Simple coins deduction (localStorage)
    const currentCoins = parseInt(localStorage.getItem('userCoins') || '0');
    
    if (currentCoins < CHAPTER_COST) {
        const buyMore = confirm("❌ Not enough coins!\n\nWant to buy more coins?");
        if (buyMore) {
            closeFullPlayer();
            document.getElementById('miniPlayer').style.display = 'none';
            navigateTo('profile'); // Go to profile (coins are there)
        }
        return false;
    }
    
    // Deduct coins
    localStorage.setItem('userCoins', (currentCoins - CHAPTER_COST).toString());
    PlayerState.unlockedChapters.push(chapterNum);
    showToast(`✅ Chapter ${chapterNum} unlocked! (${CHAPTER_COST} coins used)`);
    
    return true;
}

// Generate Audio URL
function generateAudioURL(audioSlug, chapterNum) {
    const WORKER_URL = 'https://gentle-union-d9c6.singhvikas21571.workers.dev';
    return `${WORKER_URL}/${audioSlug}/chapter-${chapterNum}.mp3`;
}

// Update Player UI
function updatePlayerUI() {
    const book = PlayerState.currentBook;
    if (!book) return;
    
    const chapterNum = PlayerState.currentChapter;
    
    // Mini Player
    document.getElementById('miniCover').src = book.coverUrl;
    document.getElementById('miniTitle').textContent = book.title;
    document.getElementById('miniChapter').textContent = `Chapter ${chapterNum}`;
    
    // Full Player
    document.getElementById('playerCoverImg').src = book.coverUrl;
    document.getElementById('playerBookTitle').textContent = book.title;
    document.getElementById('playerAuthor').textContent = book.author;
    document.getElementById('playerChapterTitle').textContent = `Chapter ${chapterNum}`;
    
    updatePlayButton();
    loadChaptersList();
}

// Toggle Play/Pause
function togglePlayPause() {
    if (!PlayerState.audioElement || !PlayerState.audioElement.src) {
        showToast("⚠️ No audio loaded");
        return;
    }
    
    if (PlayerState.isPlaying) {
        PlayerState.audioElement.pause();
        PlayerState.isPlaying = false;
    } else {
        PlayerState.audioElement.play()
            .then(() => {
                PlayerState.isPlaying = true;
                updatePlayButton();
            })
            .catch(err => {
                console.error("❌ Play error:", err);
                showToast("❌ Failed to play audio");
            });
    }
    
    updatePlayButton();
}

// Update Play Button
function updatePlayButton() {
    const miniBtn = document.getElementById('miniPlayBtn');
    const fullBtn = document.getElementById('playPauseBtn');
    
    if (PlayerState.isPlaying) {
        if (miniBtn) miniBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        if (fullBtn) fullBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        if (miniBtn) miniBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (fullBtn) fullBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

// Previous Chapter
function previousChapter() {
    if (PlayerState.currentChapter > 1) {
        loadChapter(PlayerState.currentChapter - 1);
        if (PlayerState.isPlaying) {
            setTimeout(() => PlayerState.audioElement.play(), 100);
        }
    } else {
        showToast("📖 Already at first chapter");
    }
}

// Next Chapter
function nextChapter() {
    const book = PlayerState.currentBook;
    if (book && PlayerState.currentChapter < book.totalChapters) {
        loadChapter(PlayerState.currentChapter + 1);
        if (PlayerState.isPlaying) {
            setTimeout(() => PlayerState.audioElement.play(), 100);
        }
    } else {
        showToast("📖 No more chapters");
    }
}

// Audio Event Handlers
function onAudioLoaded() {
    const duration = PlayerState.audioElement.duration;
    console.log("✅ Audio loaded, duration:", formatTime(duration));
    document.getElementById('durationDisplay').textContent = formatTime(duration);
}

function onTimeUpdate() {
    const current = PlayerState.audioElement.currentTime;
    const duration = PlayerState.audioElement.duration;
    
    if (duration > 0) {
        const percentage = (current / duration) * 100;
        
        document.getElementById('miniProgressBar').style.width = percentage + '%';
        document.getElementById('seekBar').value = percentage;
        document.getElementById('currentTimeDisplay').textContent = formatTime(current);
    }
}

function onAudioEnded() {
    console.log("✅ Chapter ended");
    PlayerState.isPlaying = false;
    updatePlayButton();
    
    // Auto play next chapter
    setTimeout(() => nextChapter(), 1000);
}

function onAudioError(e) {
    console.error("❌ Audio error:", e);
    showToast('❌ Audio file not found!');
    PlayerState.isPlaying = false;
    updatePlayButton();
}

// Seek
function onSeek(e) {
    const percentage = e.target.value;
    const duration = PlayerState.audioElement.duration;
    
    if (duration > 0) {
        PlayerState.audioElement.currentTime = (percentage / 100) * duration;
    }
}

// Volume Change
function onVolumeChange(e) {
    const volume = e.target.value / 100;
    PlayerState.audioElement.volume = volume;
    PlayerState.volume = volume;
}

// Cycle Speed
function cycleSpeed() {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(PlayerState.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    
    PlayerState.playbackSpeed = speeds[nextIndex];
    PlayerState.audioElement.playbackRate = PlayerState.playbackSpeed;
    
    document.getElementById('speedBtn').textContent = PlayerState.playbackSpeed + 'x';
    showToast(`⚡ Speed: ${PlayerState.playbackSpeed}x`);
}

// Toggle Chapters List
function toggleChaptersList() {
    const chaptersList = document.getElementById('chaptersList');
    if (chaptersList.style.display === 'none' || chaptersList.style.display === '') {
        chaptersList.style.display = 'block';
    } else {
        chaptersList.style.display = 'none';
    }
}

// Load Chapters List (with FREE/LOCKED status) ✅ UPDATED
function loadChaptersList() {
    const book = PlayerState.currentBook;
    if (!book) return;
    
    const container = document.getElementById('chaptersContent');
    container.innerHTML = '';
    
    for (let i = 1; i <= book.totalChapters; i++) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        
        // Determine status
        let statusIcon = '';
        let statusText = '';
        
        if (i <= 10) {
            // First 10 chapters = FREE
            statusIcon = '<i class="fa-solid fa-unlock" style="color: #10b981;"></i>';
            statusText = 'FREE';
        } else if (PlayerState.unlockedChapters.includes(i)) {
            // Unlocked with coins
            statusIcon = '<i class="fa-solid fa-book-open" style="color: #3b82f6;"></i>';
            statusText = '';
        } else {
            // Locked
            statusIcon = '<i class="fa-solid fa-lock" style="color: #ef4444;"></i>';
            statusText = '🪙10';
        }
        
        if (i === PlayerState.currentChapter) {
            chapterDiv.classList.add('active');
        }
        
        chapterDiv.innerHTML = `
            <span>${statusIcon} Chapter ${i}</span>
            <span style="color: #10b981; font-size: 0.75rem; font-weight: 600;">${statusText}</span>
        `;
        
        chapterDiv.addEventListener('click', () => {
            loadChapter(i);
            if (PlayerState.isPlaying) {
                setTimeout(() => PlayerState.audioElement.play(), 100);
            }
            toggleChaptersList();
        });
        
        container.appendChild(chapterDiv);
    }
}

// Open/Close Full Player
function openFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toast Notification
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (PlayerState.blobUrl) {
        URL.revokeObjectURL(PlayerState.blobUrl);
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initializePlayer);

console.log("✅ Player ready (10 Free Chapters + Membership + Coins)");