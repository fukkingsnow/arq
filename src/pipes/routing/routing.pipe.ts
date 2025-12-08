import { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { IPipe } from '../interfaces/pipe.interface';
import { DialogContext } from '../../common/interfaces/dialogue.interface';
import { PipeResult } from '../interfaces/pipe.interface';

export type RouteHandler = (context: DialogContext) => Promise<any>;

export interface RoutingConfig {
  routes: Map<string, RouteHandler>;
  defaultRoute?: RouteHandler;
}

@Injectable()
export class RoutingPipe extends BasePipe implements IPipe {
  private routes: Map<string, RouteHandler> = new Map();

  constructor() {
    super('RoutingPipe', {
      description: 'Routes dialogue to appropriate handlers',
      version: '1.0.0',
      priority: 50,
      enabled: true,
    });
  }

  registerRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  async execute(context: DialogContext): Promise<PipeResult> {
    try {
      const routePath = this.determineRoute(context);
      const handler = this.routes.get(routePath);

      if (!handler) {
        return this.createErrorResult(
          `No handler found for route: ${routePath}`,
          context,
        );
      }

      const result = await handler(context);

      return this.createSuccessResult(
        context,
        `Routed to ${routePath} successfully`,
      );
    } catch (error) {
      return this.createErrorResult(
        `Routing error: ${(error as Error).message}`,
        context,
      );
    }
  }

  private determineRoute(context: DialogContext): string {
    const message = context.message.toLowerCase();

    // Route based on keywords
    if (message.includes('help') || message.includes('assist')) {
      return '/help';
    }
    if (message.includes('order') || message.includes('purchase')) {
      return '/order';
    }
    if (message.includes('support') || message.includes('issue')) {
      return '/support';
    }
    if (message.includes('info') || message.includes('information')) {
      return '/info';
    }

    return '/default';
  }
}
