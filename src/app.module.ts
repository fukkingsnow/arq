import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ValidationExceptionFilter } from './common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth.module';
import { BrowserModule } from './modules/browser.module';
import { UserModule } from './modules/user.module';
import { CommonModule } from './modules/common.module';
import { RequestLoggingMiddleware, CompressionRequestMiddleware } from './common/middleware';

/**
 * Root Application Module
 *
 * Orchestrates all feature modules and provides global configuration.
 * - Loads environment variables via ConfigModule
 * - Initializes database connection via DatabaseModule
 * - Imports all feature modules (Auth, Browser, User)
 * - Imports shared CommonModule for cross-module dependencies
 * - Registers middleware for HTTP request processing (Phase 25)
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
    providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures and registers middleware for the application
   * Phase 25: Middleware Application Integration
   * - RequestLoggingMiddleware: Logs HTTP traffic with timestamps
   * - CompressionRequestMiddleware: Enables gzip/deflate response compression
   *
   * @param consumer - NestJS middleware consumer for registration
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      // Apply compression middleware to all routes
      .apply(CompressionRequestMiddleware)
      .forRoutes('*')
      // Apply request logging middleware to all routes
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
