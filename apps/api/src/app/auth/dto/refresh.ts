import type { RefreshDto as IRefreshDto } from '@org/dto';

export class RefreshDto implements IRefreshDto {
  refreshToken!: string;
}
