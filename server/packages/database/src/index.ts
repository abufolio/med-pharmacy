export { DatabaseModule } from './database.module';
export { PrismaService } from './prisma.service';
export type { ExtendedPrismaClient } from './prisma.service';
export { Prisma } from '@prisma/client';

// Tenant context (module-level, no DI)
export { tenantStorage, getTenantContext, getPharmacyId } from './tenant-context';
export { TenantContextService } from './tenant-context.service';
