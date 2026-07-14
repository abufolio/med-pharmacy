import { IsNumber, IsUUID, IsString, IsOptional, Min, IsPositive } from 'class-validator';

export class RequestWithdrawDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ReviewWithdrawDto {
  @IsString()
  status!: 'APPROVED' | 'REJECTED' | 'PAID';

  @IsString()
  @IsOptional()
  reason?: string;
}
