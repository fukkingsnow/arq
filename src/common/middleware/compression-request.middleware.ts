import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Compression Request Middleware
 * Enables gzip/deflate compression for HTTP responses
 * Reduces payload size for faster data transmission
 */
@Injectable()
export class CompressionRequestMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: any;

  constructor() {
    this.compressionMiddleware = compression({
      level: 6, // Compression level (0-9)
      threshold: 1024, // Only compress responses larger than 1KB
    });
  }

  /**
   * Middleware function to apply response compression
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Next middleware function
   */
  use(req: Request, res: Response, next: NextFunction): void {
    this.compressionMiddleware(req, res, next);
  }
}

