import { cn } from '../../lib/utils';

import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

import type { PropsWithChildren } from 'react';

export function DashboardShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <TopNav />
        <main className={cn('flex-1 space-y-8 bg-background px-4 pb-16 pt-6 md:px-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
