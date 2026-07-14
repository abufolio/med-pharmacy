import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Database
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { CacheModule } from '@server/cache';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { PharmaciesModule } from './modules/pharmacies/pharmacies.module';
import { CardsModule } from './modules/cards/cards.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CashbacksModule } from './modules/cashbacks/cashbacks.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReadersModule } from './modules/readers/readers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { PromocodesModule } from './modules/promocodes/promocodes.module';
import { FilesModule } from './modules/files/files.module';
import { ReportsModule } from './modules/reports/reports.module';

// Global guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantInterceptor } from './modules/auth/guards/tenant.interceptor';

// Global filters & interceptors
import { AllExceptionsFilter } from '@server/common';
import { ResponseInterceptor } from '@server/common';

@Module({
  imports: [
    // ── Global ──
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
    ]),

    // ── Infrastructure ──
    DatabaseModule,
    EventBusModule,
    CacheModule,
    PrometheusModule.register({
      path: '/api/v1/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),

    // ── Feature Modules ──
    HealthModule,
    AuthModule,
    AuditModule,
    UsersModule,
    PharmaciesModule,
    CardsModule,
    EmployeesModule,
    TransactionsModule,
    CashbacksModule,
    WalletsModule,
    NotificationsModule,
    ReadersModule,
    SettingsModule,
    ReferralsModule,
    PromocodesModule,
    FilesModule,
    ReportsModule,
  ],
  providers: [
    // Global guard — JWT auth (skip with @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global tenant interceptor (runs after guards)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
