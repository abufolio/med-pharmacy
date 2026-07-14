export declare class CreateSettingDto {
    key: string;
    value: Record<string, unknown>;
    scope?: string;
}
export declare class UpdateSettingDto {
    value: Record<string, unknown>;
    scope?: string;
}
