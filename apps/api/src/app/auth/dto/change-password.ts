import { ApiProperty } from '@nestjs/swagger';
import type { ChangePasswordDto as IChangePassword } from '@org/dto';

export class ChangePasswordDto implements IChangePassword {
  @ApiProperty({
    example: 'OldP@ssw0rd!',
    description: 'Current password for verification',
  })
  currentPassword!: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', minLength: 6 })
  newPassword!: string;
}
