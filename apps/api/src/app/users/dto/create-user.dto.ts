import type { RegisterDto } from '@org/dto';

export class CreateUserDto implements RegisterDto {
  name!: string;
  email!: string;
  username!: string;
  password!: string;
  locale?: string;
}
