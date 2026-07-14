import { IsString, IsNumber, IsUUID, Min, IsOptional, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  pharmacyId!: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  cardUid?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

export interface TransactionResult {
  transaction: {
    id: string;
    amount: number;
    status: string;
  };
  cashback: {
    id: string;
    amount: number;
    ruleType: string;
    ruleValue: number;
  } | null;
  wallet: {
    id: string;
    balance: number;
    previousBalance: number;
  };
}
