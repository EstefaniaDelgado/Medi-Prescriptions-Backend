import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local.guard';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { Roles } from '../common/decorators/roles-decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { apiResponse } from 'src/common/helpers/response.helper';
import type { Response } from 'express';
import type { IRequest } from 'src/common/interfaces/request.interface';
import { AuthCookiesHelper } from 'src/common/helpers/auth-cookies.helper';
import { Role } from 'generated/prisma/client';
import { AuthRegisterDto } from './dto/auth-register.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  private readonly oneHour = 60 * 60 * 1000;
  private readonly oneDay = 24 * 60 * 60 * 1000;
  private accessCookieMaxAge =
    Number(process.env.ACCESS_COOKIE_AGE) || this.oneHour;
  private refreshCookieMaxAge =
    Number(process.env.REFRESH_COOKIE_AGE) || this.oneDay;

  constructor(
    private readonly authService: AuthService,
    private readonly authCookieHelper: AuthCookiesHelper,
  ) {}

  @Post('register/patient')
  @ApiOperation({ summary: 'Registrar paciente' })
  @ApiResponse({ status: 201, description: 'Paciente registrado exitosamente' })
  async registerPatient(
    @Body() registerUserDto: AuthRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.registerUser(registerUserDto, Role.patient);

    this.authCookieHelper.setCookies(
      res,
      accessToken,
      this.accessCookieMaxAge,
      refreshToken,
      this.refreshCookieMaxAge,
    );

    return apiResponse(
      user,
      'User registered successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('register/doctor')
  @ApiOperation({ summary: 'Registrar doctor' })
  @ApiResponse({ status: 201, description: 'Doctor registrado exitosamente' })
  async registerDoctor(
    @Body() registerUserDto: AuthRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.registerUser(registerUserDto, Role.doctor);

    this.authCookieHelper.setCookies(
      res,
      accessToken,
      this.accessCookieMaxAge,
      refreshToken,
      this.refreshCookieMaxAge,
    );

    return apiResponse(
      user,
      'User registered successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @UseGuards(LocalAuthGuard)
  login(@Request() req: IRequest, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = this.authService.login(req.user);

    this.authCookieHelper.setCookies(
      res,
      accessToken,
      this.accessCookieMaxAge,
      refreshToken,
      this.refreshCookieMaxAge,
    );

    return apiResponse(null, 'Successful login', 200);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token' })
  @ApiResponse({ status: 201, description: 'Token refrescado exitosamente' })
  @UseGuards(JwtRefreshAuthGuard)
  refreshToken(
    @Req() req: IRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = this.authService.refreshToken(req);

    this.authCookieHelper.setCookie(
      res,
      'accessToken',
      accessToken,
      this.accessCookieMaxAge,
    );

    return apiResponse(null, 'Refresh token successful', 201);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.authCookieHelper.clearCookies(res);
    return apiResponse(null, 'User logged out successfully', 200);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.patient, Role.doctor)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  async getMe(@Req() req: IRequest) {
    const user = await this.authService.getMe(req);

    return apiResponse(user, 'User data retrieved successfully', 200);
  }
}
