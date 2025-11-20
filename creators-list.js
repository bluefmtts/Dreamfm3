// ============================================
// CREATORS LIST LOGIC
// ============================================

console.log('📋 Creators List Loading...');

let allCreators = [];

// ============================================
// LOAD CREATORS
// ============================================

async function loadCreators() {
    try {
        const snapshot = await db.collection('creators')
            .where('isApproved', '==', true)
            .where('isActive', '==', true)
            .get();

        allCreators = [];
        snapshot.forEach(doc => {
            allCreators.push({
                uid: doc.id,
                ...doc.data()
            });
        });

        // Sort by subscribers
        allCreators.sort((a, b) => (b.totalSubscribers || 0) - (a.totalSubscribers || 0));

        console.log(`✅ Loaded ${allCreators.length} creators`);

        displayCreators(allCreators);

    } catch (error) {
        console.error('❌ Load error:', error);
        document.getElementById('creatorsContainer').innerHTML = `
            <div class="loading">
                <h3>❌ Error Loading Creators</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// DISPLAY CREATORS
// ============================================

function displayCreators(creators) {
    const container = document.getElementById('creatorsContainer');

    if (creators.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <h3>📭 No Creators Found</h3>
                <p>Be the first creator!</p>
            </div>
        `;
        return;
    }

    let html = '<div class="creators-grid">';

    creators.forEach(creator => {
        html += `
            <div class="creator-card" onclick="openCreatorProfile('${creator.uid}')">
                <img src="${creator.profileImage}" alt="${creator.channelName}" class="creator-avatar">
                <div class="creator-name">${creator.channelName}</div>
                <p style="text-align: center; color: #b0b0b0; font-size: 0.85rem; margin-top: 5px;">
                    ${creator.description || 'Audiobook Creator'}
                </p>
                <div class="creator-stats">
                    <div class="stat">
                        <div class="stat-value">${creator.totalAudiobooks || 0}</div>
                        <div class="stat-label">Books</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${creator.totalSubscribers || 0}</div>
                        <div class="stat-label">Subscribers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${(creator.rating || 0).toFixed(1)}</div>
                        <div class="stat-label">Rating</div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// SEARCH
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            if (term === '') {
                displayCreators(allCreators);
                return;
            }
            
            const filtered = allCreators.filter(creator => {
                return creator.channelName.toLowerCase().includes(term) ||
                       creator.name.toLowerCase().includes(term) ||
                       (creator.description && creator.description.toLowerCase().includes(term));
            });
            
            displayCreators(filtered);
        });
    }
    
    loadCreators();
});

// ============================================
// OPEN CREATOR PROFILE
// ============================================

function openCreatorProfile(creatorId) {
    window.location.href = `creator-profile.html?id=${creatorId}`;
}

console.log('✅ Creators List Ready');