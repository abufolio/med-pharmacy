import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  pharmacyId?: string;
  actorType?: string;
  actorId?: string;
}

/**
 * Module-level AsyncLocalStorage for per-request tenant context.
 *
 * Imported directly by Prisma extensions (no circular DI).
 * Set by TenantMiddleware on every authenticated request.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  return tenantStorage.getStore() || {};
}

export function getPharmacyId(): string | undefined {
  return getTenantContext().pharmacyId;
}
