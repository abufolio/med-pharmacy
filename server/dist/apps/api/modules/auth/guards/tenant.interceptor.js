"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const database_1 = require("@server/database");
let TenantInterceptor = TenantInterceptor_1 = class TenantInterceptor {
    logger = new common_1.Logger(TenantInterceptor_1.name);
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const tenantContext = {
            pharmacyId: user?.pharmacyId,
            actorType: user?.scope?.toLowerCase(),
            actorId: user?.id,
        };
        return new rxjs_1.Observable((subscriber) => {
            database_1.tenantStorage.run(tenantContext, () => {
                if (tenantContext.pharmacyId) {
                    this.logger.debug(`🔐 Tenant: pharmacy=${tenantContext.pharmacyId}`);
                }
                next.handle().subscribe({
                    next: (value) => subscriber.next(value),
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            });
        });
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = TenantInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map