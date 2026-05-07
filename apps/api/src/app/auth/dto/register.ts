import { ApiProperty } from '@nestjs/swagger';
import type { RegisterDto as IRegisterDto } from '@org/dto';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  name!: string;

  @ApiProperty({ example: 'john@example.com', format: 'email' })
  email!: string;

  @ApiProperty({
    example: 'johndoe',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  username!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 6, maxLength: 100 })
  password!: string;

  @ApiProperty({ example: 'en-US', required: false })
  locale?: string;
}
