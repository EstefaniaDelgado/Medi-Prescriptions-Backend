import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FilterPatientsDto } from './dto/filter-patients.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Patient } from 'generated/prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  createPaginatedResponse,
  validatePagination,
} from 'src/common/helpers/pagination.helper';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(_createPatientDto: CreatePatientDto) {
    return 'This action adds a new patient';
  }

  async findAll(
    filters?: FilterPatientsDto,
  ): Promise<
    PaginatedResponse<
      Patient & { user: { id: string; name: string; email: string } }
    >
  > {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      // Construir condiciones de filtro
      const whereConditions: Prisma.PatientWhereInput = {
        user: {
          deletedAt: null,
        },
      };

      // Filtro por query (buscar en nombre o email del usuario)
      if (filters?.query) {
        whereConditions.OR = [
          {
            user: {
              name: {
                contains: filters.query,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              email: {
                contains: filters.query,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      // Filtro por rango de fecha de nacimiento
      if (filters?.birthDateFrom || filters?.birthDateTo) {
        const birthDateFilter: Prisma.DateTimeFilter = {};

        if (filters.birthDateFrom) {
          birthDateFilter.gte = new Date(filters.birthDateFrom);
        }

        if (filters.birthDateTo) {
          birthDateFilter.lte = new Date(filters.birthDateTo);
        }

        whereConditions.birthDate = birthDateFilter;
      }

      // Obtener total de registros para paginación
      const total = await this.prisma.patient.count({
        where: whereConditions,
      });

      // Validar que la página solicitada esté dentro del rango válido
      validatePagination(page, limit, total);

      // Obtener pacientes con paginación
      const patients = await this.prisma.patient.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      });

      return createPaginatedResponse(patients, total, page, limit);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error('findAll patients failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} patient`;
  }

  update(id: number, _updatePatientDto: UpdatePatientDto) {
    return `This action updates a #${id} patient`;
  }

  remove(id: number) {
    return `This action removes a #${id} patient`;
  }
}
