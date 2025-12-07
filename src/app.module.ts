import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth.module';
import { BrowserModule } from './modules/browser.module';
import { UserModule } from './modules/user.module';
import { CommonModule } from './modules/common.module';

/**
 * Root Application Module
 *
 * Orchestrates all feature modules and provides global configuration.
 * - Loads environment variables via ConfigModule
 * - Initializes database connection via DatabaseModule
 * - Imports all feature modules (Auth, Browser, User)
 * - Imports shared CommonModule for cross-module dependencies
 *
 * @module src/app.module
 * @example
 * const app = await NestFactory.create(AppModule);
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database
    DatabaseModule,
    // Feature Modules
    AuthModule,
    BrowserModule,
    UserModule,
    // Shared Module
    CommonModule,
  ],
})
export class AppModule {}
