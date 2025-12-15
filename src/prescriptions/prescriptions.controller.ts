import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  Req,
  Put,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FilterPrescriptionsDto } from './dto/filter-prescriptions.dto';
import { AdminFilterPrescriptionsDto } from './dto/admin-filter-prescriptions.dto';
import { AdminMetricsDto } from './dto/admin-metrics.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-decorator';
import { apiResponse } from '../common/helpers/response.helper';
import { Role } from 'generated/prisma/client';
import type { IRequest } from '../common/interfaces/request.interface';

@ApiTags('Prescripciones')
@ApiBearerAuth()
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(Role.doctor)
  @ApiOperation({ summary: 'Crear prescripción médica' })
  @ApiResponse({ status: 201, description: 'Prescripción creada exitosamente' })
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @Req() req: IRequest,
  ) {
    const prescription = await this.prescriptionsService.create(
      createPrescriptionDto,
      req.user,
    );
    return apiResponse(
      prescription,
      'Prescription created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @Roles(Role.admin, Role.doctor, Role.patient)
  @ApiOperation({ summary: 'Obtener prescripciones con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Prescripciones obtenidas exitosamente',
  })
  async findAll(
    @Query() filters: FilterPrescriptionsDto,
    @Req() req: IRequest,
  ) {
    const prescriptions = await this.prescriptionsService.findAll(
      filters,
      req.user,
    );
    return apiResponse(
      prescriptions,
      'Prescriptions retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  @Roles(Role.admin, Role.doctor, Role.patient)
  @ApiOperation({ summary: 'Obtener prescripción por ID' })
  @ApiResponse({
    status: 200,
    description: 'Prescripción obtenida exitosamente',
  })
  async findOne(@Param('id') id: string, @Req() req: IRequest) {
    const prescription = await this.prescriptionsService.findOne(id, req.user);
    return apiResponse(
      prescription,
      'Prescription retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(+id, updatePrescriptionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }

  @Get('me/prescriptions')
  @Roles(Role.patient)
  @ApiOperation({ summary: 'Obtener mis prescripciones (paciente)' })
  @ApiResponse({
    status: 200,
    description: 'Prescripciones del paciente obtenidas exitosamente',
  })
  async findMyPrescriptions(
    @Query() filters: FilterPrescriptionsDto,
    @Req() req: IRequest,
  ) {
    const prescriptions = await this.prescriptionsService.findMyPrescriptions(
      filters,
      req.user,
    );
    return apiResponse(
      prescriptions,
      'My prescriptions retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Put(':id/consume')
  @Roles(Role.patient)
  @ApiOperation({ summary: 'Marcar prescripción como consumida' })
  @ApiResponse({
    status: 200,
    description: 'Prescripción marcada como consumida',
  })
  async consumePrescription(@Param('id') id: string, @Req() req: IRequest) {
    const prescription = await this.prescriptionsService.consumePrescription(
      id,
      req.user,
    );
    return apiResponse(
      prescription,
      'Prescription consumed successfully',
      HttpStatus.OK,
    );
  }

  @Get(':id/pdf')
  @Roles(Role.patient)
  @ApiOperation({ summary: 'Descargar PDF de prescripción' })
  @ApiResponse({
    status: 200,
    description: 'PDF generado exitosamente',
    schema: { type: 'string', format: 'binary' },
  })
  async downloadPrescriptionPdf(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.prescriptionsService.generatePrescriptionPdf(
      id,
      req.user,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescription-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Get('admin/prescriptions')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Obtener todas las prescripciones (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Prescripciones obtenidas exitosamente',
  })
  async findAllForAdmin(@Query() filters: AdminFilterPrescriptionsDto) {
    const prescriptions =
      await this.prescriptionsService.findAllForAdmin(filters);
    return apiResponse(
      prescriptions,
      'Admin prescriptions retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Get('admin/metrics')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Obtener métricas del sistema (admin)' })
  @ApiResponse({ status: 200, description: 'Métricas obtenidas exitosamente' })
  async getMetrics(@Query() filters: AdminMetricsDto) {
    const metrics = await this.prescriptionsService.getMetrics(filters);
    return apiResponse(
      metrics,
      'Metrics retrieved successfully',
      HttpStatus.OK,
    );
  }
}
