import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashbackRuleDto {
  @IsString()
  @IsEnum(['PERCENT', 'FIXED', 'CAMPAIGN'])
  type!: 'PERCENT' | 'FIXED' | 'CAMPAIGN';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPurchase?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  maxCashback?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validTo?: string;
}

export class UpdateCashbackRuleDto {
  @IsString()
  @IsEnum(['PERCENT', 'FIXED', 'CAMPAIGN'])
  @IsOptional()
  type?: 'PERCENT' | 'FIXED' | 'CAMPAIGN';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPurchase?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  maxCashback?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validTo?: string;
}
