import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
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

export class RateCardEntryInputDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  roleId!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Bill rate must be a number with up to two decimals' },
  )
  @Min(0)
  billRate!: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Cost rate must be a number with up to two decimals' },
  )
  @Min(0)
  costRate!: number;
}

export class CreateRateCardDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase() || undefined
      : undefined,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

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
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RateCardEntryInputDto)
  entries?: RateCardEntryInputDto[];
}
