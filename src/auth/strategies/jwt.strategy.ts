import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { IRequest } from 'src/common/interfaces/request.interface';
import { User } from 'generated/prisma/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: IRequest): string | null => {
          const accessToken = req.cookies?.accessToken;
          if (!accessToken) {
            throw new UnauthorizedException('Access token not received');
          }
          return accessToken as string;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userService.findByEmail(payload.email);
    return user;
  }
}
