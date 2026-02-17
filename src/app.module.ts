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
import { FileSystemService } from './services/file-system.service'; // Добавлен импорт
import { TasksModule } from './modules/tasks.module';

/**
 * Root Application Module
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
    ContextEngineModule,
    GitHubModule,
    AssistantModule,
    TasksModule,
  ],
  controllers: [AppController, ARQController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AutonomousStrategyAnalyzer,
    MetricsService,
    FileSystemService, // Добавлен сюда
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures and registers middleware
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CompressionRequestMiddleware)
      .forRoutes('*')
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
