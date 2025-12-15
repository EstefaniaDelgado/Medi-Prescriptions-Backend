import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Enum específico para filtros (solo doctor y patient)
export enum FilterableRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export class FilterUsersDto {
  @ApiProperty({
    enum: FilterableRole,
    description: 'Filtrar por rol de usuario',
    required: false,
  })
  @IsOptional()
  @IsEnum(FilterableRole, {
    message: 'Role must be either doctor or patient',
  })
  role?: FilterableRole;

  @ApiProperty({
    example: 'Juan',
    description: 'Buscar por nombre o email',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

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
