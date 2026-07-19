import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/guards/public.decorator';
import { PrismaService } from '@server/database';
import { CacheService } from '@server/cache';

@Controller('health')
export class HealthController {
  constructor(
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
   * Checks database and Redis.
   */
  @Get('ready')
  @Public()
  async ready() {
    const checks: Record<string, string> = {};

    // Database ping
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    // Redis ping
    try {
      const ping = await this.cache.ping();
      checks.redis = ping === 'PONG' ? 'up' : 'down';
    } catch {
      checks.redis = 'down';
    }

    const allUp = Object.values(checks).every(s => s === 'up');
    return {
      status: allUp ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Full health check
   */
  @Get()
  @Public()
  async check() {
    return this.ready();
  }
}
