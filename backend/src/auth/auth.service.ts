import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (await this.users.emailTaken(dto.email)) {
      throw new ConflictException('Користувач з таким email вже існує');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.users.create({ email: dto.email.toLowerCase(), passwordHash, name: dto.name });
    const user = await this.users.findById(created.id);
    return { token: await this.sign(user.id), user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const found = await this.users.findByEmailWithPassword(dto.email);
    if (!found || !(await bcrypt.compare(dto.password, found.passwordHash))) {
      throw new UnauthorizedException('Невірний email або пароль');
    }
    const user = await this.users.findById(found.id);
    return { token: await this.sign(user.id), user };
  }

  private sign(userId: number): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }
}
