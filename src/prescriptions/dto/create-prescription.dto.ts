import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class CreatePrescriptionDto {
  @ApiProperty({
    example: 'cmj5yszlm0001k0v1kwfwgqjd',
    description: 'ID del paciente',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    example: 'Tomar con abundante agua',
    description: 'Notas adicionales del médico',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreatePrescriptionItemDto],
    description: 'Lista de medicamentos prescritos',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one prescription item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
