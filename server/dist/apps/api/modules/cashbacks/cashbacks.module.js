"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbacksModule = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const cashbacks_controller_1 = require("./cashbacks.controller");
const cashbacks_service_1 = require("./cashbacks.service");
const audit_helper_1 = require("../audit/audit.helper");
const events_1 = require("@server/events");
let CashbacksModule = class CashbacksModule {
};
exports.CashbacksModule = CashbacksModule;
exports.CashbacksModule = CashbacksModule = __decorate([
    (0, common_1.Module)({
        imports: [database_1.DatabaseModule, events_1.EventBusModule],
        controllers: [cashbacks_controller_1.CashbacksController],
        providers: [cashbacks_service_1.CashbacksService, audit_helper_1.AuditHelper],
        exports: [cashbacks_service_1.CashbacksService],
    })
], CashbacksModule);
//# sourceMappingURL=cashbacks.module.js.map