import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateReferralDto {
  @IsUUID()
  referredId!: string;
}

export class UpdateReferralDto {
  @IsString()
  @IsOptional()
  status?: 'PENDING' | 'COMPLETED';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  bonusAmount?: number;
}
