import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as path from 'path';
const srcDir = path.join(process.cwd(), 'src');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(srcDir, 'modules/**/*.entity.{ts,js}')],
  migrations: [path.join(srcDir, 'migrations/*.{ts,js}')],
});
