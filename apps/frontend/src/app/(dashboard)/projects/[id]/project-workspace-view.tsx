'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarRange, PenSquare, Sparkles } from 'lucide-react';

import { DashboardShell } from '@/frontend/components/layout/dashboard-shell';
import { Badge } from '@/frontend/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';

import type {
  ProjectSummary,
  ProjectWorkspace,
  ProjectSummariesResponse,
} from '@/frontend/lib/api/projects';
import { formatCurrency, formatDate, formatPercent } from '@/frontend/lib/formatters';

import { ProjectMetadataForm } from './project-metadata-form';

type ProjectBaselineSnapshot = NonNullable<ProjectWorkspace['baseline']>;
type ProjectUpdateOptions = {
  baselineName?: string;
  rateCard?: {
    id: string | null;
    name?: string | null;
    details?: ProjectBaselineSnapshot['rateCard'];
  };
};

export function ProjectWorkspaceView({
  workspace,
}: {
  workspace: ProjectWorkspace;
}) {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<ProjectSummary>(workspace.summary);
  const [baseline, setBaseline] = useState(workspace.baseline);

  useEffect(() => {
    queryClient.setQueryData(['project', workspace.summary.id], workspace);
  }, [queryClient, workspace, workspace.summary.id]);

  const updateCaches = (
    nextSummary: ProjectSummary,
    nextBaseline: ProjectWorkspace['baseline'],
  ) => {
    queryClient.setQueryData<ProjectWorkspace>(
      ['project', nextSummary.id],
      () => ({
        summary: nextSummary,
        baseline: nextBaseline,
      }),
    );

    const projectQueries = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['projects'] });

    for (const query of projectQueries) {
      const data = query.state.data as ProjectSummariesResponse | undefined;
      if (!data) continue;
      const nextData: ProjectSummariesResponse = {
        ...data,
        data: data.data.map((item) =>
          item.id === nextSummary.id ? nextSummary : item,
        ),
      };
      queryClient.setQueryData(query.queryKey, nextData);
    }
  };

  const handleProjectUpdated = (
    nextSummary: ProjectSummary,
    updates?: ProjectUpdateOptions,
  ) => {
    const renamedBaseline = updates?.baselineName
      ? baseline
        ? { ...baseline, name: updates.baselineName }
        : baseline
      : baseline;

    let updatedBaseline = renamedBaseline
      ? { ...renamedBaseline, currency: nextSummary.currency }
      : null;

    if (updatedBaseline && updates?.rateCard) {
      updatedBaseline = {
        ...updatedBaseline,
        rateCardId: updates.rateCard.id ?? null,
        rateCardName: updates.rateCard.name ?? undefined,
        rateCard:
          updates.rateCard.details ??
          (updates.rateCard.id === null
            ? null
            : updatedBaseline.rateCard ?? null),
      };
    }

    setSummary(nextSummary);
    setBaseline(updatedBaseline);
    updateCaches(nextSummary, updatedBaseline);
  };

  const ownerInitials = useMemo(() => {
    return summary.owner
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [summary.owner]);

  const billingModelLabel = useMemo(() => {
    return summary.billingModel
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, [summary.billingModel]);

  return (
    <DashboardShell className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {summary.name}
          </h1>
          <p className="text-sm text-muted-foreground">{summary.client}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Badge variant="outline" className="text-sm uppercase tracking-wide">
            {summary.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Last updated {formatDate(summary.updatedAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-lg">
          <CardHeader>
            <CardTitle>Commercial snapshot</CardTitle>
            <CardDescription>
              High-level metrics to ground scoping, resourcing, and approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Estimated value</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {formatCurrency(summary.totalValue, summary.currency)}
              </p>
              <p className="text-xs text-muted-foreground">Billing model · {billingModelLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Margin outlook</p>
              <p className="mt-1 text-xl font-semibold text-success">
                {formatPercent(summary.margin)}
              </p>
              <p className="text-xs text-muted-foreground">Includes latest staffing assumptions</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Delivery window</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden />
                {formatDate(summary.startDate)}
                {summary.endDate ? ` – ${formatDate(summary.endDate)}` : ' • TBD'}
              </p>
              <p className="text-xs text-muted-foreground">Sync milestones with resource planners</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Engagement lead</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {ownerInitials}
                </span>
                <span className="text-sm font-medium text-foreground">{summary.owner}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProjectMetadataForm
          projectId={summary.id}
          summary={summary}
          baselineName={baseline?.name ?? 'Baseline'}
          baselineRateCardId={baseline?.rateCardId ?? null}
          onProjectUpdated={handleProjectUpdated}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-lg">
          <CardHeader>
            <CardTitle>Baseline estimate details</CardTitle>
            <CardDescription>
              Financial rollup for version 1 to ground approvals and variance monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {baseline ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Baseline label</p>
                    <p className="text-sm font-medium text-foreground">{baseline.name}</p>
                  </div>
                  <Badge variant="outline">{baseline.status.toLowerCase()}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Total value</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCurrency(baseline.totalValue, baseline.currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Delivery cost</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCurrency(baseline.totalCost, baseline.currency)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Margin</p>
                    <p className="mt-1 text-lg font-semibold text-success">
                      {formatPercent(baseline.margin)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Assignments</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {baseline.assignmentCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Linked to active staffing plan</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Rate card</p>
                      <p className="text-sm font-medium text-foreground">
                        {baseline.rateCardName ?? 'Not assigned'}
                      </p>
                    </div>
                    {baseline.rateCard ? (
                      <Badge variant="outline" className="text-xs uppercase">
                        {baseline.rateCard.currency}
                      </Badge>
                    ) : null}
                  </div>
                  {baseline.rateCard ? (
                    <>
                      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {baseline.rateCard.entries.slice(0, 4).map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-3 text-foreground"
                          >
                            <span>{entry.role.name}</span>
                            <span className="text-right text-muted-foreground">
                              {formatCurrency(
                                entry.billRate,
                                baseline.rateCard?.currency ?? summary.currency,
                              )}
                              <span className="text-muted-foreground/80">
                                {' '}
                                ·{' '}
                                {formatCurrency(
                                  entry.costRate,
                                  baseline.rateCard?.currency ?? summary.currency,
                                )}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {baseline.rateCard.entries.length > 4 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          + {baseline.rateCard.entries.length - 4} additional roles
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Assign a rate card to align staffing assumptions with portfolio guardrails.
                    </p>
                  )}
                  <Button asChild size="sm" variant="outline" className="mt-3 w-fit">
                    <Link href="/resources">Manage rate cards</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No baseline established yet</p>
                <p>
                  Create a baseline version in the estimator to unlock financial insights and margin tracking.
                </p>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link href={`/projects/${summary.id}/versions`}>Create baseline</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-lg">
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>
              Automated nudges so the team keeps momentum and catches risk early.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Review staffing optimizer suggestions ahead of the steering committee.</p>
            <p>• Lock FX snapshot before the next rate review.</p>
            <p>• Summarize margin variance against the baseline for leadership.</p>
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <PenSquare className="h-4 w-4" aria-hidden />
              <span>
                Need to make more edits?{' '}
                <Link href={`/projects/${summary.id}/versions`} className="text-foreground underline">
                  Jump to estimate versions
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 shadow-inner">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Ready for the next scenario?
            </p>
            <p className="text-xs text-muted-foreground">
              Spin up a variant to explore alternative staffing, rate cards, or execution models.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary" className="gap-2 shadow-sm">
            <Link href={`/projects/${summary.id}/scenarios`}>
              Launch scenario lab
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
