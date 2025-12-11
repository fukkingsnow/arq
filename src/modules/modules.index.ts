/**
 * Application Modules Index
 * Centralized export for all application modules.
 * Includes infrastructure, configuration, and feature modules.
 */

// Infrastructure Modules
export { TypeOrmDatabaseModule } from '../database/typeorm.module';
export { ConfigModuleWrapper } from '../config/config.module';
export { AuthModule } from '../auth/auth.module';
export { DialogueModule } from './dialogue.module';
export { WorkflowModule } from './workflow.module';

// Application Modules
export { AppModule } from '../app.module';

// Module Types
export type { DynamicModule } from '@nestjs/common';
export type { ModuleMetadata } from '@nestjs/common';

/**
 * Module Loading Strategy
 * - ConfigModule: Loads first for environment configuration
 * - TypeOrmModule: Initializes database connection
 * - AuthModule: Sets up authentication and JWT
 * - AppModule: Orchestrates all modules
 */
