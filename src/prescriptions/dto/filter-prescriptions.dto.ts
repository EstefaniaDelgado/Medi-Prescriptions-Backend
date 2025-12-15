import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PrescriptionStatus } from 'generated/prisma/enums';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FilterPrescriptionsDto {
  @ApiProperty({
    example: true,
    description: 'Filtrar solo mis prescripciones',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mine?: boolean;

  @ApiProperty({
    enum: PrescriptionStatus,
    description: 'Estado de la prescripción',
    required: false,
  })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Fecha de inicio (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecha de fin (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  to?: string;

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

  @ApiProperty({
    enum: SortOrder,
    description: 'Orden de clasificación',
    required: false,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
