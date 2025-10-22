import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function RoadmapPage() {
  return (
    <DashboardShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Gantt-style timeline and resource heatmaps will be available in an upcoming sprint.
        </p>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Visualize dependencies across estimate versions and synchronize with PSA tools for downstream delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-xl border border-dashed border-border bg-muted/50" />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
