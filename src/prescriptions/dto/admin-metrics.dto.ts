import { IsOptional, IsDateString } from 'class-validator';

export class AdminMetricsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}