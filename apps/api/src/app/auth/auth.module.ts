import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleStrategy } from './strategies/google';
import { JwtStrategy } from './strategies/jwt';
import { LocalStrategy } from './strategies/local';
import { RefreshJwtStrategy } from './strategies/refresh-jwt';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshJwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RefreshJwtGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
