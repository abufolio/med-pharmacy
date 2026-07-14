import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsEnum(['PERCENT', 'FIXED'] as const)
  type!: 'PERCENT' | 'FIXED';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  value!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimit?: number;

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validTo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePromoCodeDto {
  @IsEnum(['PERCENT', 'FIXED'] as const)
  @IsOptional()
  type?: 'PERCENT' | 'FIXED';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Max(99999999.99)
  value?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimit?: number;

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validTo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class RedeemPromoCodeDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseAmount!: number;
}
