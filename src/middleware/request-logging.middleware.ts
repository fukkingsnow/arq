import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * RequestLoggingMiddleware - Logs all incoming HTTP requests
 * Captures method, URL, IP, and response time
 * Useful for debugging and monitoring API usage
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`,
      );
    });

    next();
  }
}
