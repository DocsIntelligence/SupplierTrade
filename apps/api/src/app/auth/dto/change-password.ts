import type { ChangePasswordDto as IChangePassword } from '@org/dto';

export class ChangePasswordDto implements IChangePassword {
  currentPassword!: string;
  newPassword!: string;
}
