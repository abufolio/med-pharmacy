import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  phone!: string;

  @IsString()
  @IsOptional()
  telegramId?: number;

  @IsString()
  @IsOptional()
  language?: string;
}

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  language?: string;
}
