import { IsString, IsOptional, IsDateString, IsNumberString } from 'class-validator';

export class ReportsQueryDto {
  @IsString()
  @IsOptional()
  pharmacyId?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
