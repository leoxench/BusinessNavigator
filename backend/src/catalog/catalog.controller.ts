import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CatalogService, CatalogType } from './catalog.service';

const TYPES: CatalogType[] = ['person', 'company', 'opportunity'];

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /** GET /api/catalog?type=person|company|opportunity — без type повертає все одним списком. */
  @Get('catalog')
  list(@Query('type') type?: string) {
    if (type && !TYPES.includes(type as CatalogType)) {
      throw new BadRequestException(`type має бути одним із: ${TYPES.join(', ')}`);
    }
    return this.catalog.list(type as CatalogType | undefined);
  }

  @Get('catalog/counts')
  counts() {
    return this.catalog.counts();
  }

  @Get('fop')
  fops() {
    return this.catalog.fops();
  }

  @Get('companies/:id')
  company(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.company(id);
  }

  @Get('opportunities/:id')
  opportunity(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.opportunity(id);
  }
}
