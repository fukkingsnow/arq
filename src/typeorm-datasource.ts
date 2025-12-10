import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    `postgres://${process.env.DB_USERNAME ?? 'arq_dev'}:${process.env.DB_PASSWORD ?? 'arq_dev_password'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_DATABASE ?? 'arq_development'}`,
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: false,
});
