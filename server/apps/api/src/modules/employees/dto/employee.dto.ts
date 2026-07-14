import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(3)
  login!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  fullName!: string;

  @IsUUID()
  roleId!: string;

  @IsUUID()
  @IsOptional()
  pharmacyId?: string;
}

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}
