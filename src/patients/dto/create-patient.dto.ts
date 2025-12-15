import { IsDate, IsOptional } from 'class-validator';

export class CreatePatientDto {
  @IsOptional()
  @IsDate({
    message: 'birthDate date must be a valid date in format YYYY-MM-DD',
  })
  birthDate?: Date;
}
