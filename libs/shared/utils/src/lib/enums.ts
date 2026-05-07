/**
 * Shared enums and constants.
 * These mirror the Prisma schema enums exactly.
 * Use these in frontend code; the API uses Prisma's generated types directly.
 */

// ─── User Roles ─────────────────────────────────────────────────
export const Role = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ─── Auth Providers ─────────────────────────────────────────────
export const Provider = {
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
} as const;
export type Provider = (typeof Provider)[keyof typeof Provider];

// ─── Payment Types ──────────────────────────────────────────────
export const PaymentType = {
  ONE_TIME: 'one_time',
  SUBSCRIPTION: 'subscription',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

// ─── Payment Status ─────────────────────────────────────────────
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ─── Payment Gateway ────────────────────────────────────────────
export const PaymentGateway = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
} as const;
export type PaymentGateway =
  (typeof PaymentGateway)[keyof typeof PaymentGateway];

// ─── Plan Interval ──────────────────────────────────────────────
export const PlanInterval = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;
export type PlanInterval = (typeof PlanInterval)[keyof typeof PlanInterval];

// ─── Feature Names (quota system) ───────────────────────────────
export const Feature = {
  DOCUMENTS: 'documents',
  AI_TOKENS: 'ai_tokens',
  AI_ATTEMPTS: 'ai_attempts',
  STORAGE_MB: 'storage_mb',
  API_CALLS: 'api_calls',
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];

// ─── Feature Action (on plan activation) ────────────────────────
export const FeatureAction = {
  RESET: 'reset',
  INCREMENT: 'increment',
} as const;
export type FeatureAction = (typeof FeatureAction)[keyof typeof FeatureAction];

// ─── Currency ───────────────────────────────────────────────────
export const Currency = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
  CAD: 'CAD',
  AUD: 'AUD',
  GBP: 'GBP',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
