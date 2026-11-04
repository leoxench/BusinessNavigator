import 'reflect-metadata';
import { rmSync } from 'fs';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../database';
import { DEMO_PASSWORD, seedIfEmpty } from './seed';

/** `npm run seed -- --reset` — перестворити локальну SQLite-базу з демо-даними. */
async function main() {
  if (process.argv.includes('--reset') && !process.env.DATABASE_URL) {
    rmSync(resolve(process.env.SQLITE_PATH ?? 'data/business-navigator.sqlite'), { force: true });
  }
  const ds = new DataSource(databaseConfig() as DataSourceOptions);
  await ds.initialize();
  const seeded = await seedIfEmpty(ds);
  await ds.destroy();
  console.log(seeded ? `Демо-дані додано. Пароль демо-акаунтів: ${DEMO_PASSWORD}` : 'База вже містить дані — пропущено.');
}

main();
