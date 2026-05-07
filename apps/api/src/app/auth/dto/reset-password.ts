import { ApiProperty } from '@nestjs/swagger';
import type { ResetPasswordDto as IResetPassword } from '@org/dto';

export class ResetPasswordDto implements IResetPassword {
  @ApiProperty({
    example: 'a1b2c3d4-uuid-token',
    description: 'Token from reset email',
  })
  token!: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', minLength: 6 })
  password!: string;
}
