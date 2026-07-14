import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@server/database';
import { CacheService } from '@server/cache';
export declare class HealthController {
    private health;
    private memory;
    private disk;
    private readonly prisma;
    private readonly cache;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, prisma: PrismaService, cache: CacheService);
    live(): {
        status: string;
        timestamp: string;
    };
    ready(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }> | undefined>>;
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & {
        redis: {
            status: "up" | "down";
        };
    } & {
        database: {
            status: "up";
        };
    }> | undefined>>;
}
