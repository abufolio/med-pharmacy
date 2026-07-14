import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/guards/public.decorator';
import { PrismaService } from '@server/database';
import { CacheService } from '@server/cache';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Liveness probe — is the process alive?
   * Used by Docker/K8s to know if the container should be restarted.
   */
  @Get('live')
  @Public()
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness probe — can the app handle requests?
   * Checks database, Redis, and memory.
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  ready() {
    return this.health.check([
      // Database ping
      async () => {
        await this.prisma.client.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      // Redis ping
      async () => {
        const ping = await this.cache.ping();
        return { redis: { status: ping === 'PONG' ? 'up' : 'down' } };
      },
      // Memory (200MB heap threshold)
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      // Disk (80% threshold)
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.8,
        path: '/',
      }),
    ]);
  }

  /**
   * Full health check (legacy path + combined view)
   */
  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => {
        await this.prisma.client.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      async () => {
        const ping = await this.cache.ping();
        return { redis: { status: ping === 'PONG' ? 'up' : 'down' } };
      },
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.8,
        path: '/',
      }),
    ]);
  }
}
