import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Company } from '../catalog/company.entity';
import { Opportunity } from '../catalog/opportunity.entity';
import { User } from '../users/user.entity';

/** Пароль усіх демо-акаунтів (лише для локальної розробки). */
export const DEMO_PASSWORD = 'demo1234';

type SeedUser = Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'>;

const people: SeedUser[] = [
  {
    email: 'olena@demo.bn', name: 'Олена Коваль', city: 'Київ', role: 'UI/UX дизайнер', sector: 'IT',
    skills: ['Figma', 'UX research', 'Дизайн-системи', 'Прототипування'],
    bio: 'Проєктую інтерфейси для B2B-сервісів. Шукаю довгострокові проєкти з продуктовими командами.',
    workFormat: 'remote', isFop: true, fopGroup: 3, fopActivity: '74.10 Спеціалізована діяльність із дизайну',
  },
  {
    email: 'andriy@demo.bn', name: 'Андрій Мельник', city: 'Львів', role: 'Бухгалтер', sector: 'Фінанси',
    skills: ['Облік ФОП', 'Податкова звітність', 'M.E.Doc', '1С'],
    bio: 'Веду бухгалтерію ФОП та малих ТОВ. Допомагаю з відкриттям і переходом між групами.',
    workFormat: 'hybrid', isFop: true, fopGroup: 2, fopActivity: '69.20 Діяльність у сфері бухгалтерського обліку',
  },
  {
    email: 'iryna@demo.bn', name: 'Ірина Бондар', city: 'Київ', role: 'Інвестор', sector: 'Інвестиції',
    skills: ['Venture', 'Due diligence', 'SaaS', 'Менторство'],
    bio: 'Інвестую на ранніх стадіях у B2B SaaS та агротех. Відкрита до знайомств із фаундерами.',
    workFormat: 'hybrid', isFop: false, fopGroup: null, fopActivity: '',
  },
  {
    email: 'taras@demo.bn', name: 'Тарас Шевчук', city: 'Одеса', role: 'Маркетолог', sector: 'Маркетинг',
    skills: ['Performance', 'Google Ads', 'Meta Ads', 'Аналітика'],
    bio: 'Запускаю платну рекламу для e-commerce. Середній ROMI клієнтів — 280%.',
    workFormat: 'remote', isFop: true, fopGroup: 3, fopActivity: '73.11 Рекламні агентства',
  },
  {
    email: 'oksana@demo.bn', name: 'Оксана Ткач', city: 'Дніпро', role: 'Рекрутер', sector: 'HR',
    skills: ['IT-рекрутинг', 'Executive search', 'Співбесіди'],
    bio: 'Закриваю вакансії в IT та виробництві. Працюю з компаніями від 10 до 500 людей.',
    workFormat: 'remote', isFop: false, fopGroup: null, fopActivity: '',
  },
  {
    email: 'dmytro@demo.bn', name: 'Дмитро Лисенко', city: 'Харків', role: 'Full-stack розробник', sector: 'IT',
    skills: ['React', 'TypeScript', 'NestJS', 'PostgreSQL'],
    bio: 'Розробляю веб-продукти під ключ: від MVP до продакшну.',
    workFormat: 'remote', isFop: true, fopGroup: 3, fopActivity: '62.01 Комп’ютерне програмування',
  },
];

const companies: Array<Omit<Company, 'id' | 'createdAt' | 'opportunities'>> = [
  {
    name: 'AgroLine', sector: 'Агробізнес', city: 'Вінниця', website: 'https://agroline.example',
    description: 'Постачання насіння та засобів захисту рослин для фермерських господарств.',
    offers: 'Дистрибуція, Логістика, Консультації агронома',
  },
  {
    name: 'CloudDesk', sector: 'IT', city: 'Київ', website: 'https://clouddesk.example',
    description: 'SaaS для автоматизації служби підтримки малого та середнього бізнесу.',
    offers: 'SaaS, Інтеграції, Партнерська програма',
  },
  {
    name: 'Буд-Інвест', sector: 'Будівництво', city: 'Львів', website: 'https://bud-invest.example',
    description: 'Будівництво комерційної нерухомості та генпідряд.',
    offers: 'Генпідряд, Проєктування, Технагляд',
  },
  {
    name: 'FreshBox', sector: 'E-commerce', city: 'Одеса', website: 'https://freshbox.example',
    description: 'Онлайн-доставка фермерських продуктів по Україні.',
    offers: 'Доставка, Фулфілмент, Опт',
  },
];

export async function seedIfEmpty(ds: DataSource): Promise<boolean> {
  const usersRepo = ds.getRepository(User);
  if ((await usersRepo.count()) > 0) return false;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await usersRepo.save(people.map((p) => usersRepo.create({ ...p, passwordHash })));

  const companyRepo = ds.getRepository(Company);
  const saved = await companyRepo.save(companies.map((c) => companyRepo.create(c)));
  const byName = Object.fromEntries(saved.map((c) => [c.name, c]));

  const oppRepo = ds.getRepository(Opportunity);
  await oppRepo.save(
    [
      {
        title: 'Frontend-розробник (React)', kind: 'vacancy' as const, sector: 'IT', city: 'Київ', workFormat: 'hybrid',
        description: 'Шукаємо розробника в продуктову команду CloudDesk. React, TypeScript, Tailwind.', company: byName.CloudDesk,
      },
      {
        title: 'Оздоблення складу 1 200 м²', kind: 'contract' as const, sector: 'Будівництво', city: 'Львів', workFormat: 'office',
        description: 'Підряд на внутрішнє оздоблення складського приміщення. Старт — наступного місяця.', company: byName['Буд-Інвест'],
      },
      {
        title: 'Шукаємо постачальника пакування', kind: 'request' as const, sector: 'E-commerce', city: 'Одеса', workFormat: 'remote',
        description: 'Потрібне екологічне пакування для продуктів, обсяг ~10 000 одиниць/міс.', company: byName.FreshBox,
      },
      {
        title: 'Регіональний менеджер з продажу', kind: 'vacancy' as const, sector: 'Агробізнес', city: 'Вінниця', workFormat: 'office',
        description: 'Розвиток мережі дилерів у центральних областях.', company: byName.AgroLine,
      },
    ].map((o) => oppRepo.create(o)),
  );
  return true;
}
