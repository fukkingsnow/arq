import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User, RefreshToken } from '../entities';

/**
 * AuthResult interface - contains user and tokens
 */
export interface AuthResult {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}


/**
 * AuthService - Handles JWT authentication and token management
 * Manages login, registration, and token refresh logic
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(RefreshToken) private tokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Login user and generate JWT tokens
   * @param email User email
   * @param password User password
   * @returns Access token and refresh token
   */
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  /**
   * Register new user with email and password
   * @param email User email
   * @param password User password
   * @returns Created user
   */
  async register(email: string, password: string) {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, password: hashedPassword });    return await this.userRepository.save(user);
  }

  /**
   * Generate JWT access and refresh tokens
   * @param user User entity
   * @returns Token pair
   */
  async generateTokens(user: User) {
    const accessToken = this.jwtService.sign(
      { id: user.id, email: user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   * @param token Refresh token
   * @returns New access token
   */
  async refreshToken(token: string) {
    const payload = this.jwtService.verify(token);
    const user = await this.userRepository.findOne({ where: { id: payload.id } });
    if (!user) throw new UnauthorizedException('User not found');
    return { accessToken: this.jwtService.sign({ id: user.id, email: user.email }, { expiresIn: '15m' }) };
  }

  /**
   * Validate JWT token payload
   * @param token JWT token
   * @returns Token payload
   */
  validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}

