import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { IRequest } from 'src/common/interfaces/request.interface';

/**
 * This guard is used to check if the user is the owner of the resource or an admin.
 * @param request The request object
 * @param targetUserId The id of the user to check
 * @returns True if the user is the owner of the resource or an admin, false otherwise
 */
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: IRequest = context.switchToHttp().getRequest();
    const user = request.user;

    const userId = request.body?.userId || request.params.id;
    const isAdmin = user.role === Role.admin;

    if (!isAdmin) {
      if (userId && String(userId) !== String(user.id)) {
        throw new ForbiddenException(
          'Access denied: You can only update your own profile',
        );
      }
      return true;
    }

    return true;
  }
}
