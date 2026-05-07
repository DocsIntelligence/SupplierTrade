import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { RegisterDto, User } from '@org/dto';
import { ErrorMessage } from '@org/utils';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(payload: RegisterDto): Promise<User> {
    const existing = await this.db.user.findFirst({
      where: { OR: [{ email: payload.email }, { username: payload.username }] },
    });
    if (existing) {
      throw new ConflictException(
        existing.email === payload.email
          ? 'Email already in use'
          : 'Username already taken',
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await this.db.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        username: payload.username,
        provider: 'email',
        locale: payload.locale ?? 'en-US',
        secrets: {
          create: {
            password: hashedPassword,
          },
        },
      },
      include: { secrets: true },
    });

    this.logger.log(`Created user ${user.email}`);
    return this.toPublic(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(ErrorMessage.UserNotFound);
    return this.toPublic(user);
  }

  async findByIdentifier(identifier: string) {
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      include: { secrets: true },
    });
    if (!user) return null;
    return {
      ...user,
      password: user.secrets?.password,
      toPublic: () => this.toPublic(user),
    };
  }

  async findByEmailOrUsername(email: string) {
    return this.db.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
      include: { secrets: true },
    });
  }

  async findByIdWithSecrets(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { secrets: true },
    });
  }

  async findByResetToken(token: string) {
    const secrets = await this.db.secrets.findFirst({
      where: { resetToken: token },
      include: { user: true },
    });
    if (!secrets) return null;
    return { ...secrets.user, secrets };
  }

  async setResetToken(id: string, token: string) {
    await this.db.secrets.upsert({
      where: { userId: id },
      update: { resetToken: token },
      create: { userId: id, resetToken: token },
    });
  }

  async setPassword(id: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    await this.db.secrets.upsert({
      where: { userId: id },
      update: { password: hashed, resetToken: null },
      create: { userId: id, password: hashed },
    });
  }

  findAll(): User[] {
    // For admin listing — simplified sync version
    return [];
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      username: string;
      locale: string;
    }>,
  ) {
    const user = await this.db.user.update({ where: { id }, data });
    return this.toPublic(user);
  }

  async remove(id: string) {
    await this.db.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    username: string;
    picture: string | null;
    role: string;
    emailVerified: boolean;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      picture: user.picture,
      role: user.role as 'user' | 'admin',
      emailVerified: user.emailVerified,
      locale: user.locale,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
