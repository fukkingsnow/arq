import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const dbUrl = configService.get<string>('DATABASE_URL');
  
  return {
    type: 'postgres',
    url: dbUrl,
    entities: ['dist/src/**/*.entity.{js,ts}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    migrationsRun: false,
    migrations: ['dist/src/database/migrations/*.{js,ts}'],
  };
};
