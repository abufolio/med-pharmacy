import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { getPharmacyId } from './tenant-context'; // eslint-disable-line

// ──────────────────────────────────────────────
// Model metadata (computed once at startup)
// ──────────────────────────────────────────────
interface ModelMeta {
  name: string;
  hasDeletedAt: boolean;
  hasPharmacyId: boolean;
}

function buildModelMeta(): ModelMeta[] {
  return Prisma.dmmf.datamodel.models.map((m) => ({
    name: m.name,
    hasDeletedAt: m.fields.some((f) => f.name === 'deletedAt'),
    hasPharmacyId: m.fields.some((f) => f.name === 'pharmacyId'),
  }));
}

// ──────────────────────────────────────────────
// Prisma Extensions Factory
// ──────────────────────────────────────────────
function createPrismaExtensions() {
  const models = buildModelMeta();

  const hasDeletedAt = (model: string) => models.find((m) => m.name === model)?.hasDeletedAt ?? false;
  const hasPharmacyId = (model: string) => models.find((m) => m.name === model)?.hasPharmacyId ?? false;

  return [
    // 1. SOFT-DELETE: auto-filter deletedAt=null, convert delete→update
    Prisma.defineExtension({
      name: 'soft-delete',
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            if (hasDeletedAt(model)) {
              args.where = Object.assign(args.where ?? {}, { deletedAt: null }) as any;
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (hasDeletedAt(model)) {
              args.where = Object.assign(args.where ?? {}, { deletedAt: null }) as any;
            }
            return query(args);
          },
          async findUnique({ model, args, query }) {
            if (hasDeletedAt(model)) {
              args.where = Object.assign(args.where ?? {}, { deletedAt: null }) as any;
            }
            return query(args);
          },
          async count({ model, args, query }) {
            if (hasDeletedAt(model)) {
              args.where = Object.assign(args.where ?? {}, { deletedAt: null }) as any;
            }
            return query(args);
          },
          async delete({ model, args, query }) {
            if (hasDeletedAt(model)) {
              return (this as any)[model].update({
                ...args,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            if (hasDeletedAt(model)) {
              return (this as any)[model].updateMany({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },
        },
      },
    }),

    // 2. MULTI-TENANT: auto-filter pharmacyId on all queries
    Prisma.defineExtension({
      name: 'multi-tenant',
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async findUnique({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async count({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async create({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid && !(args.data as any).pharmacyId) {
                (args.data as any).pharmacyId = pid;
              }
            }
            return query(args);
          },
          async createMany({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid && args.data) {
                const records = Array.isArray(args.data) ? args.data : [args.data];
                for (const record of records) {
                  if (!(record as any).pharmacyId) {
                    (record as any).pharmacyId = pid;
                  }
                }
              }
            }
            return query(args);
          },
          async update({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async updateMany({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async delete({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            if (hasPharmacyId(model)) {
              const pid = getPharmacyId();
              if (pid) {
                args.where = Object.assign(args.where ?? {}, { pharmacyId: pid }) as any;
              }
            }
            return query(args);
          },
        },
      },
    }),

    // 3. DECIMAL TRANSFORM: Decimal → number for JSON safety
    Prisma.defineExtension({
      name: 'decimal-transform',
      result: {
        $allModels: {
          $allFields: {
            compute(value: any) {
              if (typeof value === 'object' && value !== null && 'toNumber' in value) {
                return Number(value.toString());
              }
              return value;
            },
          },
        },
      },
    }),
  ] as const;
}

// ──────────────────────────────────────────────
// PrismaService
// ──────────────────────────────────────────────
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Extended Prisma client with:
   *  - Soft-delete (auto-filter deletedAt=null, delete→update)
   *  - Multi-tenant (auto-filter pharmacyId from request context)
   *  - Decimal transform (Decimal → number)
   *
   * Usage: this.prisma.client.user.findMany()
   */
  public readonly client: ReturnType<typeof createExtendedClient>;

  constructor() {
    this.client = createExtendedClient();
  }

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('✅ PostgreSQL connected via Prisma');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log('PostgreSQL disconnected');
  }
}

function createExtendedClient() {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

  const [softDelete, multiTenant, decimalTransform] = createPrismaExtensions();
  return base
    .$extends(softDelete)
    .$extends(multiTenant)
    .$extends(decimalTransform) as any;
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;
