import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code!: string;
}

export class UpdateRegionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @IsOptional()
  code?: string;
}
