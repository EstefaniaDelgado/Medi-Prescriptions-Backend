import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';
import { CreateDoctorNestedDto } from 'src/doctors/dto/create-doctor-nested.dto';
import { CreatePatientDto } from 'src/patients/dto/create-patient.dto';

export class CreateUserDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @Length(6)
  password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @Length(2)
  name: string;

  @ApiProperty({ enum: Role, description: 'Rol del usuario' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ required: false, description: 'Datos adicionales del doctor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDoctorNestedDto)
  doctor?: CreateDoctorNestedDto;

  @ApiProperty({
    required: false,
    description: 'Datos adicionales del paciente',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientDto)
  patient?: CreatePatientDto;
}
