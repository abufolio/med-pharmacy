import { IsString, IsUUID } from 'class-validator';

export class AssignCardDto {
  @IsString()
  cardUid!: string;

  @IsUUID()
  userId!: string;
}

export class UnassignCardDto {
  @IsString()
  cardUid!: string;
}
