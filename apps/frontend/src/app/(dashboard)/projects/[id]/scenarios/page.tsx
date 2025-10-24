import Link from 'next/link';

type ScenariosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectScenariosPlaceholder({ params }: ScenariosPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Scenario lab</h1>
      <p className="text-sm text-muted-foreground">
        Scenario analysis for project <code className="rounded bg-muted px-1 py-0.5 text-xs">{id}</code> isn&apos;t wired up yet.
        We&apos;re keeping the navigation in place so you know where it will live once delivered.
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

