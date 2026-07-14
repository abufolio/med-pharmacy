import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  key!: string;

  @IsObject()
  value!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  scope?: string;
}

export class UpdateSettingDto {
  @IsObject()
  value!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  scope?: string;
}
