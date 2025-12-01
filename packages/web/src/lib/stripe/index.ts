import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Client-side Stripe promise
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Subscription plans
export const PLANS = {
  free: {
    name: 'Free',
    description: 'Basic features for casual players',
    features: [
      'Basic range charts',
      'Limited practice sessions',
      '5 hand analyses per day',
    ],
    price: {
      monthly: 0,
      yearly: 0,
    },
    priceId: {
      monthly: null,
      yearly: null,
    },
  },
  pro: {
    name: 'Pro',
    description: 'Advanced features for serious players',
    features: [
      'All range charts',
      'Unlimited practice',
      'Unlimited hand analyses',
      'Practice history',
      'Priority support',
    ],
    price: {
      monthly: 19.99,
      yearly: 199.99,
    },
    priceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
  },
  premium: {
    name: 'Premium',
    description: 'Full access for professional players',
    features: [
      'Everything in Pro',
      'Advanced GTO solver',
      'Custom range builder',
      'Multi-way analysis',
      'API access',
      'Team features',
    ],
    price: {
      monthly: 49.99,
      yearly: 499.99,
    },
    priceId: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
  },
};

export type PlanType = keyof typeof PLANS;
export type BillingInterval = 'monthly' | 'yearly';
