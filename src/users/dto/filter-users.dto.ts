import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Enum específico para filtros (solo doctor y patient)
export enum FilterableRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export class FilterUsersDto {
  @IsOptional()
  @IsEnum(FilterableRole, {
    message: 'Role must be either doctor or patient',
  })
  role?: FilterableRole;

  @IsOptional()
  @IsString()
  query?: string;

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
