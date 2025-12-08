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
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<GetUserResponseDto> {
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty');
    }

    const user = await this.userService.updateUser(userId, updateUserDto);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * DELETE /users/:id - Delete user account
   * Removes user account (requires password confirmation)
   *
   * @param userId User unique identifier (UUID)
   * @param deleteUserDto Delete request data (password confirmation)
   * @returns HTTP 204 No Content
   * @throws NotFoundException If user not found
   * @throws BadRequestException If password confirmation fails
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<void> {
    const result = await this.userService.deleteUser(userId);
    if (!result) {
      throw new BadRequestException('User not found or cannot be deleted');
    }
  }
}
