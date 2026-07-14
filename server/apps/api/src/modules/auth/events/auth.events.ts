import { Events } from '@server/events';

// Reactive handler: log auth events to audit
export const AuthEventHandlers = {
  [Events.AUTH_LOGIN]: (payload: any) => ({
    entity: 'session',
    action: 'LOGIN',
    actorType: payload.actorType,
    actorId: payload.actorId,
  }),

  [Events.AUTH_LOGOUT]: (payload: any) => ({
    entity: 'session',
    action: 'LOGOUT',
    actorType: 'system',
    actorId: null,
  }),

  [Events.AUTH_REFRESH]: (payload: any) => ({
    entity: 'session',
    action: 'TOKEN_REFRESH',
    actorType: 'employee',
    actorId: payload.userId,
  }),
};
