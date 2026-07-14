import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '@server/database';

/**
 * TenantInterceptor — wraps each request in an AsyncLocalStorage context
 * so that PrismaService's multi-tenant extension can auto-filter by pharmacyId.
 *
 * Runs AFTER JwtAuthGuard so req.user is guaranteed to be populated.
 * The tenant context lives as long as the request processing chain
 * (controller → service → Prisma → response).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const tenantContext = {
      pharmacyId: user?.pharmacyId,
      actorType: user?.scope?.toLowerCase(),
      actorId: user?.id,
    };

    // Wrap entire request pipeline in tenant context
    return new Observable((subscriber) => {
      tenantStorage.run(tenantContext, () => {
        if (tenantContext.pharmacyId) {
          this.logger.debug(`🔐 Tenant: pharmacy=${tenantContext.pharmacyId}`);
        }
        // Subscribe to the handler observable inside the tenant context
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
