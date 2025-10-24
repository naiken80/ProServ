import { DashboardShell } from '../../../components/layout/dashboard-shell';

import { RoleCatalogManager } from './role-catalog-manager';
import { RateCardManager } from './rate-card-manager';

export default function ResourcesPage() {
  return (
    <DashboardShell className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Resource catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Define the roles your teams use and align rate guardrails across every delivery engagement.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Role catalog</h2>
          <p className="text-sm text-muted-foreground">
            Create and maintain the role definitions available to projects, staffing plans, and rate cards.
          </p>
        </div>
        <RoleCatalogManager />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Rate cards</h2>
        <p className="text-sm text-muted-foreground">
          Configure bill and cost rates for every defined role before estimates move into review.
        </p>
      </div>
      <RateCardManager />
    </DashboardShell>
  );
}
