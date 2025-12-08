DialogueContext
  DialogContextimport { Injectable } from '@nestjs/common';
import { BasePipe } from '../base/base.pipe';
import { IPipe, PipeResult } from '../interfaces';
import { DialogueContext } from '../../common/interfaces/dialogue.interface';

export type RouteHandler = (context: DialogueContext) => Promise<any>;

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

  async execute(context: DialogueContext): Promise<PipeResult> {
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
        {
          ...context,
          routePath,
          routeResult: result,
        },
        context,
      );
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        context,
      );
    }
  }

  private determineRoute(context: DialogueContext): string {
    // Simple routing logic - can be extended
    if (context.intent) {
      return context.intent;
    }
    return 'default';
  }
}
