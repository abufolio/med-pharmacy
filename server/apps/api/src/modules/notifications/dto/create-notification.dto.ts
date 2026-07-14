import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  type!: string;

  @IsString()
  message!: string;
}
