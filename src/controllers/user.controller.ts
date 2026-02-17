import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../services';
import {
  GetUserResponseDto,
  UpdateUserDto,
  DeleteUserDto,
} from '../dto';

/**
 * UserController - Manages user profile and account endpoints
 * Handles user profile operations, account management
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users/:id - Get user profile by ID
   * Retrieves user account information (without sensitive data)
   *
   * @param userId User unique identifier (UUID)
   * @returns GetUserResponseDto User profile data
   * @throws NotFoundException If user not found
   */
  @Get(':id')
  async getUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
  ): Promise<GetUserResponseDto> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  /**
   * PUT /users/:id - Update user profile
   * Allows users to update their profile information
   *
   * @param userId User ID
   * @param updateUserDto Updated user data
   * @returns Updated user profile
   */
  @Put(':id')
  async updateUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<GetUserResponseDto> {
    const user = await this.userService.updateUser(userId, updateUserDto);
    if (!user) {
      throw new BadRequestException('User update failed');
    }
    return user;
  }

  /**
   * DELETE /users/:id - Delete user account
   * Removes user account with password verification
   *
   * @param userId User ID
   * @param deleteUserDto Password verification
   * @returns Success message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.userService.deleteUser(userId);
    return {
success: (result.affected ?? 0) > 0,      message: result ? 'User account deleted successfully' : 'Failed to delete user account',
    };
  }
}
