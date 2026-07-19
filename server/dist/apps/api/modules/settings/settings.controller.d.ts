import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: SettingsService);
    create(dto: CreateSettingDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(scope?: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findByKey(key: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(key: string, dto: UpdateSettingDto): Promise<{
        success: boolean;
        data: any;
    }>;
    remove(key: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
