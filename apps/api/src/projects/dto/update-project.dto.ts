import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { BillingModel } from '@prisma/client';

export class UpdateProjectDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  @IsOptional()
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  @IsOptional()
  clientName?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase() || undefined
      : undefined,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @IsOptional()
  baseCurrency?: string;

  @IsEnum(BillingModel)
  @IsOptional()
  billingModel?: BillingModel;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @Transform(({ value }) =>
    value === null || value === ''
      ? null
      : typeof value === 'string'
        ? value
        : undefined,
  )
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @IsOptional()
  @MaxLength(120)
  baselineVersionName?: string;

  @Transform(({ value }) =>
    value === null
      ? null
      : typeof value === 'string'
        ? value.trim() || undefined
        : undefined,
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MinLength(1)
  @IsOptional()
  baselineRateCardId?: string | null;
}
