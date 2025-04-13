import { Request } from 'express';
import { User } from '../entities/user.entity';

export interface IAuthenticatedRequest extends Request {
  user: User;
}
