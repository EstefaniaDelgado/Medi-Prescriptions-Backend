import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrescriptionItemDto {
  @ApiProperty({
    example: 'Amoxicilina 500mg',
    description: 'Nombre del medicamento',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '1 cápsula cada 8 horas',
    description: 'Dosis del medicamento',
    required: false,
  })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiProperty({
    example: 21,
    description: 'Cantidad de unidades',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    example: 'Tomar después de las comidas',
    description: 'Instrucciones de uso',
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}
