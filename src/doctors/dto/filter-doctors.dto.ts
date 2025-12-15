import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterDoctorsDto {
  @IsOptional()
  @IsString()
  query?: string; // Para buscar por nombre, email o especialidad

  @IsOptional()
  @IsString()
  specialty?: string; // Filtrar por especialidad específica

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
