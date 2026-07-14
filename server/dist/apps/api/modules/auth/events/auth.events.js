"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEventHandlers = void 0;
const events_1 = require("@server/events");
exports.AuthEventHandlers = {
    [events_1.Events.AUTH_LOGIN]: (payload) => ({
        entity: 'session',
        action: 'LOGIN',
        actorType: payload.actorType,
        actorId: payload.actorId,
    }),
    [events_1.Events.AUTH_LOGOUT]: (payload) => ({
        entity: 'session',
        action: 'LOGOUT',
        actorType: 'system',
        actorId: null,
    }),
    [events_1.Events.AUTH_REFRESH]: (payload) => ({
        entity: 'session',
        action: 'TOKEN_REFRESH',
        actorType: 'employee',
        actorId: payload.userId,
    }),
};
//# sourceMappingURL=auth.events.js.map