import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, RefreshToken } from '../entities';import { UserRepository } from '../repositories, RefreshTokenRepository };
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, RefreshToken } from '../entities';
import { UserRepository, RefreshTokenRepository } from '../repositories';le
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, RefreshTokenRepository],  exports: [AuthService, JwtModule],
})
export class AuthModule {}
