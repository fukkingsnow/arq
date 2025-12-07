import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { UserService } from '../services';

interface UpdateUserDto {
  email?: string;
  profile?: any;
}

/**
 * UserController - Manages user endpoints
 * Handles user profile operations
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users/:id - Get user by ID
   * @param userId User ID
   * @returns User data
   */
  @Get(':id')
  async getUser(@Param('id') userId: string) {
    return await this.userService.getUserById(userId);
  }

  /**
   * PUT /users/:id - Update user profile
   * @param userId User ID
   * @param dto Update data
   * @returns Updated user
   */
  @Put(':id')
  async updateUser(@Param('id') userId: string, @Body() dto: UpdateUserDto) {
    return await this.userService.updateUser(userId, dto);
  }

  /**
   * DELETE /users/:id - Delete user account
   * @param userId User ID
   */
  @Delete(':id')
  async deleteUser(@Param('id') userId: string) {
    return await this.userService.deleteUser(userId);
  }
}
