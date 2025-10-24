import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const codePattern = /^[A-Z0-9_-]+$/;

export class CreateRoleDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase().slice(0, 20) || undefined
      : undefined,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(codePattern, {
    message:
      'Code may include uppercase letters, numbers, underscores, or hyphens',
  })
  code!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ') || undefined
      : undefined,
  )
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}

