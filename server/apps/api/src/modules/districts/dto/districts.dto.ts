import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @IsUUID()
  regionId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class UpdateDistrictDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  regionId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsOptional()
  name?: string;
}
