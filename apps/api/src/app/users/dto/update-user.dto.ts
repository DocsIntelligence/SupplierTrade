import type { UpdateUserDto as TUpdateUser } from '@org/dto';

export class UpdateUserDto implements TUpdateUser {
  name?: string;
  username?: string;
  locale?: string;
  picture?: string | null;
}
