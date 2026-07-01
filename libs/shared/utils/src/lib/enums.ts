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

// ═══════════════════════════════════════════════════════════════════
// SUPPLIERTRADE — multi-vertical domain platform
// Mirror of the String fields in the SupplierTrade Prisma models.
// See docs/PLANNING.md §7 and docs/DOMAIN-ARCHITECTURE.md.
// ═══════════════════════════════════════════════════════════════════

// ─── Domain lifecycle ───────────────────────────────────────────
export const DomainStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;
export type DomainStatus = (typeof DomainStatus)[keyof typeof DomainStatus];

// ─── Workflow subject types ─────────────────────────────────────
export const WorkflowSubject = {
  SUPPLIER: 'supplier',
  LISTING: 'listing',
} as const;
export type WorkflowSubject =
  (typeof WorkflowSubject)[keyof typeof WorkflowSubject];

// ─── Per-signal verification status (graded — never binary) ─────
export const SignalStatus = {
  PASS: 'pass',
  FLAG: 'flag',
  NA: 'na',
} as const;
export type SignalStatus = (typeof SignalStatus)[keyof typeof SignalStatus];

// ─── Aggregate verification report status (graded) ──────────────
export const VerificationStatus = {
  VERIFIED: 'verified',
  FLAGGED: 'flagged',
  INSUFFICIENT: 'insufficient',
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

// ─── QC job status ──────────────────────────────────────────────
export const QcJobStatus = {
  PENDING: 'pending',
  SCORED: 'scored',
  FAILED: 'failed',
} as const;
export type QcJobStatus = (typeof QcJobStatus)[keyof typeof QcJobStatus];

// ─── Supplier document status ───────────────────────────────────
export const SupplierDocumentStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;
export type SupplierDocumentStatus =
  (typeof SupplierDocumentStatus)[keyof typeof SupplierDocumentStatus];

// ─── Media asset type ───────────────────────────────────────────
export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

// ─── RFQ lifecycle ─────────────────────────────────────────────
export const RfqStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  MATCHED: 'matched',
  SAMPLING: 'sampling',
  AWARDED: 'awarded',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;
export type RfqStatus = (typeof RfqStatus)[keyof typeof RfqStatus];

// ─── RFQ response status ───────────────────────────────────────
export const RfqResponseStatus = {
  SUGGESTED: 'suggested',
  SHORTLISTED: 'shortlisted',
  QUOTED: 'quoted',
  REJECTED: 'rejected',
  AWARDED: 'awarded',
} as const;
export type RfqResponseStatus =
  (typeof RfqResponseStatus)[keyof typeof RfqResponseStatus];

// ─── Buyer validation signals ──────────────────────────────────
export const BuyerValidationSignalType = {
  VERIFICATION_FEE_INTEREST: 'verification_fee_interest',
  QC_FEE_INTEREST: 'qc_fee_interest',
  PILOT_COMMITMENT: 'pilot_commitment',
  REJECTED_PRICE: 'rejected_price',
} as const;
export type BuyerValidationSignalType =
  (typeof BuyerValidationSignalType)[keyof typeof BuyerValidationSignalType];
