import { EntityRepository, Repository } from 'typeorm';
import { RefreshToken } from '../entities';

/**
 * Repository for RefreshToken entity
 * Manages database operations for refresh tokens
 */
@EntityRepository(RefreshToken)
export class RefreshTokenRepository extends Repository<RefreshToken> {}
