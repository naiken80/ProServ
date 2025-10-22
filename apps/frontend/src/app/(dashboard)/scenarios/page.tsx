import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function ScenariosPage() {
  return (
    <DashboardShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Scenario lab</h1>
        <p className="text-sm text-muted-foreground">
          Compare pricing strategies, staffing mixes, and FX sensitivities before locking an estimate version.
        </p>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scenario optimizer coming soon</CardTitle>
          <CardDescription>
            Upload staffing curves, guardrails, and optimization constraints to generate scenario recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            The optimization engine will support margin maximization, time-to-value compression, and risk balancing goals
            backed by OR-Tools. Integration with the AI advisor will explain the trade-offs in plain language.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
