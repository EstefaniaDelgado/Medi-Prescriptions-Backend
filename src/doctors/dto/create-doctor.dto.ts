import { IsOptional, IsString, Length } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  @Length(2)
  specialty?: string;
}
