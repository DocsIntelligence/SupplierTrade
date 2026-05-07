import { ApiProperty } from '@nestjs/swagger';
import type { RefreshDto as IRefreshDto } from '@org/dto';

export class RefreshDto implements IRefreshDto {
  @ApiProperty({
    required: false,
    description:
      'Optional when using cookie-based auth (refresh_token cookie is sent automatically)',
  })
  refreshToken?: string;
}
