import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const dbUrl = configService.get<string>('DATABASE_URL');
  console.log('[DATABASE CONFIG] Initializing with DATABASE_URL:', dbUrl);

  return {
    type: 'postgres',
    url: dbUrl,
    entities: ['dist/entities/*.js'],
    synchronize: true,
    logging: ['error', 'warn', 'log', 'query'],
    migrationsRun: false,
    migrations: ['dist/src/database/migrations/*.{js,ts}'],
  };
};
