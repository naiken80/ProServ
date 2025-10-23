import Link from 'next/link';

import { DashboardShell } from '../../../../components/layout/dashboard-shell';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { CreateProjectForm } from './create-project-form';
import { billingModelOptions } from './constants';

export default function CreateProjectPage() {
  return (
    <DashboardShell className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="-ml-2 text-sm text-muted-foreground">
          <Link href="/projects">← Back to projects</Link>
        </Button>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Launch a new estimate workspace
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Define the engagement basics and we&apos;ll provision the workspace with scenario drafts,
            staffing placeholders, and financial guardrails.
          </p>
        </div>
      </div>

      <CreateProjectForm billingModels={billingModelOptions} />

      <Card className="rounded-3xl border border-border/60 bg-muted/30">
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What happens next?</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Baseline estimate version is created and ready for staffing inputs.</li>
            <li>Pipeline dashboards immediately reflect your new engagement.</li>
            <li>You can iterate on scenarios and share readouts with stakeholders.</li>
          </ul>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
