import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreatePharmacyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsUUID()
  districtId!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(3)
  login!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdatePharmacyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdatePharmacyStatusDto {
  @IsString()
  status!: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export class ChangePharmacyPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
