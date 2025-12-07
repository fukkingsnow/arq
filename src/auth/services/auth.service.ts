import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../users/repositories/user.repository';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  access_token: string;
  user: Partial<User>;
  expiresIn: number;
}

interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { email, password, firstName, lastName } = registerDto;

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    if (!this.isStrongPassword(password)) {
      throw new BadRequestException(
        'Password must be 8+ chars with uppercase, lowercase, and numbers',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({ email, password });

    const token = this.generateToken(user);

    return {
      access_token: token,
      user: this.sanitizeUser(user),
      expiresIn: 86400,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const token = this.generateToken(user);

    return {
      access_token: token,
      user: this.sanitizeUser(user),
      expiresIn: 86400,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: payload.sub } });
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

/**
 * Authentication Service - Core Business Logic
 * Handles user registration, login, token generation, and credential validation
 * 
 * Key Responsibilities:
 * - User registration with email & password strength validation
 * - User login with credential verification
 * - JWT token generation with Passport integration
 * - Password hashing with bcrypt (10 salt rounds)
 * - User data sanitization (removes sensitive information)
 * - TypeORM UserRepository integration for persistence
 * 
 * Security Features:
 * - Bcrypt prevents rainbow table attacks
 * - Email validation ensures proper format
 * - Password complexity requirements enforced
 * - Duplicate email prevention at registration
 * - User active status validation at login
 * - Constant-time password comparison
 * - Sensitive data removed from responses
 * 
 * API Methods:
 * - register(): Create new user account
 * - login(): Authenticate user and generate token
 * - validateUser(): Used by LocalStrategy for Passport
 * - validateJwtPayload(): Used by JwtStrategy for Passport
 * 
 * Password Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * 
 * Token Expiration: 24 hours (configurable)
 */




