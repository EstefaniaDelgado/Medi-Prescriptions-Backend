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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-decorator';
import { apiResponse } from '../common/helpers/response.helper';
import { Role } from 'generated/prisma/client';
import { OwnerOrAdminGuard } from 'src/common/guards/owner-or-admin.guard';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Crear usuario (admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return apiResponse(user, 'User created successfully', HttpStatus.CREATED);
  }

  @Get()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Obtener todos los usuarios (admin)' })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos exitosamente' })
  async findAll(@Query() filters: FilterUsersDto) {
    const users = await this.usersService.findAll(filters);
    return apiResponse(users, 'Users retrieved successfully', HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(OwnerOrAdminGuard)
  @Roles(Role.admin, Role.doctor, Role.patient)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido exitosamente' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return apiResponse(user, 'User retrieved successfully', HttpStatus.OK);
  }

  @Patch(':id')
  @UseGuards(OwnerOrAdminGuard)
  @Roles(Role.admin, Role.doctor, Role.patient)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return apiResponse(user, 'User updated successfully', HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(OwnerOrAdminGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete(id);
    return apiResponse(null, 'User deleted successfully', HttpStatus.OK);
  }
}
