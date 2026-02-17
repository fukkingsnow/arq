import { Injectable, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';

/**
 * UserService - Manages user account operations
 * Handles user creation, retrieval, and profile updates
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,  ) {}

  /**
   * Create new user account
   * @param email User email
   * @param password Hashed password
   * @returns Created user
   */
  async createUser(email: string, password: string) {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) throw new ConflictException('User already exists');
    const user = this.userRepository.create({ email, password });
    return await this.userRepository.save(user);
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @returns User data without password
   */
  async getUserById(userId: string) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Get user by email
   * @param email User email
   * @returns User data
   */
  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Update user profile
   * @param userId User ID
   * @param data Update data
   * @returns Updated user
   */
  async updateUser(userId: string, data: any) {
    await this.userRepository.update(userId, data);
    return await this.getUserById(userId);
  }

  /**
   * Delete user account
   * @param userId User ID
   */
  async deleteUser(userId: string) {
    return await this.userRepository.delete(userId);
  }
}

