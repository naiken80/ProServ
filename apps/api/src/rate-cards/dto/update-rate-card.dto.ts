import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { RateCardEntryInputDto } from './create-rate-card.dto';

export class UpdateRateCardDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  @IsOptional()
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase() || undefined
      : undefined,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @Transform(({ value }) =>
    value === null || value === ''
      ? undefined
      : typeof value === 'string'
        ? value
        : undefined,
  )
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @Transform(({ value }) =>
    value === null || value === ''
      ? undefined
      : typeof value === 'string'
        ? value
        : undefined,
  )
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateCardEntryInputDto)
  entries?: RateCardEntryInputDto[];
}
