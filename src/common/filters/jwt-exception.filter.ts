import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { apiResponse } from '../helpers/response.helper';

@Catch(UnauthorizedException, JsonWebTokenError, TokenExpiredError)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(
    exception: UnauthorizedException | JsonWebTokenError | TokenExpiredError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Unauthorized access';
    const status = HttpStatus.UNAUTHORIZED;

    if (exception instanceof TokenExpiredError) {
      message = 'Token has expired';
    } else if (exception instanceof JsonWebTokenError) {
      message = 'Invalid token';
    } else if (exception instanceof UnauthorizedException) {
      message = exception.message || 'Unauthorized access';
    }

    response.status(status).json(apiResponse(null, message, status));
  }
}
