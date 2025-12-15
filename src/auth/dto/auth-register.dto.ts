import { OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export class AuthRegisterDto extends OmitType(CreateUserDto, [
  'role',
] as const) {}
