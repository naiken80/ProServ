import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { BillingModel } from '@prisma/client';

export class CreateProjectDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  clientName!: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase() || undefined
      : undefined,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  baseCurrency!: string;

  @IsEnum(BillingModel)
  billingModel!: BillingModel;

  @IsDateString()
  startDate!: string;

  @Transform(({ value }) =>
    value === null || value === ''
      ? undefined
      : typeof value === 'string'
        ? value
        : undefined,
  )
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @IsOptional()
  @MaxLength(120)
  baselineVersionName?: string;
}
