'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { RoleCollection } from '@proserv/shared';

import { Badge } from '@/frontend/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import {
  archiveRole,
  createRole,
  listRoles,
  updateRole,
  type CreateRolePayload,
  type UpdateRolePayload,
} from '@/frontend/lib/client/roles';
import { formatDate } from '@/frontend/lib/formatters';
import { useSession } from '@/frontend/lib/session-context';
import { cn } from '@/frontend/lib/utils';

type RoleFormState = {
  code: string;
  name: string;
  description: string;
};

const blankForm: RoleFormState = {
  code: '',
  name: '',
  description: '',
};

function normalizeFormInput(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function RoleCatalogManager() {
  const session = useSession();
  const queryClient = useQueryClient();

  const rolesQueryKey = useMemo(
    () => ['org-roles', session.id] as const,
    [session.id],
  );

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: rolesQueryKey,
    queryFn: () => listRoles(session, { includeArchived: true }),
  });

  const roles = data?.data ?? [];
  const activeRoles = roles.filter((role) => role.archivedAt === null);
  const archivedRoles = roles.filter((role) => role.archivedAt !== null);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<RoleFormState>(blankForm);
  const [editForm, setEditForm] = useState<RoleFormState>(blankForm);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRoles.length) {
      setSelectedRoleId(null);
      setEditForm(blankForm);
      return;
    }

    setSelectedRoleId((previous) => {
      if (previous && activeRoles.some((role) => role.id === previous)) {
        return previous;
      }
      return activeRoles[0]?.id ?? null;
    });
  }, [activeRoles]);

  useEffect(() => {
    if (!selectedRoleId) {
      setEditForm(blankForm);
      return;
    }

    const selected = activeRoles.find((role) => role.id === selectedRoleId);
    if (!selected) {
      setEditForm(blankForm);
      return;
    }

    setEditForm({
      code: selected.code,
      name: selected.name,
      description: selected.description ?? '',
    });
  }, [activeRoles, selectedRoleId]);

  const cancelRolesQuery = async () => {
    await queryClient.cancelQueries({ queryKey: rolesQueryKey });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(session, payload),
    onMutate: async () => {
      setStatusMessage(null);
      setErrorMessage(null);
    },
    onSuccess: (createdRole) => {
      queryClient.setQueryData<RoleCollection>(rolesQueryKey, (current) => {
        if (!current) {
          return {
            data: [createdRole],
            meta: {
              total: 1,
              activeCount: createdRole.archivedAt ? 0 : 1,
              archivedCount: createdRole.archivedAt ? 1 : 0,
            },
          };
        }

        return {
          data: [createdRole, ...current.data],
          meta: {
            total: current.meta.total + 1,
            activeCount: createdRole.archivedAt
              ? current.meta.activeCount
              : current.meta.activeCount + 1,
            archivedCount: createdRole.archivedAt
              ? current.meta.archivedCount + 1
              : current.meta.archivedCount,
          },
        };
      });
      setStatusMessage('Added role to the catalog.');
      setCreateForm(blankForm);
      setSelectedRoleId(createdRole.archivedAt ? null : createdRole.id);
    },
    onError: (mutationError: unknown) => {
      setStatusMessage(null);
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to create role.',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['rate-cards', session.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRolePayload;
    }) => updateRole(session, id, payload),
    onMutate: async ({ id, payload }) => {
      setStatusMessage(null);
      setErrorMessage(null);
      await cancelRolesQuery();
      const previous = queryClient.getQueryData<RoleCollection>(rolesQueryKey);

      if (previous) {
        const optimistic = previous.data.map((role) =>
          role.id === id
            ? {
                ...role,
                code: payload.code ?? role.code,
                name: payload.name ?? role.name,
                description:
                  payload.description !== undefined
                    ? payload.description ?? null
                    : role.description,
                updatedAt: new Date().toISOString(),
              }
            : role,
        );

        queryClient.setQueryData<RoleCollection>(rolesQueryKey, {
          ...previous,
          data: optimistic,
        });
      }

      return { previous };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(rolesQueryKey, context.previous);
      }
      setStatusMessage(null);
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to update role.',
      );
    },
    onSuccess: (updatedRole) => {
      queryClient.setQueryData<RoleCollection>(rolesQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((role) =>
            role.id === updatedRole.id ? updatedRole : role,
          ),
        };
      });
      setStatusMessage('Saved role changes.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['rate-cards', session.id] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveRole(session, id),
    onMutate: async (id) => {
      setStatusMessage(null);
      setErrorMessage(null);
      await cancelRolesQuery();
      const previous = queryClient.getQueryData<RoleCollection>(rolesQueryKey);

      if (previous) {
        const archivedAt = new Date().toISOString();
        const optimistic = previous.data.map((role) =>
          role.id === id
            ? { ...role, archivedAt, updatedAt: archivedAt }
            : role,
        );

        queryClient.setQueryData<RoleCollection>(rolesQueryKey, {
          data: optimistic,
          meta: {
            ...previous.meta,
            activeCount: Math.max(previous.meta.activeCount - 1, 0),
            archivedCount: previous.meta.archivedCount + 1,
          },
        });
      }

      return { previous };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(rolesQueryKey, context.previous);
      }
      setStatusMessage(null);
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to archive role.',
      );
    },
    onSuccess: (archivedRole) => {
      queryClient.setQueryData<RoleCollection>(rolesQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((role) =>
            role.id === archivedRole.id ? archivedRole : role,
          ),
        };
      });
      setStatusMessage('Archived the role.');
      setSelectedRoleId((previous) =>
        previous === archivedRole.id ? null : previous,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['rate-cards', session.id] });
    },
  });

  const handleCreate = () => {
    const code = createForm.code.toUpperCase().trim();
    const name = createForm.name.trim();
    const description = normalizeFormInput(createForm.description);

    if (!code || code.length < 2) {
      setErrorMessage('Role code should include at least two characters.');
      setStatusMessage(null);
      return;
    }

    if (!name) {
      setErrorMessage('Provide a name for the role.');
      setStatusMessage(null);
      return;
    }

    createMutation.mutate({
      code,
      name,
      description: description.length > 0 ? description : undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedRoleId) return;
    const existing = activeRoles.find((role) => role.id === selectedRoleId);
    if (!existing) return;

    const code = editForm.code.toUpperCase().trim();
    const name = editForm.name.trim();
    const description = normalizeFormInput(editForm.description);

    const payload: UpdateRolePayload = {};

    if (code && code !== existing.code) {
      payload.code = code;
    }

    if (name && name !== existing.name) {
      payload.name = name;
    }

    if (description !== existing.description?.trim()) {
      payload.description = description.length > 0 ? description : '';
    }

    if (Object.keys(payload).length === 0) {
      setStatusMessage('No changes to save.');
      setErrorMessage(null);
      return;
    }

    updateMutation.mutate({ id: existing.id, payload });
  };

  const handleArchive = () => {
    if (!selectedRoleId) return;
    archiveMutation.mutate(selectedRoleId);
  };

  const loadingState = isLoading || !data;
  const fetchErrorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Unable to load roles.'
        : null;

  let mainContent: ReactNode;

  if (loadingState) {
    mainContent = (
      <p className="text-sm text-muted-foreground">Loading role catalog…</p>
    );
  } else if (fetchErrorMessage) {
    mainContent = (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {fetchErrorMessage}
      </div>
    );
  } else if (!roles.length) {
    mainContent = (
      <p className="text-sm text-muted-foreground">
        No roles defined yet. Add roles below to seed your delivery catalog.
      </p>
    );
  } else {
    mainContent = (
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-2">
          {activeRoles.length ? (
            activeRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-left transition',
                  selectedRoleId === role.id
                    ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                    : 'border-border/60 bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{role.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {role.code}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatDate(role.updatedAt)}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
              Active roles will appear here once defined.
            </div>
          )}
          {archivedRoles.length ? (
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Archived roles
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {archivedRoles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="outline"
                    className="border-dashed px-2 text-[10px] uppercase text-muted-foreground"
                  >
                    {role.code}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {selectedRoleId ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Code</span>
                <input
                  value={editForm.code}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      code: event.target.value.toUpperCase().slice(0, 20),
                    }))
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Name</span>
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-foreground">Description</span>
              <textarea
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={
                  updateMutation.isPending ||
                  archiveMutation.isPending ||
                  !activeRoles.length
                }
                className="gap-2"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const selected = activeRoles.find(
                    (role) => role.id === selectedRoleId,
                  );
                  if (!selected) return;
                  setEditForm({
                    code: selected.code,
                    name: selected.name,
                    description: selected.description ?? '',
                  });
                  setStatusMessage(null);
                  setErrorMessage(null);
                }}
                disabled={updateMutation.isPending || archiveMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleArchive}
                disabled={archiveMutation.isPending || updateMutation.isPending}
              >
                {archiveMutation.isPending ? 'Archiving…' : 'Archive role'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            Select an active role to edit its details.
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-lg">
      <CardHeader>
        <CardTitle>Role catalog</CardTitle>
        <CardDescription>
          Define the delivery roles available across your organization. Rate cards and assignments pull from this catalog.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <h3 className="text-sm font-semibold text-foreground">Add a role</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr,2fr] md:items-end">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-foreground">Code</span>
              <input
                value={createForm.code}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    code: event.target.value.toUpperCase().slice(0, 20),
                  }))
                }
                className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs md:col-span-2">
              <span className="font-medium text-foreground">Name</span>
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-xs">
              <span className="font-medium text-foreground">Description</span>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gap-2 md:w-auto"
            >
              {createMutation.isPending ? 'Saving…' : 'Add role'}
            </Button>
          </div>
        </div>

        {statusMessage ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {mainContent}
      </CardContent>
    </Card>
  );
}
