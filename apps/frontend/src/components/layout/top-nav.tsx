'use client';

import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';

const breadcrumbsMap: Record<string, string> = {
  '/projects': 'Projects',
  '/projects/create': 'New Project',
  '/projects/:id': 'Project Overview',
  '/scenarios': 'Scenario Lab',
  '/resources': 'Teams',
  '/settings': 'Settings',
};

function resolveBreadcrumb(pathname: string) {
  if (pathname === '/') return 'Overview';
  const direct = breadcrumbsMap[pathname];
  if (direct) return direct;
  if (pathname.startsWith('/projects/')) return 'Project Overview';
  if (pathname.startsWith('/scenarios/')) return 'Scenario';
  return 'Workspace';
}

export function TopNav() {
  const pathname = usePathname();
  const trail = resolveBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex flex-col">
        <span className="text-xs uppercase text-muted-foreground">Workspace</span>
        <nav className="text-sm font-medium text-foreground">
          <Link href="/projects" className="hover:underline">
            Projects
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span>{trail}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="h-10 w-64 rounded-lg border border-border bg-muted/40 pl-10 pr-4 text-sm outline-none focus:border-ring"
            placeholder="Search projects, people, or tags"
            type="search"
            aria-label="Global search"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
        </Button>
        <ThemeToggle />
        <button
          type="button"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-medium uppercase',
          )}
          aria-label="Open profile menu"
        >
          NA
        </button>
      </div>
    </header>
  );
}
