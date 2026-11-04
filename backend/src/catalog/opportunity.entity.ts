import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from './company.entity';

export type OpportunityKind = 'vacancy' | 'contract' | 'request';

/**
 * Можливість: вакансія, підряд або бізнес-запит. Створення можливостей — модуль Yaroslav;
 * тут сутність потрібна для відображення в каталозі.
 */
@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  kind: OpportunityKind;

  @Column({ default: '' })
  sector: string;

  @Column({ default: '' })
  city: string;

  @Column({ type: 'varchar', default: 'remote' })
  workFormat: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @ManyToOne(() => Company, (c) => c.opportunities, { nullable: true, eager: true, onDelete: 'SET NULL' })
  company: Company | null;

  @CreateDateColumn()
  createdAt: Date;
}
