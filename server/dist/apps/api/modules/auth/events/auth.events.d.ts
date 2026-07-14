export declare const AuthEventHandlers: {
    "auth.login": (payload: any) => {
        entity: string;
        action: string;
        actorType: any;
        actorId: any;
    };
    "auth.logout": (payload: any) => {
        entity: string;
        action: string;
        actorType: string;
        actorId: null;
    };
    "auth.refresh": (payload: any) => {
        entity: string;
        action: string;
        actorType: string;
        actorId: any;
    };
};
