import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as entities from '../entities';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USER') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_NAME') || 'arq_db',
        entities: Object.values(entities),
        migrations: ['src/database/migrations/*.ts'],
        migrationsTableName: 'typeorm_migrations',
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<boolean>('DB_LOGGING') || false,
        logger: 'advanced-console',
        namingStrategy: new SnakeNamingStrategy(),
        maxQueryExecutionTime: 1000,
        subscribers: [],
        dropSchema: false,
        ssl: configService.get<boolean>('DB_SSL') ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class TypeOrmDatabaseModule {}
