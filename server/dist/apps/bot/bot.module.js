"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@server/database");
const queue_1 = require("@server/queue");
const events_1 = require("@server/events");
const cache_1 = require("@server/cache");
const bot_service_1 = require("./bot.service");
const bot_update_1 = require("./bot.update");
let BotModule = class BotModule {
};
exports.BotModule = BotModule;
exports.BotModule = BotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            database_1.DatabaseModule,
            queue_1.QueueModule,
            events_1.EventBusModule,
            cache_1.CacheModule,
        ],
        providers: [bot_service_1.BotService, bot_update_1.BotUpdate],
    })
], BotModule);
//# sourceMappingURL=bot.module.js.map