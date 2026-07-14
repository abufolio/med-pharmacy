export declare class CreatePharmacyDto {
    name: string;
    districtId: string;
    address?: string;
    phone: string;
    login: string;
    password: string;
}
export declare class UpdatePharmacyDto {
    name?: string;
    districtId?: string;
    address?: string;
    phone?: string;
}
export declare class UpdatePharmacyStatusDto {
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}
export declare class ChangePharmacyPasswordDto {
    newPassword: string;
}
