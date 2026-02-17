import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Logging Middleware
 * Logs incoming HTTP requests with method, URL, and response status
 * Helps with debugging and monitoring API traffic
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  /**
   * Middleware function to log HTTP requests
   * @param req - Express request object
   * @param res - Express response object  
   * @param next - Next middleware function
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    // Log request
    this.logger.debug(`Incoming: ${method} ${originalUrl} from ${ip}`);

    // Track response finish
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      this.logger.debug(
        `Finished: ${method} ${originalUrl} - Status: ${statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}
