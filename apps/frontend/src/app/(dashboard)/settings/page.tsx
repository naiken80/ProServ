import { DashboardShell } from '../../../components/layout/dashboard-shell';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';

export default function SettingsPage() {
  return (
    <DashboardShell className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Workspace settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage authentication, approval workflows, and data-retention policies.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Security controls</CardTitle>
          <CardDescription>OIDC / SAML configuration and SCIM provisioning will land here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">Single sign-on</p>
            <p className="text-xs text-muted-foreground">
              Configure issuer, client ID, and signing certificates for your identity provider.
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Audit log export</p>
              <p className="text-xs text-muted-foreground">
                Stream structured events to your SIEM for long-term retention.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
