import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}
