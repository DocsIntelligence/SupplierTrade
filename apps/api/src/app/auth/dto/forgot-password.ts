import { ApiProperty } from '@nestjs/swagger';
import type { ForgotPasswordDto as IForgotPassword } from '@org/dto';

export class ForgotPasswordDto implements IForgotPassword {
  @ApiProperty({ example: 'john@example.com', format: 'email' })
  email!: string;
}
