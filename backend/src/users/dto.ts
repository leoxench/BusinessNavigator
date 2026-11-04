import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80)
  name?: string;

  @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @IsOptional() @IsString() @MaxLength(80)
  role?: string;

  @IsOptional() @IsString() @MaxLength(80)
  sector?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true })
  skills?: string[];

  @IsOptional() @IsString() @MaxLength(1000)
  bio?: string;

  @IsOptional() @IsIn(['office', 'remote', 'hybrid'])
  workFormat?: 'office' | 'remote' | 'hybrid';

  @IsOptional() @IsBoolean()
  isFop?: boolean;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) @Max(3)
  fopGroup?: number | null;

  @IsOptional() @IsString() @MaxLength(160)
  fopActivity?: string;
}
