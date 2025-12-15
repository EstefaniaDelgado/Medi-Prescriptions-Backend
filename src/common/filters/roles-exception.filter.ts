import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { apiResponse } from '../helpers/response.helper';

@Catch(ForbiddenException)
export class RolesExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message =
      exception.message || 'Access denied: Insufficient permissions';
    const status = HttpStatus.FORBIDDEN;

    response.status(status).json(apiResponse(null, message, status));
  }
}
