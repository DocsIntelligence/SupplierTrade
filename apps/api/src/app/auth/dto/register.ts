import type { RegisterDto as IRegisterDto } from '@org/dto';

export class RegisterDto implements IRegisterDto {
  name!: string;
  email!: string;
  username!: string;
  password!: string;
  locale?: string;
}
