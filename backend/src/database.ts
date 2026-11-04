import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { Company } from './catalog/company.entity';
import { Opportunity } from './catalog/opportunity.entity';
import { User } from './users/user.entity';

export const ENTITIES = [User, Company, Opportunity];

/**
 * За замовчуванням — локальний файл SQLite (через sql.js, без нативних залежностей),
 * щоб проєкт запускався однією командою. Для PostgreSQL задайте DATABASE_URL.
 */
export function databaseConfig(): TypeOrmModuleOptions {
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ENTITIES,
      synchronize: process.env.DB_SYNC !== 'false',
    };
  }

  const location = resolve(process.env.SQLITE_PATH ?? 'data/business-navigator.sqlite');
  mkdirSync(dirname(location), { recursive: true });
  return {
    type: 'sqljs',
    location,
    autoSave: true,
    entities: ENTITIES,
    synchronize: true,
  };
}
