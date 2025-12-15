import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IRequest } from 'src/common/interfaces/request.interface';
import { assertValidExpires } from 'src/common/utils/assertValidExpires';
import { Role, User } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async registerUser(registerUserDto: AuthRegisterDto, role: Role) {
    try {
      const userDto: CreateUserDto = {
        ...registerUserDto,
        role,
      };

      const createdUser = await this.userService.create(userDto);
      const tokens = this.generateTokens(createdUser);

      return { ...tokens, user: createdUser };
    } catch (error: unknown) {
      if (error instanceof ConflictException) throw error;

      this.logger.error('registerUser failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  login(user: User) {
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<Partial<User>> {
    try {
      const userFound = await this.userService.findByEmail(email);
      const isMatch = await bcrypt.compare(password, userFound.password);

      if (!userFound || !isMatch) {
        throw new UnauthorizedException('User credentials invalid');
      }

      const { password: _p, ...userData } = userFound;

      return userData as Partial<User>;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('validateUser failed', error as Error);
      throw new InternalServerErrorException();
    }
  }

  refreshToken(req: IRequest) {
    const user = req.user;
    try {
      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error: unknown) {
      this.logger.error('refreshToken failed', error as Error);
      throw new BadRequestException('Could not refresh token');
    }
  }

  async getMe(req: IRequest) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userFound = await this.userService.findOne(user.id);
    return { user: userFound };
  }

  private generateTokens(user: Omit<User, 'password'>): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(user: Omit<User, 'password'>): string {
    try {
      const payload: JwtPayload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      const token: string = this.jwtService.sign(payload);

      return token;
    } catch (error: unknown) {
      this.logger.error('generateAccessToken failed', error as Error);
      throw new BadRequestException('Could not generate access token');
    }
  }

  private generateRefreshToken(user: Omit<User, 'password'>) {
    try {
      const payload: JwtPayload = {
        email: user.email,
        role: user.role,
        sub: user.id,
      };

      const expiresIn = process.env.JWT_REFRESH_TTL ?? '1d';
      assertValidExpires(expiresIn);

      const refreshToken: string = this.jwtService.sign(payload, {
        expiresIn,
        secret: process.env.JWT_REFRESH_SECRET,
      });

      return refreshToken;
    } catch (error: unknown) {
      this.logger.error('generateRefreshToken failed', error as Error);
      throw new BadRequestException('Could not generate refresh token');
    }
  }
}
