"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromocodesModule = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const events_1 = require("@server/events");
const promocodes_controller_1 = require("./promocodes.controller");
const promocodes_service_1 = require("./promocodes.service");
const audit_helper_1 = require("../audit/audit.helper");
let PromocodesModule = class PromocodesModule {
};
exports.PromocodesModule = PromocodesModule;
exports.PromocodesModule = PromocodesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_1.DatabaseModule, events_1.EventBusModule],
        controllers: [promocodes_controller_1.PromocodesController],
        providers: [promocodes_service_1.PromocodesService, audit_helper_1.AuditHelper],
        exports: [promocodes_service_1.PromocodesService],
    })
], PromocodesModule);
//# sourceMappingURL=promocodes.module.js.map