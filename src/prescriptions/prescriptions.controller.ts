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

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(Role.doctor)
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
  async getMetrics(@Query() filters: AdminMetricsDto) {
    const metrics = await this.prescriptionsService.getMetrics(filters);
    return apiResponse(
      metrics,
      'Metrics retrieved successfully',
      HttpStatus.OK,
    );
  }
}
