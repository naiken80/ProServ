import Link from 'next/link';

import { DashboardShell } from '../../../../components/layout/dashboard-shell';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { fetchProjectWorkspace } from '../../../../lib/api/projects';
import { getServerSession } from '../../../../lib/session.server';

import { ProjectWorkspaceView } from './project-workspace-view';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const session = getServerSession();
  const workspace = await fetchProjectWorkspace(id, session);

  if (!workspace) {
    return (
      <DashboardShell className="space-y-8">
        <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/20 shadow-none">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold text-foreground">
              We couldn&apos;t find that workspace
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              The project might have been archived or never created. Spin up a new estimate or return
              to your pipeline overview.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <Button asChild size="sm">
              <Link href="/projects/create">Create estimate</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">Back to projects</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return <ProjectWorkspaceView workspace={workspace} />;
}
