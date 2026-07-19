import { NotificationsService } from './notifications.service';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    markRead(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
