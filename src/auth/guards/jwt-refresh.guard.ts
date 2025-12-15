import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'generated/prisma/client';

interface JwtErrorInfo {
  name?: string;
  message?: string;
}

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = User>(
    err: Error | null,
    user: TUser | null,
    info: JwtErrorInfo | undefined,
    _context: ExecutionContext,
    _status?: number,
  ): TUser {
    // Si hay un error o no hay usuario
    if (err || !user) {
      // Verificar el tipo de error específico
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      } else if (info?.message) {
        throw new UnauthorizedException(info.message);
      } else {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }
    }

    return user;
  }
}
