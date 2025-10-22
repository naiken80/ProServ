import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function ResourcesPage() {
  return (
    <DashboardShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Team availability</h1>
        <p className="text-sm text-muted-foreground">
          Centralize rate cards, time-off calendars, and capacity insights for each delivery region.
        </p>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resource planner</CardTitle>
          <CardDescription>Integrations with Workday and ServiceNow will hydrate availability in real time.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">Upcoming integration milestones</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
              <li>HRIS adapter for holiday &amp; leave calendars</li>
              <li>Skills matrix tagging per role</li>
              <li>Utilization baseline alerts</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            Upload sample CSV data to trial the planner experience while integrations are being finalized.
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
