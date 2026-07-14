"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const database_1 = require("@server/database");
const events_1 = require("@server/events");
const cache_1 = require("@server/cache");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const auth_module_1 = require("./modules/auth/auth.module");
const health_module_1 = require("./modules/health/health.module");
const audit_module_1 = require("./modules/audit/audit.module");
const users_module_1 = require("./modules/users/users.module");
const pharmacies_module_1 = require("./modules/pharmacies/pharmacies.module");
const cards_module_1 = require("./modules/cards/cards.module");
const employees_module_1 = require("./modules/employees/employees.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const cashbacks_module_1 = require("./modules/cashbacks/cashbacks.module");
const wallets_module_1 = require("./modules/wallets/wallets.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const readers_module_1 = require("./modules/readers/readers.module");
const settings_module_1 = require("./modules/settings/settings.module");
const referrals_module_1 = require("./modules/referrals/referrals.module");
const promocodes_module_1 = require("./modules/promocodes/promocodes.module");
const files_module_1 = require("./modules/files/files.module");
const reports_module_1 = require("./modules/reports/reports.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const tenant_interceptor_1 = require("./modules/auth/guards/tenant.interceptor");
const common_2 = require("@server/common");
const common_3 = require("@server/common");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'default', ttl: 60000, limit: 100 },
            ]),
            database_1.DatabaseModule,
            events_1.EventBusModule,
            cache_1.CacheModule,
            nestjs_prometheus_1.PrometheusModule.register({
                path: '/api/v1/metrics',
                defaultMetrics: {
                    enabled: true,
                },
            }),
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            users_module_1.UsersModule,
            pharmacies_module_1.PharmaciesModule,
            cards_module_1.CardsModule,
            employees_module_1.EmployeesModule,
            transactions_module_1.TransactionsModule,
            cashbacks_module_1.CashbacksModule,
            wallets_module_1.WalletsModule,
            notifications_module_1.NotificationsModule,
            readers_module_1.ReadersModule,
            settings_module_1.SettingsModule,
            referrals_module_1.ReferralsModule,
            promocodes_module_1.PromocodesModule,
            files_module_1.FilesModule,
            reports_module_1.ReportsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: tenant_interceptor_1.TenantInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: common_2.AllExceptionsFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: common_3.ResponseInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map