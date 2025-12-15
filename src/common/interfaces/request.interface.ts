import { Request } from 'express';
import { User } from '../../../generated/prisma/client';

export interface IRequest extends Request {
  user: User;
  accessToken?: string;
}
