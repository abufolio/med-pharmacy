export { EventBus, AppEvent } from './event-bus.service';
export { EventBusModule } from './event-bus.module';

// ──────────────────────────────────────────────
// Standard Event Constants
// ──────────────────────────────────────────────
export const Events = {
  // ── Auth ──
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REFRESH: 'auth.refresh',

  // ── Users ──
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_BLOCKED: 'user.blocked',

  // ── Cards ──
  CARD_ASSIGNED: 'card.assigned',
  CARD_UNASSIGNED: 'card.unassigned',
  CARD_BLOCKED: 'card.blocked',

  // ── Transactions ──
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_COMPLETED: 'transaction.completed',
  TRANSACTION_REVERSED: 'transaction.reversed',

  // ── Cashbacks ──
  CASHBACK_ACCRUED: 'cashback.accrued',
  CASHBACK_EXPIRED: 'cashback.expired',
  CASHBACK_ROLLED_BACK: 'cashback.rolled_back',

  // ── Wallets ──
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  WITHDRAW_REQUESTED: 'withdraw.requested',
  WITHDRAW_APPROVED: 'withdraw.approved',

  // ── Pharmacies ──
  PHARMACY_CREATED: 'pharmacy.created',
  PHARMACY_UPDATED: 'pharmacy.updated',
  PHARMACY_STATUS_CHANGED: 'pharmacy.status_changed',

  // ── Employees ──
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_SUSPENDED: 'employee.suspended',

  // ── Notifications ──
  NOTIFICATION_SEND: 'notification.send',

  // ── Referrals ──
  REFERRAL_CREATED: 'referral.created',
  REFERRAL_COMPLETED: 'referral.completed',

  // ── Audit ──
  AUDIT_ACTION: 'audit.action',
} as const;
