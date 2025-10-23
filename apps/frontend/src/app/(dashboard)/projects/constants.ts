import type { ProjectSummary } from '@proserv/shared';

export type PipelineStatus = ProjectSummary['status'];

export const statusOptions: Array<{ value: PipelineStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'estimating', label: 'Estimating' },
  { value: 'in-flight', label: 'In flight' },
];

export const statusTone: Record<
  PipelineStatus,
  { dot: string; bar: string }
> = {
  planning: { dot: 'bg-primary', bar: 'bg-primary/50' },
  estimating: { dot: 'bg-warning', bar: 'bg-warning/60' },
  'in-flight': { dot: 'bg-success', bar: 'bg-success/60' },
};

export function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

