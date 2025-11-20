// ============================================
// DREAMFM - CREATOR DASHBOARD WITH B2 UPLOAD
// ============================================

console.log('🎨 Creator Dashboard Loading...');

let currentEditingBook = null;

// B2 Configuration
const B2_CONFIG = {
    keyId: '0054e79ba39f5820000000001',
    appKey: 'K005QdPVGM7anNg9BOTU9OhpYoEx85Y',
    bucketName: 'novel-audiobooks',
    bucketId: '743eb7896bea33e99fa50812'
};

let b2AuthToken = null;
let b2UploadUrl = null;

// ============================================
// INITIALIZE B2
// ============================================

async function initializeB2() {
    try {
        const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            headers: {
                'Authorization': 'Basic ' + btoa(B2_CONFIG.keyId + ':' + B2_CONFIG.appKey)
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('B2 Authorization failed');
        }

        b2AuthToken = data.authorizationToken;
        
        const uploadUrlResponse = await fetch(`${data.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': b2AuthToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucketId: B2_CONFIG.bucketId })
        });

        const uploadData = await uploadUrlResponse.json();
        b2UploadUrl = uploadData.uploadUrl;
        b2AuthToken = uploadData.authorizationToken;

        console.log('✅ B2 Initialized');
    } catch (error) {
        console.error('❌ B2 Init Error:', error);
        showAlert('⚠️ B2 storage connection failed', 'error');
    }
}

// ============================================
// AUTH CHECK
// ============================================

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'creator-login.html';
        return;
    }
    
    const creatorDoc = await db.collection('creators').doc(user.uid).get();
    
    if (!creatorDoc.exists) {
        alert('You are not registered as a creator!');
        window.location.href = 'creator-register.html';
        return;
    }
    
    const creatorData = creatorDoc.data();
    
    if (!creatorData.isApproved) {
        alert('Your account is pending admin approval.');
        await auth.signOut();
        window.location.href = 'creator-login.html';
        return;
    }
    
    document.getElementById('authLoading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    await initializeB2();
    
    loadDashboardData(user.uid, creatorData);
});

// ============================================
// LOAD DASHBOARD DATA
// ============================================

async function loadDashboardData(creatorId, creatorData) {
    document.getElementById('creatorName').textContent = `Welcome, ${creatorData.channelName}!`;
    
    document.getElementById('totalAudiobooks').textContent = creatorData.totalAudiobooks || 0;
    document.getElementById('totalSubscribers').textContent = creatorData.totalSubscribers || 0;
    document.getElementById('totalRevenue').textContent = `₹${creatorData.totalRevenue || 0}`;
    document.getElementById('averageRating').textContent = (creatorData.rating || 0).toFixed(1);
    
    loadMyAudiobooks(creatorId);
}

// ============================================
// LOAD MY AUDIOBOOKS
// ============================================

async function loadMyAudiobooks(creatorId) {
    try {
        const container = document.getElementById('audiobooksContainer');
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
        
        const snapshot = await db.collection('audiobooks')
            .where('creatorId', '==', creatorId)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No Audiobooks Yet</h3>
                    <p>Click "Upload New Audiobook" to get started!</p>
                </div>
            `;
            return;
        }
        
        let audiobooks = [];
        snapshot.forEach(doc => {
            audiobooks.push({ id: doc.id, ...doc.data() });
        });
        
        audiobooks.sort((a, b) => {
            const timeA = a.createdAt?.toDate() || new Date(0);
            const timeB = b.createdAt?.toDate() || new Date(0);
            return timeB - timeA;
        });
        
        let html = '<div class="audiobooks-grid">';
        audiobooks.forEach(book => {
            html += createAudiobookCard(book);
        });
        html += '</div>';
        
        container.innerHTML = html;
        
        console.log(`✅ Loaded ${audiobooks.length} audiobooks`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        document.getElementById('audiobooksContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error Loading Audiobooks</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// CREATE AUDIOBOOK CARD (FIXED!)
// ============================================

function createAudiobookCard(book) {
    // Pre-encode title for fallback
    const fallbackText = encodeURIComponent(book.title);
    const fallbackImage = `https://via.placeholder.com/250x280/ab47bc/FFFFFF?text=${fallbackText}`;
    
    // Escape book object for onclick
    const bookJson = JSON.stringify(book).replace(/'/g, '&#39;');
    
    return `
        <div class="audiobook-card">
            <img src="${book.coverUrl}" 
                 alt="${book.title}" 
                 class="audiobook-cover" 
                 onerror="this.src='${fallbackImage}'">
            <div class="audiobook-info">
                <div class="audiobook-title">${book.title}</div>
                <div class="audiobook-author">by ${book.author}</div>
                <div class="audiobook-stats">
                    <span><i class="fa-solid fa-book"></i> ${book.totalChapters} Chapters</span>
                    <span><i class="fa-solid fa-star"></i> ${(book.rating || 0).toFixed(1)}</span>
                </div>
                <div class="audiobook-actions">
                    <button class="action-btn edit-btn" onclick='openEditModal(${bookJson})'>
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                    <button class="action-btn chapters-btn" onclick='openChaptersModal(${bookJson})'>
                        <i class="fa-solid fa-plus"></i> Chapters
                    </button>
                </div>
                <button class="action-btn" 
                        style="width: 100%; margin-top: 10px; background: rgba(255, 152, 0, 0.2); color: #ff9800; border: 1px solid #ff9800;" 
                        onclick='openAudioUploadModal(${bookJson})'>
                    <i class="fa-solid fa-upload"></i> Upload Audio
                </button>
            </div>
        </div>
    `;
}

// ============================================
// UPLOAD NEW AUDIOBOOK
// ============================================

function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('uploadForm').reset();
}

document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('uploadBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
    
    try {
        const creator = window.currentCreator;
        
        if (!creator) {
            throw new Error('Not logged in');
        }
        
        const bookData = {
            title: document.getElementById('bookTitle').value.trim(),
            author: document.getElementById('bookAuthor').value.trim(),
            description: document.getElementById('bookDescription').value.trim() || '',
            coverUrl: document.getElementById('coverUrl').value.trim(),
            audioSlug: document.getElementById('audioSlug').value.trim().toLowerCase(),
            totalChapters: parseInt(document.getElementById('totalChapters').value),
            language: document.getElementById('language').value.trim() || 'Hindi',
            
            creatorId: creator.uid,
            creatorName: creator.channelName,
            
            plays: 0,
            rating: 0,
            totalRatings: 0,
            isActive: true,
            isPremium: true,
            
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('audiobooks').add(bookData);
        
        await db.collection('creators').doc(creator.uid).update({
            totalAudiobooks: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('✅ Audiobook created!', 'success');
        closeUploadModal();
        
        loadMyAudiobooks(creator.uid);
        
        const updatedCreator = await db.collection('creators').doc(creator.uid).get();
        document.getElementById('totalAudiobooks').textContent = updatedCreator.data().totalAudiobooks;
        
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('❌ Failed: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-upload"></i> Upload Audiobook';
    }
});

// ============================================
// EDIT AUDIOBOOK
// ============================================

function openEditModal(book) {
    currentEditingBook = book;
    
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookDescription').value = book.description || '';
    document.getElementById('editCoverUrl').value = book.coverUrl;
    document.getElementById('editLanguage').value = book.language || 'Hindi';
    
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
    currentEditingBook = null;
}

document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('editBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    
    try {
        const bookId = document.getElementById('editBookId').value;
        
        const updateData = {
            title: document.getElementById('editBookTitle').value.trim(),
            author: document.getElementById('editBookAuthor').value.trim(),
            description: document.getElementById('editBookDescription').value.trim(),
            coverUrl: document.getElementById('editCoverUrl').value.trim(),
            language: document.getElementById('editLanguage').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('audiobooks').doc(bookId).update(updateData);
        
        showAlert('✅ Updated!', 'success');
        closeEditModal();
        
        loadMyAudiobooks(window.currentCreator.uid);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('❌ Failed: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
    }
});

// ============================================
// ADD CHAPTERS
// ============================================

function openChaptersModal(book) {
    currentEditingBook = book;
    document.getElementById('currentChapters').textContent = book.totalChapters;
    document.getElementById('chaptersModal').style.display = 'block';
}

function closeChaptersModal() {
    document.getElementById('chaptersModal').style.display = 'none';
    document.getElementById('addChaptersCount').value = '';
    currentEditingBook = null;
}

async function addChapters() {
    const addCount = parseInt(document.getElementById('addChaptersCount').value);
    
    if (!addCount || addCount < 1) {
        showAlert('❌ Enter valid number', 'error');
        return;
    }
    
    if (!currentEditingBook) {
        showAlert('❌ No book selected', 'error');
        return;
    }
    
    try {
        const newTotal = currentEditingBook.totalChapters + addCount;
        
        await db.collection('audiobooks').doc(currentEditingBook.id).update({
            totalChapters: newTotal,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert(`✅ Added ${addCount} chapters! Total: ${newTotal}`, 'success');
        closeChaptersModal();
        
        loadMyAudiobooks(window.currentCreator.uid);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('❌ Failed: ' + error.message, 'error');
    }
}

// ============================================
// AUDIO UPLOAD MODAL
// ============================================

let audioFilesToUpload = [];

function openAudioUploadModal(book) {
    currentEditingBook = book;
    audioFilesToUpload = [];
    
    const modalHTML = `
        <div id="audioUploadModal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🎵 Upload Audio Files</h2>
                    <button class="close-modal" onclick="closeAudioUploadModal()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 10px;">${book.title}</h3>
                    <p style="color: #b0b0b0; font-size: 0.85rem;">Total Chapters: ${book.totalChapters}</p>
                    <p style="color: #ff9800; font-size: 0.85rem;">Folder: <strong>${book.audioSlug}/</strong></p>
                </div>
                
                <div class="form-group">
                    <label>Select Audio Files (MP3)</label>
                    <div id="audioDropZone" style="border: 2px dashed rgba(171, 71, 188, 0.5); border-radius: 8px; padding: 30px; text-align: center; cursor: pointer; background: rgba(171, 71, 188, 0.05);">
                        <i class="fa-solid fa-upload" style="font-size: 3rem; color: #ab47bc; margin-bottom: 10px;"></i>
                        <p style="margin-bottom: 5px;">Click or drag MP3 files here</p>
                        <small style="color: #b0b0b0;">Name: chapter-1.mp3, chapter-2.mp3, etc.</small>
                    </div>
                    <input type="file" id="audioFilesInput" accept="audio/mpeg,audio/mp3" multiple style="display: none;">
                </div>
                
                <div id="selectedAudioFiles" style="margin-top: 15px;"></div>
                
                <div id="uploadProgressSection" style="display: none; margin-top: 20px;">
                    <p id="uploadStatusText" style="margin-bottom: 10px; font-weight: 600;"></p>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div id="uploadProgressBar" style="height: 100%; background: linear-gradient(135deg, #ab47bc, #e91e63); width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>
                
                <button class="submit-btn" id="startUploadBtn" onclick="startB2Upload()" style="margin-top: 15px;" disabled>
                    <i class="fa-solid fa-cloud-upload"></i> Upload to Backblaze
                </button>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('audioUploadModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setupAudioFileInput();
}

function setupAudioFileInput() {
    const dropZone = document.getElementById('audioDropZone');
    const fileInput = document.getElementById('audioFilesInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ab47bc';
        dropZone.style.background = 'rgba(171, 71, 188, 0.15)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'rgba(171, 71, 188, 0.5)';
        dropZone.style.background = 'rgba(171, 71, 188, 0.05)';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(171, 71, 188, 0.5)';
        dropZone.style.background = 'rgba(171, 71, 188, 0.05)';
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.includes('audio'));
        handleAudioFilesSelection(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleAudioFilesSelection(files);
    });
}

function handleAudioFilesSelection(files) {
    audioFilesToUpload = files;
    
    const container = document.getElementById('selectedAudioFiles');
    
    if (files.length === 0) {
        container.innerHTML = '';
        document.getElementById('startUploadBtn').disabled = true;
        return;
    }
    
    let html = '<div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;"><h4 style="margin-bottom: 10px;">Selected Files:</h4><ul style="list-style: none; padding: 0;">';
    
    files.forEach(file => {
        const size = (file.size / 1024 / 1024).toFixed(2);
        html += `<li style="padding: 8px; background: rgba(255,255,255,0.03); margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between;">
            <span><i class="fa-solid fa-music"></i> ${file.name}</span>
            <span style="color: #b0b0b0;">${size} MB</span>
        </li>`;
    });
    
    html += '</ul></div>';
    container.innerHTML = html;
    
    document.getElementById('startUploadBtn').disabled = false;
}

async function startB2Upload() {
    if (audioFilesToUpload.length === 0) {
        showAlert('❌ No files selected', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('startUploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    
    const progressSection = document.getElementById('uploadProgressSection');
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('uploadStatusText');
    
    progressSection.style.display = 'block';
    
    try {
        if (!b2UploadUrl || !b2AuthToken) {
            statusText.textContent = 'Connecting...';
            await initializeB2();
        }
        
        const totalFiles = audioFilesToUpload.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = audioFilesToUpload[i];
            const fileName = `${currentEditingBook.audioSlug}/${file.name}`;
            
            const progress = Math.round(((i + 1) / totalFiles) * 100);
            progressBar.style.width = progress + '%';
            statusText.textContent = `Uploading ${file.name}... (${i + 1}/${totalFiles})`;
            
            await uploadFileToB2(file, fileName);
            
            console.log(`✅ Uploaded: ${fileName}`);
        }
        
        statusText.textContent = '✅ All files uploaded!';
        progressBar.style.width = '100%';
        
        showAlert(`✅ ${totalFiles} files uploaded!`, 'success');
        
        setTimeout(() => {
            closeAudioUploadModal();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        statusText.textContent = '❌ Upload failed!';
        showAlert('❌ Failed: ' + error.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fa-solid fa-cloud-upload"></i> Upload to Backblaze';
    }
}

async function uploadFileToB2(file, fileName) {
    try {
        const response = await fetch(b2UploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': b2AuthToken,
                'X-Bz-File-Name': encodeURIComponent(fileName),
                'Content-Type': 'audio/mpeg',
                'X-Bz-Content-Sha1': 'do_not_verify'
            },
            body: file
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

function closeAudioUploadModal() {
    const modal = document.getElementById('audioUploadModal');
    if (modal) modal.remove();
    currentEditingBook = null;
    audioFilesToUpload = [];
}

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    if (confirm('Logout?')) {
        await window.logoutCreator();
        window.location.href = 'creator-login.html';
    }
}

// ============================================
// SHOW ALERT
// ============================================

function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = 'alert ' + type;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 4000);
}

// ============================================
// CLOSE MODALS ON CLICK OUTSIDE
// ============================================

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

console.log('✅ Creator Dashboard Ready!');