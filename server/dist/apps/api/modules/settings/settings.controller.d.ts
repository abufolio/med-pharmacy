import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: SettingsService);
    create(dto: CreateSettingDto): Promise<any>;
    findAll(scope?: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByKey(key: string): Promise<any>;
    update(key: string, dto: UpdateSettingDto): Promise<any>;
    remove(key: string): Promise<{
        message: string;
    }>;
}
