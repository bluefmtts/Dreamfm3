// ============================================
// DREAMFM - PAYMENT INTEGRATION (RAZORPAY)
// ============================================

console.log('💰 Payment System Loading...');

// Razorpay Configuration
const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE'; // Replace with your key

// ============================================
// INITIATE RAZORPAY PAYMENT (FOR PRODUCTION)
// ============================================

function initiateRazorpayPayment(amount, description, onSuccess, onFailure) {
    if (!window.Razorpay) {
        console.error('❌ Razorpay not loaded');
        onFailure('Razorpay SDK not loaded');
        return;
    }

    const options = {
        key: RAZORPAY_KEY,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'DreamFM',
        description: description,
        image: '/icons/icon-192x192.png',
        handler: function(response) {
            console.log('✅ Payment successful:', response);
            onSuccess(response);
        },
        prefill: {
            email: window.currentUser?.email || '',
            contact: ''
        },
        theme: {
            color: '#ab47bc'
        }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function(response) {
        console.error('❌ Payment failed:', response.error);
        onFailure(response.error.description);
    });

    rzp.open();
}

// ============================================
// EXPORT
// ============================================

window.initiateRazorpayPayment = initiateRazorpayPayment;

console.log('✅ Payment System Ready'); 