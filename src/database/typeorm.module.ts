import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';

/**
 * TypeORM Database Module
 * Configures PostgreSQL database connection with TypeORM ORM.
 * Supports dynamic entity discovery and migrations.
 * Enables connection pooling and query optimization.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('[TypeORM Module] Initializing TypeORM with database config');
        return getDatabaseConfig(configService);
      },
    }),
  ],
})
export class TypeOrmDatabaseModule {}
