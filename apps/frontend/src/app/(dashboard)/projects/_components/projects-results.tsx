'use client';

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { ArrowRight, CalendarRange, DollarSign, Search, Sparkles } from 'lucide-react';

import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import type {
  ProjectSummariesResponse,
  ProjectSummary,
} from '@/frontend/lib/api/projects';
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from '@/frontend/lib/formatters';
import { cn } from '@/frontend/lib/utils';

import {
  getInitials,
  statusOptions,
  type PipelineStatus,
} from '../constants';

type ProjectsResultsProps = {
  projects: ProjectSummary[];
  statusCounts: Record<PipelineStatus, number>;
  statusFilter?: PipelineStatus;
  searchTerm: string;
  hasFilters: boolean;
  resultsLabel: string;
  meta: ProjectSummariesResponse['meta'];
  lastUpdatedLabel: string;
};

function StatusBadge({
  status,
  className,
}: {
  status: PipelineStatus;
  className?: string;
}) {
  const map: Record<
    PipelineStatus,
    {
      label: string;
      variant: 'default' | 'outline' | 'warning' | 'success' | 'ghost';
      className?: string;
    }
  > = {
    planning: {
      label: 'Planning',
      variant: 'ghost',
      className: 'bg-primary/10 text-primary',
    },
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
        'pointer-events-none h-fit cursor-default whitespace-nowrap px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm',
        badgeClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}

function ProjectsSkeleton({ count }: { count: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="rounded-3xl border border-border/60 bg-background/70 shadow-lg"
        >
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((__, metricIndex) => (
                <div
                  key={metricIndex}
                  className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-inner"
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-5 w-28" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((__, panelIndex) => (
                <div
                  key={panelIndex}
                  className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-inner"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-2xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProjectsResults({
  projects,
  statusCounts,
  statusFilter,
  searchTerm,
  hasFilters,
  resultsLabel,
  meta,
  lastUpdatedLabel,
}: ProjectsResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchTerm);

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  const totalPages = meta.totalPages;
  const page = meta.page;
  const skeletonCount = useMemo(() => {
    if (projects.length > 0) {
      return projects.length;
    }
    if (meta.pageSize) {
      return Math.max(Math.min(meta.pageSize, 3), 1);
    }
    return 3;
  }, [projects.length, meta.pageSize]);

  const navigateWith = (updater: (params: URLSearchParams) => void) => {
    const existing = searchParams?.toString() ?? '';
    const nextParams = new URLSearchParams(existing);
    updater(nextParams);
    startTransition(() => {
      const target = nextParams.toString();
      router.push(target ? `${pathname}?${target}` : pathname);
    });
  };

  const handleStatusChange = (value?: PipelineStatus) => {
    navigateWith((params) => {
      if (value) {
        params.set('status', value);
      } else {
        params.delete('status');
      }
      params.delete('page');
    });
  };

  const handleClearFilters = () => {
    navigateWith((params) => {
      params.delete('status');
      params.delete('q');
      params.delete('page');
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigateWith((params) => {
      if (trimmed.length > 0) {
        params.set('q', trimmed);
      } else {
        params.delete('q');
      }
      params.delete('page');
    });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) {
      return;
    }

    navigateWith((params) => {
      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }
    });
  };

  const disablePrev = page <= 1 || totalPages === 0;
  const disableNext = totalPages === 0 || page >= totalPages;
  const showEmptyState = projects.length === 0;
  const EmptyStateIcon = hasFilters ? Search : Sparkles;
  const emptyStateTitle = hasFilters
    ? 'No projects match your filters yet'
    : 'Get started by creating your first estimate';
  const emptyStateDescription = hasFilters
    ? 'Try a different status or search term, or start a fresh estimate.'
    : 'Create an estimate to light up your dashboards with live metrics.';

  return (
    <section className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="relative w-full lg:max-w-md" onSubmit={handleSubmit}>
            {statusFilter ? (
              <input type="hidden" name="status" value={statusFilter} />
            ) : null}
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <input
              aria-label="Search projects"
              className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              name="q"
              placeholder="Search by project, client, or lead"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((option) => {
              const isActive = option.value === statusFilter;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleStatusChange(isActive ? undefined : option.value)
                  }
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                    isActive
                      ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/80 bg-background/70 text-muted-foreground hover:border-ring hover:text-foreground',
                  )}
                  aria-pressed={isActive}
                  disabled={isPending}
                >
                  <span>{option.label}</span>
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-semibold leading-none text-foreground">
                    {statusCounts[option.value] ?? 0}
                  </span>
                </button>
              );
            })}
            {hasFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted/30 px-3 py-1 font-medium text-muted-foreground">
            {resultsLabel}
          </span>
          <span>Last synced {lastUpdatedLabel}</span>
          <span className="hidden md:inline">·</span>
           <span className="hidden md:inline">
            Use filters to focus on ready-to-submit work.
          </span>
        </div>
      </section>

      <div className="relative">
        <div
          className={cn(
            'grid gap-6',
            isPending ? 'pointer-events-none opacity-40' : '',
          )}
        >
          {projects.map((project) => (
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
                  <h2 className="text-2xl font-semibold text-foreground">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {getInitials(project.owner)}
                    </div>
                    <div className="leading-tight text-sm">
                      <p className="font-medium text-foreground">
                        {project.owner}
                      </p>
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
                    <p className="text-xs uppercase text-muted-foreground">
                      Estimated value
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCurrency(project.totalValue, project.currency)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Local currency
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                    <p className="text-xs uppercase text-muted-foreground">
                      Margin target
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-success">
                      {formatPercent(project.margin)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Guardrail aligned
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                    <p className="text-xs uppercase text-muted-foreground">
                      Delivery window
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarRange
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden
                      />
                      {formatDate(project.startDate)}
                      {project.endDate
                        ? ` – ${formatDate(project.endDate)}`
                        : ' · TBD'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Ready for scheduling
                    </span>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner">
                    <p className="text-sm font-semibold text-foreground">
                      Latest signals
                    </p>
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
                    <p className="text-sm font-semibold text-foreground">
                      Next steps
                    </p>
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
                  <span>
                    Financials refreshed {formatDate(project.updatedAt)}
                  </span>
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

          {showEmptyState ? (
            <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/20 text-center shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <EmptyStateIcon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {emptyStateTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emptyStateDescription}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/projects/create">Create estimate</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="relative overflow-hidden rounded-3xl border border-dashed border-primary/40 bg-primary/5 shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
              aria-hidden
            />
            <CardContent className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Need another workspace?
                </p>
                <p className="text-xs text-muted-foreground">
                  Pull in a prior SOW, import from CRM, or let AI draft a
                  net-new estimate in minutes.
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="shadow-sm"
              >
                <Link href="/projects/create">
                  Launch workspace
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col items-start gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={disablePrev || isPending}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={disableNext || isPending}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {isPending ? <ProjectsSkeleton count={skeletonCount} /> : null}
      </div>
    </section>
  );
}
