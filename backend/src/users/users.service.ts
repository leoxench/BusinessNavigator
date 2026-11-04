import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findById(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return user;
  }

  /** Повертає користувача разом із хешем пароля (лише для перевірки входу). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();
  }

  async emailTaken(email: string): Promise<boolean> {
    return (await this.repo.createQueryBuilder('u').where('LOWER(u.email) = LOWER(:email)', { email }).getCount()) > 0;
  }

  create(data: Pick<User, 'email' | 'passwordHash' | 'name'>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.skills) dto.skills = [...new Set(dto.skills.map((s) => s.trim()).filter(Boolean))];
    Object.assign(user, dto);
    if (!user.isFop) {
      user.fopGroup = null;
      user.fopActivity = '';
    }
    await this.repo.save(user);
    return this.findById(id);
  }

  findAll(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findFops(): Promise<User[]> {
    return this.repo.find({ where: { isFop: true }, order: { name: 'ASC' } });
  }
}
