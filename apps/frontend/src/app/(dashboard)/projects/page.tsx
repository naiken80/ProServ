import {
  AlertTriangle,
  CalendarRange,
  Clock,
  ClipboardList,
  Layers3,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';

import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { fetchProjectSummaries } from '../../../lib/api/projects';
import { formatCurrency, formatDate, formatPercent } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';
import { ProjectsResults } from './_components/projects-results';
import { statusOptions, statusTone, type PipelineStatus } from './constants';

type SearchParamCollection = Record<string, string | string[] | undefined>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamCollection>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const statusParam = resolvedSearchParams.status;
  const statusFilter = statusOptions.some((option) => option.value === statusParam)
    ? (statusParam as PipelineStatus)
    : undefined;

  const searchTerm = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q.trim() : '';
  const pageParam = resolvedSearchParams.page;
  const parsedPage =
    typeof pageParam === 'string' ? Number.parseInt(pageParam, 10) : undefined;
  const page = Number.isFinite(parsedPage) && parsedPage! > 0 ? parsedPage! : 1;

  const pageSizeParam = resolvedSearchParams.pageSize;
  const parsedPageSize =
    typeof pageSizeParam === 'string' ? Number.parseInt(pageSizeParam, 10) : undefined;
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize! > 0
      ? Math.min(Math.max(parsedPageSize!, 1), 50)
      : 6;

  const { data, meta, counts, lastUpdated } = await fetchProjectSummaries({
    search: searchTerm,
    status: statusFilter,
    page,
    pageSize,
  });

  const currentProjects = data;
  const statusCounts = counts;
  const hasFilters = Boolean(statusFilter || searchTerm);
  const totalActive = Object.values(statusCounts).reduce((total, count) => total + count, 0);
  const totalItems = meta.totalItems;
  const searchScopedTotal = meta.totalMatchingSearch ?? totalActive;
  const overallTotal = meta.totalAll ?? totalActive;
  const denominator = searchTerm ? searchScopedTotal : overallTotal || totalActive;

  const averageMargin = currentProjects.length
    ? currentProjects.reduce((sum, project) => sum + project.margin, 0) / currentProjects.length
    : 0;

  const lastUpdatedFallback = currentProjects.reduce<string | undefined>((latest, project) => {
    if (!latest) return project.updatedAt;
    return new Date(project.updatedAt) > new Date(latest) ? project.updatedAt : latest;
  }, undefined);

  const lastSyncedAt = lastUpdated ?? lastUpdatedFallback ?? null;

  const topDeal = currentProjects.reduce<
    (typeof currentProjects)[number] | undefined
  >((currentTop, project) => {
    if (!currentTop) return project;
    return project.totalValue > currentTop.totalValue ? project : currentTop;
  }, undefined);

  const nextKickoffProject = currentProjects.reduce<
    (typeof currentProjects)[number] | undefined
  >((current, project) => {
    if (!project.startDate) return current;
    if (!current) return project;
    return new Date(project.startDate) < new Date(current.startDate) ? project : current;
  }, undefined);

  const formattedAverageMargin = currentProjects.length ? formatPercent(averageMargin) : '—';
  const nextKickoffDate = nextKickoffProject ? formatDate(nextKickoffProject.startDate) : 'Awaiting schedule';
  const nextKickoffDetails = nextKickoffProject
    ? `Client · ${nextKickoffProject.client}`
    : 'Add a new estimate to set your next kickoff.';
  const reviewCount = statusCounts.estimating ?? 0;
  const inFlightCount = statusCounts['in-flight'] ?? 0;
  const planningCount = statusCounts.planning ?? 0;
  const resultsLabel = hasFilters
    ? `${totalItems} of ${denominator || totalItems} results`
    : `${totalItems} results`;
  const lastUpdatedDisplay = lastSyncedAt ? formatDate(lastSyncedAt) : 'Awaiting updates';

  return (
    <DashboardShell className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-8 shadow-lg md:p-12">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="absolute bottom-[-6rem] right-[-6rem] h-80 w-80 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Badge variant="ghost" className="w-fit bg-primary/20 text-primary">
              Engagement pipeline
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Move every proposal forward with clarity.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Keep revenue teams aligned on scope, staffing readiness, and risk signals before estimates go out the door. Blend human oversight with AI guardrails to commit to delivery with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/projects/create">
                  <PlusCircle className="h-5 w-5" aria-hidden />
                  Create estimate
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-background/70 backdrop-blur">
                <CalendarRange className="h-5 w-5" aria-hidden />
                Schedule review
              </Button>
              <Button variant="ghost" size="lg" className="bg-background/70 backdrop-blur">
                <Target className="h-5 w-5" aria-hidden />
                Margin playbook
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/15 bg-background/80 p-6 shadow-lg backdrop-blur">
              <p className="text-xs uppercase text-muted-foreground">Top opportunity</p>
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-lg font-semibold text-foreground">
                  {topDeal ? topDeal.name : 'All caught up'}
                </p>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Client</span>
                  <span className="font-medium text-foreground">
                    {topDeal ? topDeal.client : 'Add a new estimate'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Value</span>
                  <span className="font-semibold text-foreground">
                    {topDeal ? formatCurrency(topDeal.totalValue, topDeal.currency) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Margin target</span>
                  <span className="font-semibold text-success">
                    {topDeal ? formatPercent(topDeal.margin) : '—'}
                  </span>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="mt-4 w-full justify-center bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Link href={topDeal ? `/projects/${topDeal.id}` : '/projects/create'}>
                  {topDeal ? 'Open workspace' : 'Start your next deal'}
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/70 p-6 shadow-lg backdrop-blur">
              <p className="text-xs uppercase text-muted-foreground">This week&apos;s focus</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Review margin guardrails for proposals in estimating.</li>
                <li>Confirm delivery availability for upcoming kickoffs.</li>
                <li>Refresh anomaly monitor insights before executive review.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active proposals</CardTitle>
            <Layers3 className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {totalItems}
              {hasFilters ? (
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {denominator || totalItems}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasFilters ? 'Filtered view from the workspace.' : 'Across the live portfolio.'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average margin target</CardTitle>
            <Target className="h-4 w-4 text-success" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formattedAverageMargin}</div>
            <p className="mt-1 text-xs text-muted-foreground">Healthy portfolios stay above 28%.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next kickoff scheduled</CardTitle>
            <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{nextKickoffDate}</div>
            <p className="mt-1 text-xs text-muted-foreground">{nextKickoffDetails}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces in delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{inFlightCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {planningCount} in planning · {reviewCount} in estimating
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProjectsResults
            projects={currentProjects}
            statusCounts={statusCounts}
            statusFilter={statusFilter}
            searchTerm={searchTerm}
            hasFilters={hasFilters}
            resultsLabel={resultsLabel}
            meta={meta}
            lastUpdatedLabel={lastUpdatedDisplay}
          />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <Card className="overflow-hidden border-border/60 bg-card/70 shadow-lg">
            <CardHeader>
              <CardTitle>Pipeline breakdown</CardTitle>
              <CardDescription>Balance demand across planning, estimating, and delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              {statusOptions.map((option) => {
                const count = statusCounts[option.value];
                const percentage = totalActive ? Math.round((count / totalActive) * 100) : 0;
                const tone = statusTone[option.value];
                return (
                  <div key={option.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-foreground">
                        <span className={cn('h-2.5 w-2.5 rounded-full', tone.dot)} aria-hidden />
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} · {percentage}%
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('absolute inset-y-0 left-0 rounded-full', tone.bar)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
            <CardHeader>
              <CardTitle>Forecast at a glance</CardTitle>
              <CardDescription>
                Rolling 120-day view of revenue, capacity, and margin guardrails.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-56 overflow-hidden rounded-2xl border border-dashed border-border/60 bg-background/70">
              <Skeleton className="absolute inset-4 rounded-2xl" aria-hidden />
              <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
                Interactive chart arriving soon
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 shadow-lg">
            <CardHeader>
              <CardTitle>Workspace alerts</CardTitle>
              <CardDescription>Signals surfaced by anomaly detection and staffing monitors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/15 p-4 text-warning-foreground shadow-inner">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                <p>Architect allocation exceeds 95% across three weeks in Global ERP version 2.1.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/15 p-4 text-accent-foreground shadow-inner">
                <RefreshCw className="h-5 w-5 shrink-0" aria-hidden />
                <p>FX snapshot aged 14 days for APAC Digital Launchpad. Refresh recommended.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/15 p-4 text-success-foreground shadow-inner">
                <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
                <p>Scenario optimizer identified £185k margin lift in Field Service AI Assistant.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 shadow-lg">
            <CardHeader>
              <CardTitle>Playbook shortcuts</CardTitle>
              <CardDescription>Use accelerators to keep proposals audit-ready.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">Margin review template</p>
                  <p>Share a one-page checklist with delivery and finance leads.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">Risk guardrail library</p>
                  <p>Pre-baked controls for regulated industries and critical workloads.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">AI proposal co-pilot</p>
                  <p>Generate staffing plans, dependencies, and scope notes with one prompt.</p>
                </div>
              </div>
              <Button asChild variant="secondary" size="sm" className="w-full justify-center">
                <Link href="/insights">Explore playbooks</Link>
              </Button>
            </CardContent>
          </Card>

          {topDeal ? (
            <Card className="border-border/60 bg-primary/5 shadow-lg">
              <CardHeader>
                <CardTitle>Deal spotlight</CardTitle>
                <CardDescription>Largest opportunity in your current view.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-base font-semibold text-foreground">{topDeal.name}</p>
                <p className="text-muted-foreground">
                  {topDeal.client} · {formatCurrency(topDeal.totalValue, topDeal.currency)}
                </p>
                <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
                  Keep momentum: align pricing review and stakeholder approvals before{' '}
                  {formatDate(topDeal.startDate)}.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </section>
    </DashboardShell>
  );
}
