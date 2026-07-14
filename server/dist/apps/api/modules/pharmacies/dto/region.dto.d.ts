export declare class CreateRegionDto {
    name: string;
    code: string;
}
export declare class CreateDistrictDto {
    regionId: string;
    name: string;
}
export declare class UpdateRegionDto {
    name?: string;
    code?: string;
}
export declare class UpdateDistrictDto {
    name?: string;
}
