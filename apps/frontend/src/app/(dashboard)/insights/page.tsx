import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function InsightsPage() {
  return (
    <DashboardShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio insights</h1>
        <p className="text-sm text-muted-foreground">
          Monitor aggregate pipeline health, margin performance, and staffing risks across your portfolio.
        </p>
      </div>
      <div className="grid gap-6 pt-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">Metric placeholder</CardTitle>
              <CardDescription>Reserved for future analytics widgets.</CardDescription>
            </CardHeader>
            <CardContent className="h-32">
              <div className="h-full rounded-lg border border-dashed border-border" />
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
