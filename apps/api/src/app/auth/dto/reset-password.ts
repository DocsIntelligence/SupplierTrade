import type { ResetPasswordDto as IResetPassword } from '@org/dto';

export class ResetPasswordDto implements IResetPassword {
  token!: string;
  password!: string;
}
