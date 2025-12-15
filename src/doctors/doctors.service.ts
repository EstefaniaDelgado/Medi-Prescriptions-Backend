import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { FilterDoctorsDto } from './dto/filter-doctors.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Doctor } from 'generated/prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  createPaginatedResponse,
  validatePagination,
} from 'src/common/helpers/pagination.helper';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDoctorDto: CreateDoctorDto,
    tx?: Prisma.TransactionClient,
  ) {
    try {
      const client = tx || this.prisma;
      await client.doctor.create({
        data: {
          specialty: createDoctorDto.specialty,
          user: {
            connect: {
              id: createDoctorDto.userId,
            },
          },
        },
      });
    } catch (_error: unknown) {
      const error = _error as Error;
      throw new InternalServerErrorException(
        `Failed to create doctor: ${error.message}`,
      );
    }
  }

  async findAll(
    filters?: FilterDoctorsDto,
  ): Promise<
    PaginatedResponse<
      Doctor & { user: { id: string; name: string; email: string } }
    >
  > {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

     
      const whereConditions: Prisma.DoctorWhereInput = {
        user: {
          deletedAt: null, 
        },
      };

      if (filters?.specialty) {
        whereConditions.specialty = {
          contains: filters.specialty,
          mode: 'insensitive',
        };
      }

      
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
          {
            specialty: {
              contains: filters.query,
              mode: 'insensitive',
            },
          },
        ];
      }

      const total = await this.prisma.doctor.count({
        where: whereConditions,
      });

      
      validatePagination(page, limit, total);

      const doctors = await this.prisma.doctor.findMany({
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

      return createPaginatedResponse(doctors, total, page, limit);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error('findAll doctors failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} doctor`;
  }

  update(id: number, _updateDoctorDto: UpdateDoctorDto) {
    return `This action updates a #${id} doctor`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctor`;
  }
}
