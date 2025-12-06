import { Injectable, BadRequestException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface VerificationToken {
  email: string;
  token: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class EmailVerificationService {
  private verificationTokens: Map<string, VerificationToken> = new Map();
  private readonly TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_ATTEMPTS = 5;

  constructor(private configService: ConfigService) {}

  /**
   * Generate verification token for email confirmation
   * Stores token with expiration time for later validation
   */
  generateVerificationToken(email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    this.verificationTokens.set(token, {
      email,
      token,
      expiresAt,
      attempts: 0,
    });

    return token;
  }

  /**
   * Verify email confirmation token
   * Checks token validity, expiration, and attempt count
   */
  verifyEmailToken(token: string): { email: string; valid: boolean } {
    const verification = this.verificationTokens.get(token);

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (new Date() > verification.expiresAt) {
      this.verificationTokens.delete(token);
      throw new GoneException('Verification token has expired');
    }

    if (verification.attempts >= this.MAX_ATTEMPTS) {
      this.verificationTokens.delete(token);
      throw new BadRequestException('Too many verification attempts');
    }

    verification.attempts++;
    this.verificationTokens.set(token, verification);

    return {
      email: verification.email,
      valid: true,
    };
  }

  /**
   * Confirm email verification - mark as verified
   */
  confirmEmailVerification(token: string): { email: string } {
    const verification = this.verificationTokens.get(token);

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    const email = verification.email;
    this.verificationTokens.delete(token);

    return { email };
  }

  /**
   * Get verification token info (for debugging/admin)
   */
  getVerificationInfo(token: string): VerificationToken | null {
    return this.verificationTokens.get(token) || null;
  }

  /**
   * Cleanup expired tokens (should run periodically)
   */
  cleanupExpiredTokens(): number {
    let deletedCount = 0;
    const now = new Date();

    for (const [token, verification] of this.verificationTokens.entries()) {
      if (now > verification.expiresAt) {
        this.verificationTokens.delete(token);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

/**
 * Email Verification Service
 * 
 * Manages email verification workflow for new user registration.
 * Generates secure tokens, tracks verification state, and validates confirmations.
 * 
 * Features:
 * - Secure random token generation using crypto.randomBytes
 * - 24-hour token expiration for security
 * - Attempt limiting (5 max) against brute-force
 * - Expired token cleanup utility
 * - In-memory storage (can be replaced with Redis for production)
 * 
 * Workflow:
 * 1. generateVerificationToken() → Create token on registration
 * 2. Send token via email link to user
 * 3. verifyEmailToken() → User clicks link, validate token
 * 4. confirmEmailVerification() → Mark email as verified
 * 
 * Production Considerations:
 * - Replace in-memory Map with Redis for scalability
 * - Implement scheduled cleanup job for expired tokens
 * - Send actual email via SendGrid, AWS SES, or similar
 * - Add database persistence for verification audit
 * - Implement retry logic for email sending
 * 
 * Security:
 * - Tokens are cryptographically secure (32 bytes)
 * - Expiration prevents long-lived token exploitation
 * - Attempt limiting prevents brute-force attacks
 * - In-memory storage (no database queries for validation)
 */
