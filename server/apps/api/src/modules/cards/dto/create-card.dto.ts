import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @MaxLength(32)
  uid!: string;
}

export class UpdateCardStatusDto {
  @IsString()
  status!: 'BLOCKED' | 'ACTIVE';
}
