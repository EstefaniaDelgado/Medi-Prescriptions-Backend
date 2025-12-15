import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'generated/prisma/client';

interface JwtErrorInfo {
  name?: string;
  message?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(
    err: Error | null,
    user: TUser | null,
    info: JwtErrorInfo | undefined,
    _context: ExecutionContext,
    _status?: number,
  ): TUser { 
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      } else if (info?.message) {
        throw new UnauthorizedException(info.message);
      } else {
        throw new UnauthorizedException('Unauthorized access');
      }
    }

    return user;
  }
}
