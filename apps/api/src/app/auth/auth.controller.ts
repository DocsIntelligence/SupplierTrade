import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthResponse, MessageResponse, User } from '@org/dto';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password';
import { ForgotPasswordDto } from './dto/forgot-password';
import { LoginDto } from './dto/login';
import { RegisterDto } from './dto/register';
import { ResetPasswordDto } from './dto/reset-password';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(body);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(
    @Req() _req: Request,
    @CurrentUser() user: User,
    @Body() _body: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.login(user);
  }

  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  refresh(@CurrentUser() user: User): Promise<AuthResponse> {
    return this.authService.refresh(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(): Promise<MessageResponse> {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Public()
  @Post('forgot-password')
  forgot(@Body() body: ForgotPasswordDto): Promise<MessageResponse> {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('reset-password')
  reset(
    @Body() body: ResetPasswordDto,
  ): Promise<MessageResponse> {
    return this.authService.resetPassword({
      token: body.token,
      password: body.password,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  change(
    @CurrentUser() user: User,
    @Body() body: ChangePasswordDto,
  ): Promise<MessageResponse> {
    return this.authService.changePassword(user.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }
}
