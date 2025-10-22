import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  Clock,
  ClipboardList,
  DollarSign,
  Filter,
  Layers3,
  PlusCircle,
  RefreshCw,
  Search,
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

type ProjectStatus = Awaited<ReturnType<typeof fetchProjectSummaries>>[number]['status'];

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'estimating', label: 'Estimating' },
  { value: 'in-flight', label: 'In flight' },
];

const statusTone: Record<ProjectStatus, { dot: string; bar: string }> = {
  planning: { dot: 'bg-primary', bar: 'bg-primary/50' },
  estimating: { dot: 'bg-warning', bar: 'bg-warning/60' },
  'in-flight': { dot: 'bg-success', bar: 'bg-success/60' },
};

function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const map: Record<
    ProjectStatus,
    {
      label: string;
      variant: 'default' | 'outline' | 'warning' | 'success' | 'ghost';
      className?: string;
    }
  > = {
    planning: { label: 'Planning', variant: 'ghost', className: 'bg-primary/10 text-primary' },
    estimating: {
      label: 'Estimating',
      variant: 'warning',
      className: 'bg-warning/20 text-warning-foreground',
    },
    'in-flight': {
      label: 'In flight',
      variant: 'success',
      className: 'bg-success/20 text-success-foreground',
    },
  };

  const { label, variant, className: badgeClass } = map[status];
  return (
    <Badge
      variant={variant}
      className={cn(
        'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm',
        badgeClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}

type SearchParamCollection = Record<string, string | string[] | undefined>;

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamCollection>;
}) {
  const projectSummaries = await fetchProjectSummaries();

  const resolvedSearchParams = (await searchParams) ?? {};

  const statusParam = resolvedSearchParams.status;
  const statusFilter = statusOptions.some((option) => option.value === statusParam)
    ? (statusParam as ProjectStatus)
    : undefined;

  const searchTerm = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q.trim() : '';
  const normalizedSearch = searchTerm.toLowerCase();

  const visibleProjects = projectSummaries.filter((project) => {
    const matchesStatus = statusFilter ? project.status === statusFilter : true;
    const matchesSearch = normalizedSearch
      ? `${project.name} ${project.client} ${project.owner}`.toLowerCase().includes(normalizedSearch)
      : true;
    return matchesStatus && matchesSearch;
  });

  const statusCounts = projectSummaries.reduce<Record<ProjectStatus, number>>(
    (acc, project) => {
      acc[project.status] += 1;
      return acc;
    },
    { planning: 0, estimating: 0, 'in-flight': 0 },
  );

  const totalActive = projectSummaries.length;

  const averageMargin = visibleProjects.length
    ? visibleProjects.reduce((sum, project) => sum + project.margin, 0) / visibleProjects.length
    : 0;

  const lastUpdated = visibleProjects.reduce<string | undefined>((latest, project) => {
    if (!latest) return project.updatedAt;
    return new Date(project.updatedAt) > new Date(latest) ? project.updatedAt : latest;
  }, undefined);

  const topDeal = visibleProjects.reduce<
    (typeof visibleProjects)[number] | undefined
  >((currentTop, project) => {
    if (!currentTop) return project;
    return project.totalValue > currentTop.totalValue ? project : currentTop;
  }, undefined);

  const nextKickoffProject = visibleProjects.reduce<
    (typeof visibleProjects)[number] | undefined
  >((current, project) => {
    if (!project.startDate) return current;
    if (!current) return project;
    return new Date(project.startDate) < new Date(current.startDate) ? project : current;
  }, undefined);

  const hasFilters = Boolean(statusFilter || searchTerm);

  function buildHref(nextStatus?: ProjectStatus) {
    const params = new URLSearchParams();
    if (nextStatus) params.set('status', nextStatus);
    if (searchTerm) params.set('q', searchTerm);
    const query = params.toString();
    return query ? `/projects?${query}` : '/projects';
  }

  const formattedAverageMargin = visibleProjects.length ? formatPercent(averageMargin) : '—';
  const nextKickoffDate = nextKickoffProject ? formatDate(nextKickoffProject.startDate) : 'Awaiting schedule';
  const nextKickoffDetails = nextKickoffProject
    ? `Client · ${nextKickoffProject.client}`
    : 'Add a new estimate to set your next kickoff.';
  const reviewCount = statusCounts.estimating;
  const inFlightCount = statusCounts['in-flight'];
  const planningCount = statusCounts.planning;
  const resultsLabel = hasFilters
    ? `${visibleProjects.length} of ${totalActive} results`
    : `${visibleProjects.length} results`;
  const lastUpdatedDisplay = lastUpdated ? formatDate(lastUpdated) : 'Awaiting updates';

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
              {visibleProjects.length}
              {hasFilters ? (
                <span className="ml-1 text-base font-medium text-muted-foreground">/ {totalActive}</span>
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
          <section className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <form className="relative w-full lg:max-w-md" method="get">
                {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
                <Search
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <input
                  aria-label="Search projects"
                  className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                  defaultValue={searchTerm}
                  name="q"
                  placeholder="Search by project, client, or lead"
                  type="search"
                />
              </form>
              <div className="flex flex-wrap items-center gap-2">
                {statusOptions.map((option) => {
                  const isActive = option.value === statusFilter;
                  return (
                    <Link
                      key={option.value}
                      href={isActive ? buildHref(undefined) : buildHref(option.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                        isActive
                          ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                          : 'border-border/80 bg-background/70 text-muted-foreground hover:border-ring hover:text-foreground',
                      )}
                    >
                      <span>{option.label}</span>
                      <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-semibold leading-none text-foreground">
                        {statusCounts[option.value]}
                      </span>
                    </Link>
                  );
                })}
                {hasFilters ? (
                  <Link
                    href="/projects"
                    className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted/30 px-3 py-1 font-medium text-muted-foreground">
                {resultsLabel}
              </span>
              <span>Last synced {lastUpdatedDisplay}</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline">Use filters to focus on ready-to-submit work.</span>
            </div>
          </section>

          <div className="grid gap-6">
            {visibleProjects.map((project) => (
              <article
                key={project.id}
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-background to-background p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-8"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 right-[-10%] w-1/3 bg-gradient-to-l from-primary/20 via-transparent to-transparent blur-3xl"
                  aria-hidden
                />
                <header className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <StatusBadge
                        status={project.status}
                        className="bg-transparent px-3 py-1.5 text-xs"
                      />
                      <span>Client · {project.client}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{project.name}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {getInitials(project.owner)}
                      </div>
                      <div className="leading-tight text-sm">
                        <p className="font-medium text-foreground">{project.owner}</p>
                        <p className="text-muted-foreground">Engagement lead</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" className="shadow-sm">
                      <Link href={`/projects/${project.id}`}>
                        Open workspace
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="shadow-sm">
                      Download brief
                    </Button>
                  </div>
                </header>

                <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                      <p className="text-xs uppercase text-muted-foreground">Estimated value</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {formatCurrency(project.totalValue, project.currency)}
                      </p>
                      <span className="text-xs text-muted-foreground">Local currency</span>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                      <p className="text-xs uppercase text-muted-foreground">Margin target</p>
                      <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-success">
                        {formatPercent(project.margin)}
                      </p>
                      <span className="text-xs text-muted-foreground">Guardrail aligned</span>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                      <p className="text-xs uppercase text-muted-foreground">Delivery window</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {formatDate(project.startDate)}
                        {project.endDate ? ` – ${formatDate(project.endDate)}` : ' · TBD'}
                      </p>
                      <span className="text-xs text-muted-foreground">Ready for scheduling</span>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                      <p className="text-sm font-semibold text-foreground">Latest signals</p>
                      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <li className="relative pl-5 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:-translate-x-1/2 before:rounded-full before:bg-success">
                          Rate cards refreshed {formatDate(project.updatedAt)}
                        </li>
                        <li className="relative pl-5 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:-translate-x-1/2 before:rounded-full before:bg-accent">
                          Scenario optimizer ready for run
                        </li>
                        <li className="relative pl-5 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:-translate-x-1/2 before:rounded-full before:bg-warning">
                          Staffing planner flagged backfill needs
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5">
                      <p className="text-sm font-semibold text-foreground">Next steps</p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li>Share pricing pack with executive sponsor.</li>
                        <li>Lock week 6 architect availability.</li>
                        <li>Publish delivery readiness summary.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <footer className="relative z-10 mt-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" aria-hidden />
                    <span>Financials refreshed {formatDate(project.updatedAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {project.currency}
                    </span>
                    <span>
                      {project.status === 'in-flight'
                        ? 'Delivery underway'
                        : 'Pre-submission checks in progress'}
                    </span>
                  </div>
                </footer>
              </article>
            ))}

            {!visibleProjects.length ? (
              <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/20 text-center shadow-sm">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Search className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No projects match your filters yet</p>
                    <p className="text-xs text-muted-foreground">
                      Try a different status or search term, or start a fresh estimate.
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/projects/create">Create estimate</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="relative overflow-hidden rounded-3xl border border-dashed border-primary/40 bg-primary/5 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" aria-hidden />
              <CardContent className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Need another workspace?</p>
                  <p className="text-xs text-muted-foreground">
                    Pull in a prior SOW, import from CRM, or let AI draft a net-new estimate in minutes.
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary" className="shadow-sm">
                  <Link href="/projects/create">
                    Launch workspace
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
