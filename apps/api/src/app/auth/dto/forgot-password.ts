import type { ForgotPasswordDto as IForgotPassword } from '@org/dto';

export class ForgotPasswordDto implements IForgotPassword {
  email!: string;
}
