'use client';

import {
  CalendarClock,
  GitBranch,
  Layers3,
  LineChart,
  Settings,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Projects', href: '/projects', icon: Layers3 },
  { label: 'Scenario Lab', href: '/scenarios', icon: GitBranch },
  { label: 'Teams', href: '/resources', icon: Users2 },
  { label: 'Insights', href: '/insights', icon: LineChart },
  { label: 'Portfolio', href: '/roadmap', icon: CalendarClock },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border bg-card/60 lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            PE
          </span>
          <span>ProServ Estimator</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
