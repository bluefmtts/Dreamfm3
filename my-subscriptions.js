// ============================================
// MY SUBSCRIPTIONS LOGIC
// ============================================

console.log('💳 My Subscriptions Loading...');

// ============================================
// LOAD USER SUBSCRIPTIONS
// ============================================

async function loadMySubscriptions() {
    const container = document.getElementById('subsContainer');

    if (!window.currentUser) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <h2>Login Required</h2>
                <p>Please login to view your subscriptions</p>
                <button onclick="window.location.href='login.html'" 
                        style="margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #ab47bc, #e91e63); border: none; color: white; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    Login Now
                </button>
            </div>
        `;
        return;
    }

    try {
        const subscriptions = await window.getMySubscriptions();

        if (subscriptions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h2>No Subscriptions Yet</h2>
                    <p>Subscribe to creators to access their audiobooks</p>
                    <button onclick="window.location.href='creators-list.html'" 
                            style="margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #ab47bc, #e91e63); border: none; color: white; border-radius: 25px; cursor: pointer; font-weight: 600;">
                        Browse Creators
                    </button>
                </div>
            `;
            return;
        }

        // Get creator details for each subscription
        let html = '';

        for (const sub of subscriptions) {
            const creator = await getCreatorDetails(sub.creatorId);
            html += createSubscriptionCard(sub, creator);
        }

        container.innerHTML = html;

    } catch (error) {
        console.error('❌ Load subscriptions error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h2>Error Loading Subscriptions</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// GET CREATOR DETAILS
// ============================================

async function getCreatorDetails(creatorId) {
    try {
        const doc = await db.collection('creators').doc(creatorId).get();
        
        if (doc.exists) {
            return { uid: doc.id, ...doc.data() };
        }
        
        return {
            channelName: 'Unknown Creator',
            profileImage: 'https://ui-avatars.com/api/?name=Creator&background=ab47bc&color=fff'
        };
        
    } catch (error) {
        console.error('Error getting creator:', error);
        return {
            channelName: 'Unknown Creator',
            profileImage: 'https://ui-avatars.com/api/?name=Creator&background=ab47bc&color=fff'
        };
    }
}

// ============================================
// CREATE SUBSCRIPTION CARD
// ============================================

function createSubscriptionCard(sub, creator) {
    const endDate = sub.endDate.toLocaleDateString();
    const daysLeft = Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24));
    const autoRenewText = sub.autoRenew ? 'Auto-renew ON' : 'Auto-renew OFF';

    return `
        <div class="sub-card">
            <div class="sub-header">
                <img src="${creator.profileImage}" alt="${creator.channelName}" class="sub-avatar">
                <div class="sub-info">
                    <div class="sub-creator-name">${creator.channelName}</div>
                    <div class="sub-status">
                        <i class="fa-solid fa-circle-check"></i> Active - ${daysLeft} days left
                    </div>
                </div>
            </div>

            <div class="sub-details">
                <div class="sub-detail-row">
                    <span class="sub-detail-label">Plan</span>
                    <span class="sub-detail-value">Monthly</span>
                </div>
                <div class="sub-detail-row">
                    <span class="sub-detail-label">Price</span>
                    <span class="sub-detail-value">₹${sub.amount}/month</span>
                </div>
                <div class="sub-detail-row">
                    <span class="sub-detail-label">Valid Until</span>
                    <span class="sub-detail-value">${endDate}</span>
                </div>
                <div class="sub-detail-row">
                    <span class="sub-detail-label">Status</span>
                    <span class="sub-detail-value" style="color: ${sub.autoRenew ? '#10b981' : '#f59e0b'}">
                        ${autoRenewText}
                    </span>
                </div>
            </div>

            <div class="sub-actions">
                <button class="sub-btn sub-btn-view" onclick="viewCreator('${sub.creatorId}')">
                    <i class="fa-solid fa-book"></i> View Audiobooks
                </button>
                <button class="sub-btn sub-btn-cancel" onclick="handleCancel('${sub.id}', '${creator.channelName}')">
                    <i class="fa-solid fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
}

// ============================================
// VIEW CREATOR
// ============================================

function viewCreator(creatorId) {
    window.location.href = `creator-profile.html?id=${creatorId}`;
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

function handleCancel(subId, creatorName) {
    if (window.cancelSubscription) {
        window.cancelSubscription(subId, creatorName);
    }
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth
    setTimeout(() => {
        loadMySubscriptions();
    }, 1000);
});

console.log('✅ My Subscriptions Ready');