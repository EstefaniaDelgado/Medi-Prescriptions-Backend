import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterPatientsDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Buscar por nombre o email del paciente',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Fecha de nacimiento desde (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDateFrom?: string;

  @ApiProperty({
    example: '2000-12-31',
    description: 'Fecha de nacimiento hasta (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDateTo?: string;

  @ApiProperty({
    example: 1,
    description: 'Número de página',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Elementos por página',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
