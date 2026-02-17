import { MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggingMiddleware, CompressionRequestMiddleware } from './middleware';

/**
 * Middleware Configuration
 * Phase 25: Centralized middleware setup for the application
 * 
 * This configuration file provides reusable middleware setup patterns
 * for different application modules and route groups.
 */
export class MiddlewareConfig {
  /**
   * Apply all standard middleware to consumer
   * Includes compression and request logging
   * 
   * @param consumer - NestJS MiddlewareConsumer
   * @param routes - Routes to apply middleware to ('*' for all routes)
   */
  static applyStandardMiddleware(
    consumer: MiddlewareConsumer,
    routes: string[] = ['*'],
  ): MiddlewareConsumer {
    return consumer
      .apply(CompressionRequestMiddleware)
      .forRoutes(...routes)
      .apply(RequestLoggingMiddleware)
      .forRoutes(...routes);
  }

  /**
   * Apply only compression middleware
   * Useful for specific routes that need compression only
   * 
   * @param consumer - NestJS MiddlewareConsumer
   * @param routes - Routes to apply middleware to
   */
  static applyCompressionMiddleware(
    consumer: MiddlewareConsumer,
    routes: string[],
  ): MiddlewareConsumer {
    return consumer.apply(CompressionRequestMiddleware).forRoutes(...routes);
  }

  /**
   * Apply only request logging middleware
   * Useful for specific routes that need logging only
   * 
   * @param consumer - NestJS MiddlewareConsumer
   * @param routes - Routes to apply middleware to
   */
  static applyLoggingMiddleware(
    consumer: MiddlewareConsumer,
    routes: string[],
  ): MiddlewareConsumer {
    return consumer.apply(RequestLoggingMiddleware).forRoutes(...routes);
  }
}
