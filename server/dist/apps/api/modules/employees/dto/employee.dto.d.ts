export declare class CreateEmployeeDto {
    login: string;
    password: string;
    fullName: string;
    roleId: string;
    pharmacyId?: string;
}
export declare class UpdateEmployeeDto {
    fullName?: string;
    roleId?: string;
}
