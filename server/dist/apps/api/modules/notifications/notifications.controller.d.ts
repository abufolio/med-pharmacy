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
    }>;
    markRead(id: string): Promise<{
        message: string;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
