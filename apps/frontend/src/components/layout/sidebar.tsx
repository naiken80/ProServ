'use client';

import {
  CalendarClock,
  GitBranch,
  Layers3,
  LineChart,
  Settings,
  Users2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, type MouseEvent as ReactMouseEvent } from 'react';

import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Projects', href: '/projects', icon: Layers3 },
  { label: 'Scenario Lab', href: '/scenarios', icon: GitBranch },
  { label: 'Rate Cards', href: '/resources', icon: Users2 },
  { label: 'Insights', href: '/insights', icon: LineChart },
  { label: 'Portfolio', href: '/roadmap', icon: CalendarClock },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function isModifiedClick(event: ReactMouseEvent<HTMLButtonElement>) {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const handleClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    if (isModifiedClick(event)) {
      event.preventDefault();
    }
  }, []);

  return (
    <aside className="hidden border-r border-border bg-card/60 lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <form action="/projects" method="get" className="flex">
          <button type="submit" onClick={handleClick} className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              PE
            </span>
            <span>ProServ Estimator</span>
          </button>
        </form>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <form key={item.href} action={item.href} method="get">
              <button
                type="submit"
                onClick={handleClick}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-left">{item.label}</span>
              </button>
            </form>
          );
        })}
      </nav>
    </aside>
  );
}
