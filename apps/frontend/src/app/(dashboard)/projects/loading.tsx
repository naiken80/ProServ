import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <DashboardShell className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="hidden h-10 w-32 rounded-md sm:block" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-36 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
