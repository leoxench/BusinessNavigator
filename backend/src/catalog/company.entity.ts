import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Opportunity } from './opportunity.entity';

/**
 * Компанія. Повноцінний модуль «Профіль компанії» (створення/редагування) веде Yaroslav;
 * тут — мінімальна сутність, щоб компанії з'являлися в спільному каталозі.
 */
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: '' })
  sector: string;

  @Column({ default: '' })
  city: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: '' })
  website: string;

  /** Що пропонує компанія. */
  @Column({ type: 'text', default: '' })
  offers: string;

  @OneToMany(() => Opportunity, (o) => o.company)
  opportunities: Opportunity[];

  @CreateDateColumn()
  createdAt: Date;
}
