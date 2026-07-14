"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@server/database");
const events_1 = require("@server/events");
const cache_1 = require("@server/cache");
const queue_1 = require("@server/queue");
const audit_processor_1 = require("./processors/audit.processor");
const notification_processor_1 = require("./processors/notification.processor");
const cashback_processor_1 = require("./processors/cashback.processor");
const telegram_processor_1 = require("./processors/telegram.processor");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            database_1.DatabaseModule,
            events_1.EventBusModule,
            cache_1.CacheModule,
            queue_1.QueueModule,
        ],
        providers: [
            audit_processor_1.AuditProcessor,
            notification_processor_1.NotificationProcessor,
            cashback_processor_1.CashbackProcessor,
            telegram_processor_1.TelegramProcessor,
        ],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map