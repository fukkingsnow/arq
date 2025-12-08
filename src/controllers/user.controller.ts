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
 * 
 * @controller users
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
    @Param('id', new ParseUUIDPipe())
    userId: string,
  ): Promise<GetUserResponseDto> {
    return await this.userService.getUserById(userId);
  }

  /**
   * PUT /users/:id - Update user profile
   * Allows user to update their profile information (name, etc.)
   * 
   * @param userId User unique identifier (UUID)
   * @param updateUserDto Update data (firstName, lastName, fullName)
   * @returns GetUserResponseDto Updated user profile
   * @throws NotFoundException If user not found
   * @throws BadRequestException If invalid update data
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', new ParseUUIDPipe())
    userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<GetUserResponseDto> {
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty');
    }
    return await this.userService.updateUser(userId, updateUserDto);
  }

  /**
   * DELETE /users/:id - Delete user account
   * Permanently deletes user account and associated data
   * Requires password confirmation for security
   * 
   * @param userId User unique identifier (UUID)
   * @param deleteUserDto Deletion confirmation with password
   * @returns Success message
   * @throws NotFoundException If user not found
   * @throws BadRequestException If password incorrect
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', new ParseUUIDPipe())
    userId: string,
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<void> {
    if (!deleteUserDto.password) {
      throw new BadRequestException('Password confirmation required');
    }
    await this.userService.deleteUser(userId, deleteUserDto.password);
  }
}
