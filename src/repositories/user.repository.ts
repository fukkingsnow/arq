import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { User } from '../entities/user.entity';

/**
 * User Repository
 *
 * Manages user database operations including:
 * - User account creation and management
 * - Profile information persistence
 * - User search and filtering
 * - Authentication data management
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  /**
   * Find user by email address
   * @param email User email
   * @returns User entity or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by username
   * @param username User's unique username
   * @returns User entity or null
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * Search users by name pattern
   * @param searchTerm Search query
   * @returns Array of matching users
   */
  async search(searchTerm: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.fullName LIKE :term', { term: `%${searchTerm}%` })
      .orWhere('user.email LIKE :term', { term: `%${searchTerm}%` })
      .getMany();
  }
}
