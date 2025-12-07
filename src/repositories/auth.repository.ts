import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { AuthToken } from '../entities/auth-token.entity';

/**
 * Authentication Repository
 *
 * Manages authentication credentials and tokens including:
 * - JWT token storage and retrieval
 * - Refresh token management
 * - Token revocation and blacklisting
 * - Session token persistence
 */
@Injectable()
export class AuthRepository extends BaseRepository<AuthToken> {
  constructor(
    @InjectRepository(AuthToken)
    private readonly authRepository: Repository<AuthToken>,
  ) {
    super(authRepository);
  }

  /**
   * Find token by user ID
   * @param userId User identifier
   * @returns AuthToken entity or null
   */
  async findByUserId(userId: string | number): Promise<AuthToken | null> {
    const userIdStr = String(userId);
    return this.authRepository.findOne({ where: { userId: userIdStr } });
  }

  /**
   * Find token by JWT string
   * @param token JWT token string
   * @returns AuthToken entity or null
   */
  async findByToken(token: string): Promise<AuthToken | null> {
    return this.authRepository.findOne({  });
  }

  /**
   * Revoke token by user ID
   * @param userId User identifier
   * @returns Success flag
   */
  async revokeByUserId(userId: string | number): Promise<boolean> {
    const userIdStr = String(userId);
    return this.update(userIdStr, { isRevoked: true } as any).then(Boolean);
  }

  /**
   * Check if token is valid and not revoked
   * @param token Token string
   * @returns Validity status
   */
  async isTokenValid(token: string): Promise<boolean> {
    const authToken = await this.findByToken(token);
    return !!(authToken &&authToken.isActive);
  }
}
