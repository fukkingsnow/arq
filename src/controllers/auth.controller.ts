import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
}

interface RefreshDto {
  refreshToken: string;
}

/**
 * AuthController - Handles authentication endpoints
 * Manages login, registration, and token refresh operations
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login - User login endpoint
   * @param loginDto Login credentials
   * @returns JWT tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * POST /auth/register - User registration endpoint
   * @param registerDto Registration data
   * @returns Created user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto.email, registerDto.password);
  }

  /**
   * POST /auth/refresh - Refresh access token
   * @param refreshDto Refresh token
   * @returns New access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto) {
    return await this.authService.refreshToken(refreshDto.refreshToken);
  }
}
