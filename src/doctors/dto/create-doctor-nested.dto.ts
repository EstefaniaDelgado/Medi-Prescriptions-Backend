import { OmitType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-doctor.dto';

export class CreateDoctorNestedDto extends OmitType(CreateDoctorDto, [
  'userId',
] as const) {}
