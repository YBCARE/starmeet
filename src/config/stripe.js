// ─── Stripe Configuration ─────────────────────────────────────────────────────
//
// 1. Copy .env.example → .env and paste your Stripe keys
// 2. Stripe Dashboard → Products → create "Pro Fan" ($9/mo) and "Celebrity" ($29/mo)
// 3. Create Payment Links for each product
// 4. Set each Payment Link success URL to:
//      https://starmeet.online/upgrade-success?plan=pro
//      https://starmeet.online/upgrade-success?plan=celebrity
// 5. Test card: 4242 4242 4242 4242 (test mode only)
//
// Vercel: add the same VITE_* vars in Project → Settings → Environment Variables

const PLACEHOLDER = /REPLACE|YOUR_|pk_test_REPLACE/i;

function env(key) {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

export const STRIPE_CONFIG = {
  publishableKey: env('VITE_STRIPE_PUBLISHABLE_KEY'),

  paymentLinks: {
    pro:       env('VITE_STRIPE_LINK_PRO'),
    celebrity: env('VITE_STRIPE_LINK_CELEBRITY'),
  },

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

export function isStripeConfigured(plan = 'pro') {
  const key = STRIPE_CONFIG.publishableKey;
  const link = STRIPE_CONFIG.paymentLinks[plan];
  return !!(key && !PLACEHOLDER.test(key) && link && !PLACEHOLDER.test(link));
}

/** Redirect to Stripe Payment Link. Returns false if not configured (caller can simulate upgrade). */
export function redirectToStripe(plan = 'pro') {
  const url = STRIPE_CONFIG.paymentLinks[plan];
  if (!isStripeConfigured(plan)) {
    console.warn('[Starmeet] Stripe not configured — add keys to .env or Vercel env vars.');
    return false;
  }
  const sep = url.includes('?') ? '&' : '?';
  window.location.href = `${url}${sep}client_reference_id=starmeet_${plan}`;
  return true;
}
