import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { tenantStorage, TenantContext } from './tenant-context';

/**
 * TenantContextService — wraps module-level AsyncLocalStorage for DI.
 *
 * Usage in guards/middleware:
 *   this.tenantContext.run({ pharmacyId: '...' }, () => next());
 *
 * PrismaService's $extends reads context directly from tenantStorage
 * without DI, avoiding circular dependencies.
 */
@Injectable()
export class TenantContextService {
  run<T>(context: TenantContext, fn: () => T): T {
    return tenantStorage.run(context, fn);
  }

  get(): TenantContext {
    return tenantStorage.getStore() || {};
  }

  getPharmacyId(): string | undefined {
    return this.get().pharmacyId;
  }
}
