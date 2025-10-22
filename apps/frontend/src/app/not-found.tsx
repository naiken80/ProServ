import Link from 'next/link';

import { DashboardShell } from '../components/layout/dashboard-shell';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <DashboardShell className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Resource not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The estimate or workspace you are looking for may have been archived or you no longer have access. Try
          returning to the projects dashboard.
        </p>
      </div>
      <Button asChild>
        <Link href="/projects">Back to projects</Link>
      </Button>
    </DashboardShell>
  );
}
