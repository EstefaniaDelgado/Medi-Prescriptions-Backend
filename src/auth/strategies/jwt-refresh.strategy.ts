import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { User } from 'generated/prisma/client';
import { IRequest } from 'src/common/interfaces/request.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: IRequest): string | null => {
          const refreshToken = req?.cookies?.refreshToken;
          if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not received');
          }
          return refreshToken as string;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    try {
      const user = await this.userService.findByEmail(payload.email);
      return user;
    } catch (_error) {
      // Si el usuario no se encuentra, el refresh token es inválido
      throw new UnauthorizedException('User not found - refresh token invalid');
    }
  }
}
