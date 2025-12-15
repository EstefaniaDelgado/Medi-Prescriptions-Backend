import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FilterPrescriptionsDto } from './dto/filter-prescriptions.dto';
import { AdminFilterPrescriptionsDto } from './dto/admin-filter-prescriptions.dto';
import { AdminMetricsDto } from './dto/admin-metrics.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  Prescription,
  Role,
  User,
  PrescriptionStatus,
} from 'generated/prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  createPaginatedResponse,
  validatePagination,
} from 'src/common/helpers/pagination.helper';
import { generatePrescriptionCode } from '../common/utils/prescription-code.util';
import PDFDocument from 'pdfkit';
import { EmailService } from 'src/email/email.service';
import { render } from '@react-email/components';
import ConfirmPrescription from 'src/email/templates/ConfirmPrescription';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
    authorUser: User,
  ): Promise<Prescription> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Obtener el perfil de doctor del usuario
        const doctor = await tx.doctor.findUnique({
          where: { userId: authorUser.id },
        });

        if (!doctor) {
          throw new BadRequestException('Doctor profile not found');
        }

        // Verificar que el paciente existe, no está eliminado y tiene rol de paciente
        const patient = await tx.patient.findFirst({
          where: {
            id: createPrescriptionDto.patientId,
            deletedAt: null,
            user: {
              deletedAt: null,
              role: Role.patient,
            },
          },
          include: {
            user: true,
          },
        });

        if (!patient) {
          throw new NotFoundException('Patient not found');
        }

        // Generar código único para la prescripción
        const code = await generatePrescriptionCode(tx);

        // Crear la prescripción con sus items
        const prescription = await tx.prescription.create({
          data: {
            code,
            notes: createPrescriptionDto.notes,
            patientId: createPrescriptionDto.patientId,
            authorId: doctor.id,
            items: {
              create: createPrescriptionDto.items.map((item) => ({
                name: item.name,
                dosage: item.dosage,
                quantity: item.quantity,
                instructions: item.instructions,
              })),
            },
          },
          include: {
            items: true,
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            author: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        // Enviar correo electrónico al paciente
        // const emailTemplate = await render(
        //   ConfirmPrescription({
        //     prescriptionCode: prescription.code,
        //     patientName: patient.user.name,
        //     doctorName: prescription.author.user.name,
        //     doctorSpecialty: doctor.specialty,
        //     medications: prescription.items.map((item) => ({
        //       name: item.name,
        //       dosage: item.dosage!,
        //       quantity: item.quantity!,
        //       instructions: item.instructions!,
        //     })),
        //     notes: prescription.notes,
        //     createdAt: prescription.createdAt.toLocaleDateString('es-ES'),
        //   }),
        // );

        /* await this.emailService.sendMail({
          to: patient.user.email,
          subject: `Nueva Prescripción Médica - ${prescription.code}`,
          html: emailTemplate,
        }); */

        return prescription;
      });
    } catch (error: unknown) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('create prescription failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(
    filters: FilterPrescriptionsDto,
    user: User,
  ): Promise<PaginatedResponse<Prescription>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Construir condiciones de filtro
      const whereConditions: Prisma.PrescriptionWhereInput = {
        deletedAt: null,
      };

      if (filters.mine) {
        if (user.role === Role.doctor) {
          // Si es doctor, obtener su perfil de doctor y filtrar por authorId
          const doctor = await this.prisma.doctor.findUnique({
            where: { userId: user.id },
          });
          if (doctor) {
            whereConditions.authorId = doctor.id;
          }
        } else if (user.role === Role.patient) {
          // Si es paciente, obtener su perfil de paciente y filtrar por patientId
          const patient = await this.prisma.patient.findUnique({
            where: { userId: user.id },
          });
          if (patient) {
            whereConditions.patientId = patient.id;
          }
        }
      } else {
        // Si no es "mine", aplicar restricciones por rol
        if (user.role === Role.patient) {
          // Los pacientes solo pueden ver sus propias prescripciones
          const patient = await this.prisma.patient.findUnique({
            where: { userId: user.id },
          });
          if (patient) {
            whereConditions.patientId = patient.id;
          }
        }
        // Los doctores y admins pueden ver cualquier prescripción
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      // Filtro por rango de fechas
      if (filters.from || filters.to) {
        const dateFilter: Prisma.DateTimeFilter = {};

        if (filters.from) {
          dateFilter.gte = new Date(filters.from);
        }

        if (filters.to) {
          dateFilter.lte = new Date(filters.to);
        }

        whereConditions.createdAt = dateFilter;
      }

      // Obtener total de registros para paginación
      const total = await this.prisma.prescription.count({
        where: whereConditions,
      });

      // Validar que la página solicitada esté dentro del rango válido
      validatePagination(page, limit, total);

      // Obtener prescripciones con paginación
      const prescriptions = await this.prisma.prescription.findMany({
        where: whereConditions,
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: filters.order || 'desc',
        },
      });

      return createPaginatedResponse(prescriptions, total, page, limit);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('findAll prescriptions failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string, user: User): Promise<Prescription> {
    try {
      const whereConditions: Prisma.PrescriptionWhereInput = {
        id,
        deletedAt: null,
      };

      // Aplicar restricciones por rol
      if (user.role === Role.patient) {
        // Los pacientes solo pueden ver sus propias prescripciones
        const patient = await this.prisma.patient.findUnique({
          where: { userId: user.id },
        });
        if (patient) {
          whereConditions.patientId = patient.id;
        }
      }
      // Los doctores y admins pueden ver cualquier prescripción

      const prescription = await this.prisma.prescription.findFirst({
        where: whereConditions,
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      return prescription;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('findOne prescription failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  update(id: number, _updatePrescriptionDto: UpdatePrescriptionDto) {
    return `This action updates a #${id} prescription`;
  }

  async remove(id: string): Promise<void> {
    try {
      const prescription = await this.prisma.prescription.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      await this.prisma.prescription.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('remove prescription failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findMyPrescriptions(
    filters: FilterPrescriptionsDto,
    user: User,
  ): Promise<PaginatedResponse<Prescription>> {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const whereConditions: Prisma.PrescriptionWhereInput = {
        patientId: patient.id,
        deletedAt: null,
      };

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      const total = await this.prisma.prescription.count({
        where: whereConditions,
      });

      validatePagination(page, limit, total);

      const prescriptions = await this.prisma.prescription.findMany({
        where: whereConditions,
        include: {
          items: true,
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return createPaginatedResponse(prescriptions, total, page, limit);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('findMyPrescriptions failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async consumePrescription(id: string, user: User): Promise<Prescription> {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }

      const prescription = await this.prisma.prescription.findFirst({
        where: {
          id,
          patientId: patient.id,
          deletedAt: null,
        },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      return await this.prisma.prescription.update({
        where: { id },
        data: {
          status: PrescriptionStatus.consumed,
        },
        include: {
          items: true,
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('consumePrescription failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async generatePrescriptionPdf(id: string, user: User): Promise<Buffer> {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }

      const prescription = await this.prisma.prescription.findFirst({
        where: {
          id,
          patientId: patient.id,
          deletedAt: null,
        },
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20).text('PRESCRIPCIÓN MÉDICA', { align: 'center' });
        doc.moveDown();

        // Información básica
        doc
          .fontSize(12)
          .text(`Código: ${prescription.code}`)
          .text(`Paciente: ${prescription.patient.user.name}`)
          .text(`Doctor: ${prescription.author.user.name}`)
          .text(`Fecha: ${prescription.createdAt.toLocaleDateString()}`)
          .text(`Estado: ${prescription.status}`);

        doc.moveDown();

        // Medicamentos
        doc.fontSize(14).text('Medicamentos:', { underline: true });
        doc.moveDown(0.5);

        prescription.items.forEach((item, index) => {
          doc
            .fontSize(12)
            .text(`${index + 1}. ${item.name}`)
            .text(`   Dosis: ${item.dosage}`)
            .text(`   Cantidad: ${item.quantity}`)
            .text(`   Instrucciones: ${item.instructions}`);
          doc.moveDown(0.5);
        });

        // Notas
        if (prescription.notes) {
          doc
            .moveDown()
            .fontSize(14)
            .text('Notas:', { underline: true })
            .fontSize(12)
            .text(prescription.notes);
        }

        doc.end();
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('generatePrescriptionPdf failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findAllForAdmin(
    filters: AdminFilterPrescriptionsDto,
  ): Promise<PaginatedResponse<Prescription>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const whereConditions: Prisma.PrescriptionWhereInput = {
        deletedAt: null,
      };

      if (filters.status) {
        whereConditions.status = filters.status as PrescriptionStatus;
      }

      if (filters.doctorId) {
        whereConditions.authorId = filters.doctorId;
      }

      if (filters.patientId) {
        whereConditions.patientId = filters.patientId;
      }

      if (filters.from || filters.to) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (filters.from) dateFilter.gte = new Date(filters.from);
        if (filters.to) dateFilter.lte = new Date(filters.to);
        whereConditions.createdAt = dateFilter;
      }

      const total = await this.prisma.prescription.count({
        where: whereConditions,
      });
      validatePagination(page, limit, total);

      const prescriptions = await this.prisma.prescription.findMany({
        where: whereConditions,
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          author: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return createPaginatedResponse(prescriptions, total, page, limit);
    } catch (error: unknown) {
      this.logger.error('findAllForAdmin failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async getMetrics(filters: AdminMetricsDto) {
    try {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.from) dateFilter.gte = new Date(filters.from);
      if (filters.to) dateFilter.lte = new Date(filters.to);

      const prescriptionWhere =
        dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};

      const [
        doctorsCount,
        patientsCount,
        prescriptionsCount,
        statusCounts,
        dailyCounts,
        topDoctors,
      ] = await Promise.all([
        this.prisma.doctor.count({ where: { deletedAt: null } }),
        this.prisma.patient.count({ where: { deletedAt: null } }),
        this.prisma.prescription.count({
          where: { deletedAt: null, ...prescriptionWhere },
        }),
        this.prisma.prescription.groupBy({
          by: ['status'],
          where: { deletedAt: null, ...prescriptionWhere },
          _count: { status: true },
        }),
        this.prisma.prescription.groupBy({
          by: ['createdAt'],
          where: { deletedAt: null, ...prescriptionWhere },
          _count: { createdAt: true },
        }),
        this.prisma.prescription.groupBy({
          by: ['authorId'],
          where: { deletedAt: null, ...prescriptionWhere },
          _count: { authorId: true },
          orderBy: { _count: { authorId: 'desc' } },
          take: 5,
        }),
      ]);

      const byStatus = statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>,
      );

      const byDay = dailyCounts.reduce(
        (acc, item) => {
          const date = item.createdAt.toISOString().split('T')[0];
          const existing = acc.find((d) => d.date === date);
          if (existing) {
            existing.count += item._count.createdAt;
          } else {
            acc.push({ date, count: item._count.createdAt });
          }
          return acc;
        },
        [] as { date: string; count: number }[],
      );

      const topDoctorsData = topDoctors.map((item) => ({
        doctorId: item.authorId,
        count: item._count.authorId,
      }));

      return {
        totals: {
          doctors: doctorsCount,
          patients: patientsCount,
          prescriptions: prescriptionsCount,
        },
        byStatus,
        byDay,
        topDoctors: topDoctorsData,
      };
    } catch (error: unknown) {
      this.logger.error('getMetrics failed', error as Error);
      throw new InternalServerErrorException();
    }
  }
}
