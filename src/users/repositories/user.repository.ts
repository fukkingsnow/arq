import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';

/**
 * User Repository - Data Access Layer
 * Phase 21: Custom repository methods for user queries
 * Implements all database operations for User entity
 */
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /**
   * Find user by email (case-insensitive)
   * Used in authentication flow
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Find user by username
   * Used in authentication and profile lookup
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Find active user by email
   * Ensures user is not deactivated
   */
  async findActiveByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });
  }

  /**
   * Create new user
   * Validates unique constraints
   */
  async createUser(
    email: string,
    username: string,
    passwordHash: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const user = this.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      firstName,
      lastName,
      role: UserRole.USER,
      isActive: true,
    });
    return this.save(user);
  }

  /**
   * Find user with conversations and memories
   * For complete profile retrieval
   */
  async findWithRelations(userId: string): Promise<User | null> {
    return this.findOne({
      where: { id: userId },
      relations: ['conversations', 'memories'],
      relationLoadStrategy: 'query',
    });
  }

  /**
   * Get user by ID with public fields only
   */
  async findPublicProfile(userId: string): Promise<Partial<User> | null> {
    const user = await this.findOne({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
    return user || null;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.update({ id: userId }, { lastLoginAt: new Date() });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.countBy({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.countBy({ username });
    return count > 0;
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.find({ where: { role } });
  }

  /**
   * Soft deactivate user
   */
  async deactivateUser(userId: string): Promise<void> {
    await this.update({ id: userId }, { isActive: false });
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<void> {
    await this.update({ id: userId }, { isActive: true });
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(userId: string): Promise<void> {
    await this.update({ id: userId }, { role: UserRole.ADMIN });
  }
}
