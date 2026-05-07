import type { User, UserRole, UserWithSecrets } from '@org/dto';

export class UserEntity implements UserWithSecrets {
  id!: string;
  name!: string;
  email!: string;
  username!: string;
  picture!: string | null;
  role: UserRole = 'user';
  emailVerified = false;
  locale = 'en-US';
  password!: string | null;
  resetToken: string | null = null;
  verificationToken: string | null = null;
  createdAt!: string;
  updatedAt!: string;

  toPublic(): User {
    const {
      password: _p,
      resetToken: _r,
      verificationToken: _v,
      ...publicProps
    } = this;
    return publicProps;
  }
}
