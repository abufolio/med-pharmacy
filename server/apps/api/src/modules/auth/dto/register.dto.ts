import {
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class RegisterEmployeeDto {
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
