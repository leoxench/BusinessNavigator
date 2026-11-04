import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { databaseConfig } from './database';
import { seedIfEmpty } from './seed/seed';
import { UsersModule } from './users/users.module';

@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: databaseConfig }), AuthModule, UsersModule, CatalogModule],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly ds: DataSource) {}

  async onApplicationBootstrap() {
    if (process.env.SEED === 'false') return;
    if (await seedIfEmpty(this.ds)) Logger.log('База порожня — додано демо-дані', 'Seed');
  }
}
