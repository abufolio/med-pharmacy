"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditListener = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("@server/events");
const audit_service_1 = require("./audit.service");
let AuditListener = AuditListener_1 = class AuditListener {
    eventBus;
    audit;
    logger = new common_1.Logger(AuditListener_1.name);
    constructor(eventBus, audit) {
        this.eventBus = eventBus;
        this.audit = audit;
    }
    onModuleInit() {
        this.eventBus.on$(events_1.Events.AUDIT_ACTION).subscribe({
            next: (event) => this.handleAuditEvent(event),
        });
        this.logger.log('🎧 Audit listener active');
    }
    async handleAuditEvent(event) {
        const { payload, metadata } = event;
        await this.audit.log({
            ...payload,
            actorType: payload.actorType || metadata.actorType || 'system',
            actorId: payload.actorId || metadata.actorId,
        });
    }
};
exports.AuditListener = AuditListener;
exports.AuditListener = AuditListener = AuditListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_1.EventBus,
        audit_service_1.AuditService])
], AuditListener);
//# sourceMappingURL=audit.listener.js.map