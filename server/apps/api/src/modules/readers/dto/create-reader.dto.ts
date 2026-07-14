import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateReaderDto {
  @IsString()
  @MaxLength(100)
  serialNumber!: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsUUID()
  @IsOptional()
  pharmacyId?: string;
}

export class PingReaderDto {
  @IsString()
  serialNumber!: string;
}
