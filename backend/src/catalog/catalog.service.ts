import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Company } from './company.entity';
import { Opportunity } from './opportunity.entity';

export type CatalogType = 'person' | 'company' | 'opportunity';

/** Єдиний формат картки каталогу — люди, компанії й можливості в одному списку. */
export interface CatalogItem {
  type: CatalogType;
  id: number;
  title: string;
  subtitle: string;
  description: string;
  city: string;
  sector: string;
  tags: string[];
  isFop?: boolean;
  createdAt: Date;
}

export const OPPORTUNITY_KIND_LABEL: Record<string, string> = {
  vacancy: 'Вакансія',
  contract: 'Підряд',
  request: 'Бізнес-запит',
};

const WORK_FORMAT_LABEL: Record<string, string> = {
  office: 'Офіс',
  remote: 'Віддалено',
  hybrid: 'Гібрид',
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly users: UsersService,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Opportunity) private readonly opportunities: Repository<Opportunity>,
  ) {}

  async list(type?: CatalogType): Promise<CatalogItem[]> {
    const [people, companies, opportunities] = await Promise.all([
      !type || type === 'person' ? this.users.findAll() : [],
      !type || type === 'company' ? this.companies.find() : [],
      !type || type === 'opportunity' ? this.opportunities.find() : [],
    ]);

    return [
      ...people.map(personToItem),
      ...companies.map(companyToItem),
      ...opportunities.map(opportunityToItem),
    ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async counts() {
    const [person, company, opportunity, fop] = await Promise.all([
      this.users.findAll().then((r) => r.length),
      this.companies.count(),
      this.opportunities.count(),
      this.users.findFops().then((r) => r.length),
    ]);
    return { all: person + company + opportunity, person, company, opportunity, fop };
  }

  /** Список ФОП — окремим списком. */
  async fops() {
    const fops = await this.users.findFops();
    return fops.map((u) => ({
      id: u.id,
      name: u.name,
      city: u.city,
      role: u.role,
      sector: u.sector,
      fopGroup: u.fopGroup,
      fopActivity: u.fopActivity,
      skills: u.skills,
    }));
  }

  async company(id: number) {
    const c = await this.companies.findOne({ where: { id }, relations: { opportunities: true } });
    if (!c) throw new NotFoundException('Компанію не знайдено');
    return c;
  }

  async opportunity(id: number) {
    const o = await this.opportunities.findOne({ where: { id } });
    if (!o) throw new NotFoundException('Можливість не знайдено');
    return { ...o, kindLabel: OPPORTUNITY_KIND_LABEL[o.kind] ?? o.kind };
  }
}

function personToItem(u: User): CatalogItem {
  return {
    type: 'person',
    id: u.id,
    title: u.name,
    subtitle: u.role || 'Учасник мережі',
    description: u.bio,
    city: u.city,
    sector: u.sector,
    tags: u.skills.slice(0, 5),
    isFop: u.isFop,
    createdAt: u.createdAt,
  };
}

function companyToItem(c: Company): CatalogItem {
  return {
    type: 'company',
    id: c.id,
    title: c.name,
    subtitle: c.sector || 'Компанія',
    description: c.description,
    city: c.city,
    sector: c.sector,
    tags: c.offers ? c.offers.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4) : [],
    createdAt: c.createdAt,
  };
}

function opportunityToItem(o: Opportunity): CatalogItem {
  return {
    type: 'opportunity',
    id: o.id,
    title: o.title,
    subtitle: [OPPORTUNITY_KIND_LABEL[o.kind], o.company?.name].filter(Boolean).join(' · '),
    description: o.description,
    city: o.city,
    sector: o.sector,
    tags: [OPPORTUNITY_KIND_LABEL[o.kind], WORK_FORMAT_LABEL[o.workFormat]].filter(Boolean) as string[],
    createdAt: o.createdAt,
  };
}
