import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Role, User } from 'generated/prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  createPaginatedResponse,
  validatePagination,
} from 'src/common/helpers/pagination.helper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({
          where: {
            email: createUserDto.email,
            deletedAt: null,
          },
        });

        if (existingUser) {
          throw new ConflictException(
            `User with email ${createUserDto.email} already exists`,
          );
        }

        const { email, password, name, role, doctor, patient } = createUserDto;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            deletedAt: true,
          },
        });

        if (doctor && patient)
          throw new BadRequestException(
            'Doctor and patient cannot be created at the same time',
          );

        if (Role.doctor && doctor) {
          await tx.doctor.create({
            data: {
              ...doctor,
              userId: user.id,
            },
          });
        }

        if (Role.patient && patient) {
          await tx.patient.create({
            data: {
              ...patient,
              userId: user.id,
            },
          });
        }
        return user;
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof BadRequestException) throw error;

      this.logger.error('create user failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(
    filters?: FilterUsersDto,
  ): Promise<PaginatedResponse<Partial<User>>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      // Construir condiciones de filtro
      const whereConditions: Prisma.UserWhereInput = {
        deletedAt: null,
      };

      // Filtro por rol (convertir FilterableRole a Role)
      if (filters?.role) {
        whereConditions.role = filters.role as Role;
      }

      // Filtro por query (buscar en nombre o email)
      if (filters?.query) {
        whereConditions.OR = [
          {
            name: {
              contains: filters.query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: filters.query,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Obtener total de registros para paginación
      const total = await this.prisma.user.count({
        where: whereConditions,
      });

      // Validar que la página solicitada esté dentro del rango válido
      validatePagination(page, limit, total);

      // Obtener usuarios con paginación
      const users = await this.prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              specialty: true,
            },
          },
          patient: {
            select: {
              id: true,
              birthDate: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return createPaginatedResponse(users, total, page, limit);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error('findAll users failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string, includePassword = false): Promise<Partial<User>> {
    const select = {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    };

    if (includePassword) select['password'] = true;

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select,
      });

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      return user;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error('findOne user failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          deletedAt: null, // Excluir usuarios eliminados
        },
      });

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      return user;
    } catch (error: unknown) {
      this.logger.error('findByEmail failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({
          where: {
            id: userId,
            deletedAt: null,
          },
          include: {
            doctor: true,
            patient: true,
          },
        });

        if (!existingUser) {
          throw new NotFoundException(`User not found`);
        }

        const { email, password, doctor, patient, ...basicUserData } =
          updateUserDto;

        if (doctor && patient) {
          throw new BadRequestException(
            'Doctor and patient cannot be updated at the same time',
          );
        }

        if (email) await this.ckeckUniqueEmail(email, tx, userId);

        const updateData: Prisma.UserUpdateInput = { ...basicUserData };

        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        //Actualizar o crear doctor si viene en el DTO
        if (doctor) {
          if (existingUser.doctor) {
            updateData.doctor = {
              update: { ...doctor },
            };
          } else {
            updateData.doctor = {
              create: { ...doctor },
            };
          }
        }

        // Actualizar o crear paciente si viene en el DTO
        if (patient) {
          if (existingUser.patient) {
            updateData.patient = {
              update: { ...patient },
            };
          } else {
            updateData.patient = {
              create: { ...patient },
            };
          }
        }

        return tx.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            doctor: true,
            patient: true,
          },
        });
      });
    } catch (error: unknown) {
      if ((error as Prisma.PrismaClientKnownRequestError)?.code === 'P2002') {
        throw new ConflictException(`User with email already exists`);
      }

      this.logger.error('update user failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingUser) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }

        await tx.user.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      });
    } catch (error: unknown) {
      this.logger.error('remove user failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  private async ckeckUniqueEmail(
    email: string,
    tx: Prisma.TransactionClient,
    userId?: string,
  ) {
    const emailExists = await tx.user.findFirst({
      where: {
        email,
        id: { not: userId },
        deletedAt: null,
      },
    });

    if (emailExists) {
      throw new ConflictException(`User with email ${email} already exists`);
    }
  }
}
