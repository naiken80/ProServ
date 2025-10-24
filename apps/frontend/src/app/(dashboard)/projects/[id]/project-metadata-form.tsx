'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { RateCard } from '@proserv/shared';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import type { ProjectSummary } from '@/frontend/lib/api/projects';
import { updateProject, type UpdateProjectPayload } from '@/frontend/lib/client/projects';
import { listRateCards } from '@/frontend/lib/client/rate-cards';
import { useSession } from '@/frontend/lib/session-context';
import { formatDate } from '@/frontend/lib/formatters';

const billingModelValues = [
  'TIME_AND_MATERIAL',
  'FIXED_PRICE',
  'RETAINER',
  'MANAGED_SERVICE',
] as const;

const billingModels = [
  { value: 'TIME_AND_MATERIAL', label: 'Time & material' },
  { value: 'FIXED_PRICE', label: 'Fixed price' },
  { value: 'RETAINER', label: 'Retainer' },
  { value: 'MANAGED_SERVICE', label: 'Managed service' },
] as const;

const metadataSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(140),
  clientName: z.string().min(1, 'Client name is required').max(140),
  baseCurrency: z
    .string()
    .min(3, 'Use a 3-character ISO code')
    .max(3, 'Use a 3-character ISO code'),
  billingModel: z.enum(billingModelValues),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  baselineVersionName: z.string().min(1).max(120),
  baselineRateCardId: z.string().optional(),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

type ProjectMetadataFormProps = {
  projectId: string;
  summary: ProjectSummary;
  baselineName: string;
  baselineRateCardId: string | null;
  onProjectUpdated: (
    summary: ProjectSummary,
    updates?: {
      baselineName?: string;
      rateCard?: {
        id: string | null;
        name?: string | null;
        details?: RateCard | null;
      };
    },
  ) => void;
};

export function ProjectMetadataForm({
  projectId,
  summary,
  baselineName,
  baselineRateCardId,
  onProjectUpdated,
}: ProjectMetadataFormProps) {
  const session = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const {
    data: rateCardsData,
    isLoading: rateCardsLoading,
    error: rateCardsError,
  } = useQuery({
    queryKey: ['rate-cards', session.id],
    queryFn: () => listRateCards(session),
  });
  const rateCards = rateCardsData?.data ?? [];
  const rateCardsErrorMessage =
    rateCardsError instanceof Error ? rateCardsError.message : null;

  const defaultValues = useMemo<MetadataFormValues>(
    () => ({
      name: summary.name,
      clientName: summary.client,
      baseCurrency: summary.currency,
      billingModel: summary.billingModel,
      startDate: summary.startDate ?? '',
      endDate: summary.endDate ?? '',
      baselineVersionName: baselineName || 'Baseline',
      baselineRateCardId: baselineRateCardId ?? '',
    }),
    [summary, baselineName, baselineRateCardId],
  );

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);
    const payload: Partial<UpdateProjectPayload> = {};

    if (values.name.trim() !== summary.name) {
      payload.name = values.name.trim();
    }

    if (values.clientName.trim() !== summary.client) {
      payload.clientName = values.clientName.trim();
    }

    const currencyUpper = values.baseCurrency.toUpperCase();
    if (currencyUpper !== summary.currency) {
      payload.baseCurrency = currencyUpper;
    }

    if (values.billingModel !== summary.billingModel) {
      payload.billingModel = values.billingModel;
    }

    if (values.startDate !== summary.startDate) {
      payload.startDate = values.startDate;
    }

    const normalizedEndDate = values.endDate?.trim() ?? '';
    const existingEndDate = summary.endDate ?? '';
    if (normalizedEndDate !== existingEndDate) {
      payload.endDate = normalizedEndDate.length > 0 ? normalizedEndDate : null;
    }

    if (values.baselineVersionName.trim() !== baselineName) {
      payload.baselineVersionName = values.baselineVersionName.trim();
    }

    const selectedRateCardIdRaw = values.baselineRateCardId ?? '';
    const selectedRateCardId = selectedRateCardIdRaw.trim();
    const existingRateCardId = baselineRateCardId ?? '';
    if (selectedRateCardId !== existingRateCardId) {
      payload.baselineRateCardId =
        selectedRateCardId.length > 0 ? selectedRateCardId : null;
    }

    if (Object.keys(payload).length === 0) {
      setError('Update at least one field before saving.');
      return;
    }

    startTransition(() => {
      updateProject(session, projectId, payload)
        .then((updatedSummary) => {
          const updates: {
            baselineName?: string;
            rateCard?: {
              id: string | null;
              name?: string | null;
              details?: RateCard | null;
            };
          } = {};

          if (payload.baselineVersionName) {
            updates.baselineName = payload.baselineVersionName;
          }

          if (payload.baselineRateCardId !== undefined) {
            const nextCard =
              payload.baselineRateCardId === null
                ? null
                : rateCards.find(
                    (card) => card.id === payload.baselineRateCardId,
                  ) ?? null;
            updates.rateCard = {
              id: payload.baselineRateCardId,
              name: nextCard?.name ?? null,
              details: nextCard,
            };
          }

          onProjectUpdated(
            updatedSummary,
            Object.keys(updates).length > 0 ? updates : undefined,
          );
          setLastSavedAt(updatedSummary.updatedAt);
          router.refresh();
        })
        .catch((updateError: unknown) => {
          setError(
            updateError instanceof Error
              ? updateError.message
              : 'Unable to save changes. Please try again.',
          );
        });
    });
  });

  const saving = form.formState.isSubmitting || isPending;

  return (
    <Card className="rounded-3xl border border-border/70 bg-card/60 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle>Engagement settings</CardTitle>
        <CardDescription>
          Fine-tune client basics and baseline naming so downstream automations stay aligned.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Project name</span>
              <input
                {...form.register('name')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.name ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Client</span>
              <input
                {...form.register('clientName')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.clientName ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.clientName.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Kickoff</span>
              <input
                type="date"
                {...form.register('startDate')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.startDate ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.startDate.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Target wrap date</span>
              <input
                type="date"
                {...form.register('endDate')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Billing model</span>
              <select
                {...form.register('billingModel')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              >
                {billingModels.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Currency</span>
              <input
                {...form.register('baseCurrency', {
                  setValueAs: (value) =>
                    typeof value === 'string' ? value.toUpperCase() : value,
                })}
                maxLength={3}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.baseCurrency ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.baseCurrency.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              <span className="font-medium text-foreground">Baseline label</span>
              <input
                {...form.register('baselineVersionName')}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.baselineVersionName ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.baselineVersionName.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              <span className="font-medium text-foreground">Rate card</span>
              <select
                {...form.register('baselineRateCardId')}
                disabled={rateCardsLoading}
                className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              >
                <option value="">Not assigned</option>
                {rateCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} · {card.currency}
                  </option>
                ))}
              </select>
              {rateCardsErrorMessage ? (
                <span className="text-xs text-destructive">{rateCardsErrorMessage}</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Manage rate cards in the{' '}
                  <Link href="/resources" className="text-foreground underline">
                    resources hub
                  </Link>
                  .
                </span>
              )}
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {lastSavedAt ? (
              <Badge variant="outline" className="w-fit">
                Saved {formatDate(lastSavedAt)}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                Update baseline naming or key dates without losing context.
              </span>
            )}
            <Button type="submit" disabled={saving} className="gap-2 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
