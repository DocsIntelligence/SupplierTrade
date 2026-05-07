import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RegisterDto, User, UserWithSecrets } from '@org/dto';
import { ErrorMessage } from '@org/utils';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UserEntity } from './entities/user.entity';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  // In-memory store. Replace with a real persistence layer (Prisma, TypeORM…).
  private readonly store = new Map<string, UserEntity>();

  async create(payload: RegisterDto): Promise<User> {
    const existing = await this.findByEmailOrUsername(
      payload.email,
      payload.username,
    );
    if (existing) throw new ConflictException(ErrorMessage.UserAlreadyExists);

    const now = new Date().toISOString();
    const entity = Object.assign(new UserEntity(), {
      id: randomUUID(),
      name: payload.name,
      email: payload.email.toLowerCase(),
      username: payload.username.toLowerCase(),
      picture: null,
      role: 'user' as const,
      emailVerified: false,
      locale: payload.locale ?? 'en-US',
      password: await bcrypt.hash(payload.password, 12),
      resetToken: null,
      verificationToken: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    this.store.set(entity.id, entity);
    return entity.toPublic();
  }

  findAll(): User[] {
    return [...this.store.values()].map((u) => u.toPublic());
  }

  async findById(id: string): Promise<User> {
    const entity = this.store.get(id);
    if (!entity) throw new NotFoundException(ErrorMessage.UserNotFound);
    return entity.toPublic();
  }

  async findByIdWithSecrets(id: string): Promise<UserWithSecrets | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmailOrUsername(
    email?: string,
    username?: string,
  ): Promise<UserEntity | null> {
    const e = email?.toLowerCase();
    const u = username?.toLowerCase();
    for (const entity of this.store.values()) {
      if (e && entity.email === e) return entity;
      if (u && entity.username === u) return entity;
    }
    return null;
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    return identifier.includes('@')
      ? this.findByEmailOrUsername(identifier, undefined)
      : this.findByEmailOrUsername(undefined, identifier);
  }

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    const entity = this.store.get(id);
    if (!entity) throw new NotFoundException(ErrorMessage.UserNotFound);
    Object.assign(entity, payload, { updatedAt: new Date().toISOString() });
    return entity.toPublic();
  }

  async setPassword(id: string, plainPassword: string): Promise<void> {
    const entity = this.store.get(id);
    if (!entity) throw new NotFoundException(ErrorMessage.UserNotFound);
    entity.password = await bcrypt.hash(plainPassword, 12);
    entity.resetToken = null;
    entity.updatedAt = new Date().toISOString();
  }

  async setResetToken(id: string, token: string | null): Promise<void> {
    const entity = this.store.get(id);
    if (!entity) throw new NotFoundException(ErrorMessage.UserNotFound);
    entity.resetToken = token;
    entity.updatedAt = new Date().toISOString();
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    for (const entity of this.store.values()) {
      if (entity.resetToken === token) return entity;
    }
    return null;
  }

  remove(id: string): { ok: true } {
    if (!this.store.delete(id))
      throw new NotFoundException(ErrorMessage.UserNotFound);
    return { ok: true };
  }
}
