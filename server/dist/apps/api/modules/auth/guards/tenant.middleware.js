"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenant_context_1 = require("@server/database/tenant-context");
let TenantMiddleware = TenantMiddleware_1 = class TenantMiddleware {
    logger = new common_1.Logger(TenantMiddleware_1.name);
    use(req, _res, next) {
        const user = req.user;
        const pharmacyId = user?.pharmacyId;
        tenant_context_1.tenantStorage.run({
            pharmacyId,
            actorType: user?.scope?.toLowerCase(),
            actorId: user?.id,
        }, () => {
            if (pharmacyId) {
                this.logger.debug(`🔐 Tenant: pharmacy=${pharmacyId} user=${user?.id}`);
            }
            next();
        });
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = TenantMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map