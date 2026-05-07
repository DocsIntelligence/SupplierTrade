import { ApiProperty } from '@nestjs/swagger';
import type { LoginDto as ILoginDto } from '@org/dto';

export class LoginDto implements ILoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email or username',
  })
  identifier!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 6 })
  password!: string;
}
