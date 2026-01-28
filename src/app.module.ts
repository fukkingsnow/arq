import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ValidationExceptionFilter } from './common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth.module';
import { BrowserModule } from './modules/browser.module';
import { UserModule } from './modules/user.module';
import { CommonModule } from './modules/common.module';
import { ContextEngineModule } from './context-engine/context-engine.module';
import { RequestLoggingMiddleware, CompressionRequestMiddleware } from './common/middleware';
import { GitHubModule } from './modules/github.module';
import { ARQController } from './controllers/arq.controller';
import { AssistantModule } from './modules/assistant/assistant.module';
import { AppController } from './app.controller';
import { AutonomousStrategyAnalyzer } from './services/autonomous-strategy.analyzer';
import { MetricsService } from './services/metrics.service';
import { TaskModule } from './task/task.module';
import { TasksModule } from './modules/tasks.module';

// Импорты для Model Context Protocol
import { McpModule } from '@rekog/mcp-nest';
import { ArqMcpTools } from './services/mcp-tools.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Обычно конфиг инициализируется так
    DatabaseModule,
    AuthModule,
    BrowserModule,
    UserModule,
    CommonModule,
    ContextEngineModule,
    GitHubModule,
    AssistantModule,
    TaskModule,
    TasksModule,
    McpModule,
  ],
  controllers: [
    AppController, 
    ARQController
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AutonomousStrategyAnalyzer,
    MetricsService,
    ArqMcpTools,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CompressionRequestMiddleware)
      .forRoutes('*')
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
