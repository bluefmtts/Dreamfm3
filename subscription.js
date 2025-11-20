// ============================================
// DREAMFM - SUBSCRIPTION MANAGEMENT
// ============================================

console.log('💳 Subscription System Loading...');

// ============================================
// CHECK IF USER HAS SUBSCRIPTION TO CREATOR
// ============================================

async function hasActiveSubscription(creatorId) {
    if (!window.currentUser) {
        return false;
    }

    try {
        const snapshot = await db.collection('subscriptions')
            .where('userId', '==', window.currentUser.uid)
            .where('creatorId', '==', creatorId)
            .where('status', '==', 'active')
            .get();

        if (snapshot.empty) {
            return false;
        }

        // Check if subscription is actually active (not expired)
        let hasActive = false;
        snapshot.forEach(doc => {
            const sub = doc.data();
            const endDate = sub.endDate.toDate();
            const now = new Date();

            if (now < endDate) {
                hasActive = true;
            }
        });

        return hasActive;

    } catch (error) {
        console.error('❌ Subscription check error:', error);
        return false;
    }
}

// ============================================
// GET USER'S ALL ACTIVE SUBSCRIPTIONS
// ============================================

async function getMySubscriptions() {
    if (!window.currentUser) {
        return [];
    }

    try {
        const snapshot = await db.collection('subscriptions')
            .where('userId', '==', window.currentUser.uid)
            .where('status', '==', 'active')
            .get();

        const subscriptions = [];
        snapshot.forEach(doc => {
            const sub = doc.data();
            const endDate = sub.endDate.toDate();
            const now = new Date();

            // Only include if not expired
            if (now < endDate) {
                subscriptions.push({
                    id: doc.id,
                    ...sub,
                    endDate: endDate
                });
            } else {
                // Mark as expired
                db.collection('subscriptions').doc(doc.id).update({
                    status: 'expired'
                });
            }
        });

        return subscriptions;

    } catch (error) {
        console.error('❌ Get subscriptions error:', error);
        return [];
    }
}

// ============================================
// SUBSCRIBE TO CREATOR
// ============================================

async function subscribeToCreator(creatorId, creatorName) {
    if (!window.currentUser) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    // Check if already subscribed
    const alreadySubscribed = await hasActiveSubscription(creatorId);
    if (alreadySubscribed) {
        alert(`You already have an active subscription to ${creatorName}!`);
        return;
    }

    // Confirm subscription
    const confirm = window.confirm(
        `Subscribe to ${creatorName}?\n\n` +
        `Price: ₹29/month\n` +
        `You'll get access to all their audiobooks!`
    );

    if (!confirm) return;

    try {
        // Start payment process
        await initiateSubscriptionPayment(creatorId, creatorName);

    } catch (error) {
        console.error('❌ Subscribe error:', error);
        alert('Subscription failed: ' + error.message);
    }
}

// ============================================
// INITIATE PAYMENT (FAKE FOR TESTING)
// ============================================

async function initiateSubscriptionPayment(creatorId, creatorName) {
    try {
        console.log('💳 Starting payment for:', creatorName);

        // FAKE PAYMENT (for testing)
        // In production, integrate Razorpay here

        const confirmPay = window.confirm(
            `💳 FAKE PAYMENT (Testing Mode)\n\n` +
            `Amount: ₹29\n` +
            `Creator: ${creatorName}\n\n` +
            `Click OK to simulate successful payment`
        );

        if (!confirmPay) return;

        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create subscription
        await createSubscription(creatorId, creatorName, {
            paymentId: 'fake_pay_' + Date.now(),
            orderId: 'fake_order_' + Date.now()
        });

        alert(`🎉 Subscription successful!\n\nYou now have access to all ${creatorName} audiobooks!`);

        // Reload page
        window.location.reload();

    } catch (error) {
        console.error('❌ Payment error:', error);
        throw error;
    }
}

// ============================================
// CREATE SUBSCRIPTION RECORD
// ============================================

async function createSubscription(creatorId, creatorName, paymentDetails) {
    try {
        const userId = window.currentUser.uid;

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days

        const subscriptionData = {
            userId: userId,
            userEmail: window.currentUser.email,
            creatorId: creatorId,
            creatorName: creatorName,

            amount: 29,
            ownerShare: 9,    // Website owner gets ₹9
            creatorShare: 20, // Creator gets ₹20

            startDate: firebase.firestore.Timestamp.fromDate(startDate),
            endDate: firebase.firestore.Timestamp.fromDate(endDate),

            status: 'active',
            autoRenew: true,

            paymentId: paymentDetails.paymentId,
            orderId: paymentDetails.orderId,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add subscription
        await db.collection('subscriptions').add(subscriptionData);

        // Create transaction record
        await db.collection('transactions').add({
            userId: userId,
            creatorId: creatorId,
            type: 'subscription',
            totalAmount: 29,
            ownerShare: 9,
            creatorShare: 20,
            paymentId: paymentDetails.paymentId,
            status: 'success',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update creator subscriber count
        await db.collection('creators').doc(creatorId).update({
            totalSubscribers: firebase.firestore.FieldValue.increment(1),
            totalRevenue: firebase.firestore.FieldValue.increment(20)
        });

        console.log('✅ Subscription created successfully');

    } catch (error) {
        console.error('❌ Create subscription error:', error);
        throw error;
    }
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

async function cancelSubscription(subscriptionId, creatorName) {
    const confirm = window.confirm(
        `Cancel subscription to ${creatorName}?\n\n` +
        `Your subscription will remain active until the end date.`
    );

    if (!confirm) return;

    try {
        await db.collection('subscriptions').doc(subscriptionId).update({
            autoRenew: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('✅ Subscription will not auto-renew');
        window.location.reload();

    } catch (error) {
        console.error('❌ Cancel error:', error);
        alert('Failed to cancel: ' + error.message);
    }
}

// ============================================
// EXPORT TO WINDOW
// ============================================

window.hasActiveSubscription = hasActiveSubscription;
window.getMySubscriptions = getMySubscriptions;
window.subscribeToCreator = subscribeToCreator;
window.cancelSubscription = cancelSubscription;

console.log('✅ Subscription System Ready (FAKE Payment Mode)'); 