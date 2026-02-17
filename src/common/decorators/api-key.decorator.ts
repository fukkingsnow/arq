import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * ApiKey Decorator - Extract API key from request headers
 *
 * Usage: @ApiKey() apiKey: string
 * Extracts API key from 'x-api-key' header
 */
export const ApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-api-key'];
  },
);
