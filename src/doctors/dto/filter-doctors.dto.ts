import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterDoctorsDto {
  @ApiProperty({ example: 'Juan', description: 'Buscar por nombre, email o especialidad', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ example: 'Cardiología', description: 'Filtrar por especialidad específica', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: 1, description: 'Número de página', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Elementos por página', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
