import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim) @IsEmail({}, { message: 'Вкажіть коректний email' })
  email: string;

  @IsString() @MinLength(6, { message: 'Пароль має містити щонайменше 6 символів' }) @MaxLength(72)
  password: string;

  @Transform(trim) @IsString() @MinLength(2, { message: "Вкажіть ім'я (щонайменше 2 символи)" }) @MaxLength(80)
  name: string;
}

export class LoginDto {
  @Transform(trim) @IsEmail({}, { message: 'Вкажіть коректний email' })
  email: string;

  @IsString() @MinLength(1, { message: 'Вкажіть пароль' })
  password: string;
}
