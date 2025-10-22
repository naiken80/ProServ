'use client';

import { useEffect } from 'react';

import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Button } from '../../../components/ui/button';

export default function ProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">We could not load your projects.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Please try refreshing the page. If the issue persists, capture the error digest below and share it with the
          platform team.
        </p>
        {error.digest ? <code className="rounded bg-muted px-2 py-1 text-xs">{error.digest}</code> : null}
      </div>
      <Button onClick={reset}>Retry</Button>
    </DashboardShell>
  );
}
