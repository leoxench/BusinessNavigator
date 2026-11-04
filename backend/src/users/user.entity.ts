import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type WorkFormat = 'office' | 'remote' | 'hybrid';

/** Профіль людини (MVP): ім'я, місто, роль, навички, короткий опис + ознака ФОП. */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ default: '' })
  city: string;

  /** Роль / посада: «Дизайнер», «Бухгалтер», «Інвестор»… */
  @Column({ default: '' })
  role: string;

  /** Сфера діяльності: IT, Фінанси, Маркетинг… */
  @Column({ default: '' })
  sector: string;

  @Column({ type: 'simple-json', default: '[]' })
  skills: string[];

  @Column({ type: 'text', default: '' })
  bio: string;

  @Column({ type: 'varchar', default: 'remote' })
  workFormat: WorkFormat;

  /** Чи зареєстрована людина як ФОП (фізична особа-підприємець). */
  @Column({ default: false })
  isFop: boolean;

  /** Група єдиного податку (1–3), якщо ФОП. */
  @Column({ type: 'int', nullable: true })
  fopGroup: number | null;

  /** Основний вид діяльності (КВЕД), якщо ФОП. */
  @Column({ default: '' })
  fopActivity: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
