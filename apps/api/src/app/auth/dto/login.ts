import { loginSchema, type LoginDto as ILoginDto } from '@org/dto';
import { createZodDto } from 'nestjs-zod';

export class LoginDto extends createZodDto(loginSchema) implements ILoginDto {}
