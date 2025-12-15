import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Role } from 'generated/prisma/enums';
import { CreateDoctorNestedDto } from 'src/doctors/dto/create-doctor-nested.dto';
import { CreatePatientDto } from 'src/patients/dto/create-patient.dto';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6)
  password: string;

  @IsString()
  @Length(2)
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDoctorNestedDto)
  doctor?: CreateDoctorNestedDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientDto)
  patient?: CreatePatientDto;
}
