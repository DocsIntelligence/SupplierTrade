import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { AuthResponse, MessageResponse, User } from '@org/dto';
import type { Request, Response } from 'express';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieDomain: string;
  private readonly cookieSecure: boolean;
  private readonly accessTtlMs: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.cookieDomain = this.config.get<string>('COOKIE_DOMAIN', 'localhost');
    this.cookieSecure =
      this.config.get<string>('COOKIE_SECURE', 'false') === 'true';
    this.accessTtlMs = this.parseTtlToMs(
      this.config.get<string>('ACCESS_TOKEN_TTL', '15m'),
    );
    this.refreshTtlMs = this.parseTtlToMs(
      this.config.get<string>('REFRESH_TOKEN_TTL', '7d'),
    );
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created, tokens set as cookies',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
  })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(body);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with email/username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Authenticated, tokens set as cookies',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Req() _req: Request,
    @CurrentUser() user: User,
    @Body() _body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(user);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (via cookie or body)' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 201, description: 'New tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.refresh(user);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 201, description: 'Logged out, cookies cleared' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponse> {
    this.clearAuthCookies(res);
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Reset email sent (if account exists)',
  })
  forgot(@Body() body: ForgotPasswordDto): Promise<MessageResponse> {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 201, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  reset(@Body() body: ResetPasswordDto): Promise<MessageResponse> {
    return this.authService.resetPassword({
      token: body.token,
      password: body.password,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 201, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  change(
    @CurrentUser() user: User,
    @Body() body: ChangePasswordDto,
  ): Promise<MessageResponse> {
    return this.authService.changePassword(user.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }

  // ─── Cookie helpers ───────────────────────────────────────────────────

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const shared = {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax' as const,
      domain: this.cookieDomain,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...shared,
      maxAge: this.accessTtlMs,
    });

    res.cookie('refresh_token', refreshToken, {
      ...shared,
      maxAge: this.refreshTtlMs,
      path: '/api/auth/refresh',
    });
  }

  private clearAuthCookies(res: Response) {
    const shared = {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax' as const,
      domain: this.cookieDomain,
    };

    res.clearCookie('access_token', { ...shared, path: '/' });
    res.clearCookie('refresh_token', { ...shared, path: '/api/auth/refresh' });
  }

  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 15 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}
