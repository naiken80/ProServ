import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import type { ProjectSummary } from '@proserv/shared';

export type PipelineStatus = ProjectSummary['status'];

export const pipelineStatuses: PipelineStatus[] = [
  'planning',
  'estimating',
  'in-flight',
];

export class GetProjectSummariesDto {
  @Transform(({ value }) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Transform(({ value }) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return 6;
    }

    const clamped = Math.min(Math.max(parsed, 1), 50);
    return clamped;
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  pageSize = 6;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value : undefined))
  @IsIn(pipelineStatuses)
  @IsOptional()
  status?: PipelineStatus;
}

