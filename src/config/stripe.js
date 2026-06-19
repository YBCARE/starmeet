// ─── Stripe Configuration ─────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
// 1. Go to https://dashboard.stripe.com → Products → Create product
// 2. Create two products: "Pro Fan" ($9/mo) and "Celebrity" ($29/mo)
// 3. For each product, create a Payment Link (Payments → Payment Links)
// 4. Set success URL to: https://YOUR-DOMAIN.com/upgrade-success?plan=pro
// 5. Paste the Payment Link URLs below
//
// For testing: use Stripe test mode and test card 4242 4242 4242 4242

export const STRIPE_CONFIG = {
  // Your Stripe publishable key (starts with pk_live_ or pk_test_)
  publishableKey: 'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY',

  // Payment Link URLs from your Stripe dashboard
  // Go to: https://dashboard.stripe.com/payment-links
  paymentLinks: {
    pro:       'https://buy.stripe.com/REPLACE_WITH_PRO_PAYMENT_LINK',
    celebrity: 'https://buy.stripe.com/REPLACE_WITH_CELEBRITY_PAYMENT_LINK',
  },

  // Where Stripe redirects after successful payment (lazy — safe for build)
  get successUrl() {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/upgrade-success`
      : '/upgrade-success';
  },
  get cancelUrl() {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/messages`
      : '/messages';
  },

  plans: {
    pro: {
      name:     'Pro Fan',
      price:    '$9',
      interval: '/month',
      color:    '#3b82f6',
      features: [
        'Unlimited direct messages',
        'Priority replies from celebrities',
        'Pro badge on your profile',
        'Exclusive celebrity content',
        'Early access to new features',
      ],
    },
    celebrity: {
      name:     'Celebrity',
      price:    '$29',
      interval: '/month',
      color:    '#f59e0b',
      features: [
        'Everything in Pro',
        'Verified celebrity badge',
        'Your own fan inbox',
        'Analytics dashboard',
        'Featured in Explore',
      ],
    },
  },
};

// Helper: redirect to Stripe Payment Link for a given plan
export function redirectToStripe(plan = 'pro') {
  const url = STRIPE_CONFIG.paymentLinks[plan];
  if (!url || url.includes('REPLACE')) {
    // Fallback for unconfigured keys: simulate upgrade
    console.warn('[Starmeet] Stripe not configured. Simulating upgrade for development.');
    return false; // caller should handle this
  }
  window.location.href = url;
  return true;
}
