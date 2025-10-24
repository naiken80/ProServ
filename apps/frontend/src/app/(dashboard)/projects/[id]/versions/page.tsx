import Link from 'next/link';

type VersionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectVersionsPlaceholder({ params }: VersionsPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Estimate versions</h1>
      <p className="text-sm text-muted-foreground">
        Version management for project <code className="rounded bg-muted px-1 py-0.5 text-xs">{id}</code> is coming soon.
        Continue working from the project workspace while we finish this flow.
      </p>
      <Link
        href={`/projects/${id}`}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Back to project
      </Link>
    </div>
  );
}

