import { IsString, IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

export class AccrueCashbackDto {
  @IsString()
  @IsUUID()
  transactionId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  overrideAmount?: number;
}
