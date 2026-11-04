import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Company } from './company.entity';
import { Opportunity } from './opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Opportunity]), UsersModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
