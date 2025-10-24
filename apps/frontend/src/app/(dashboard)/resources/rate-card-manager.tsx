'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { RateCard, RateCardRoleInfo } from '@proserv/shared';

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
  listRateCards,
  createRateCard,
  updateRateCard,
  type CreateRateCardPayload,
  type UpdateRateCardPayload,
} from '@/frontend/lib/client/rate-cards';
import { listRoles } from '@/frontend/lib/client/roles';
import { useSession } from '@/frontend/lib/session-context';
import { formatDate } from '@/frontend/lib/formatters';
import { cn } from '@/frontend/lib/utils';

type EditableEntry = {
  roleId: string;
  roleName: string;
  roleCode: string;
  billRate: string;
  costRate: string;
};

type EditableRateCard = {
  id: string;
  name: string;
  currency: string;
  validFrom: string;
  validTo: string;
  entries: EditableEntry[];
};

function toEditable(
  card: RateCard,
  roles: RateCardRoleInfo[],
): EditableRateCard {
  const roleSources =
    roles.length > 0
      ? roles
      : card.entries.map((entry) => ({
          id: entry.roleId,
          code: entry.role.code,
          name: entry.role.name,
        }));

  const entriesByRole = new Map(card.entries.map((entry) => [entry.roleId, entry]));
  const sortedRoles = roleSources.slice().sort((a, b) => a.name.localeCompare(b.name));

  const entries: EditableEntry[] = sortedRoles.map((role) => {
    const existing = entriesByRole.get(role.id);
    return {
      roleId: role.id,
      roleName: role.name,
      roleCode: role.code,
      billRate:
        existing !== undefined ? existing.billRate.toString() : '0',
      costRate:
        existing !== undefined ? existing.costRate.toString() : '0',
    };
  });

  return {
    id: card.id,
    name: card.name,
    currency: card.currency,
    validFrom: card.validFrom ? card.validFrom.slice(0, 10) : '',
    validTo: card.validTo ? card.validTo.slice(0, 10) : '',
    entries,
  };
}

export function RateCardManager() {
  const session = useSession();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['rate-cards', session.id],
    queryFn: () => listRateCards(session),
  });

  const rateCards = data?.data ?? [];
  const rolesFromRateCards = data?.roles ?? [];
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ['org-roles', session.id],
    queryFn: () => listRoles(session, { includeArchived: true }),
  });

  const activeRoles = rolesData?.data.filter(
    (role) => role.archivedAt === null,
  ) ?? [];
  const roleInfos = useMemo<RateCardRoleInfo[]>(
    () =>
      activeRoles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description ?? null,
      })),
    [activeRoles],
  );

  const availableRoles = useMemo<RateCardRoleInfo[]>(() => {
    if (roleInfos.length > 0) {
      return roleInfos;
    }

    if (rolesFromRateCards.length > 0) {
      return rolesFromRateCards.filter(
        (role): role is RateCardRoleInfo =>
          Boolean(role) &&
          typeof role.id === 'string' &&
          typeof role.code === 'string' &&
          typeof role.name === 'string',
      );
    }

    if (rateCards.length > 0) {
      const firstCard = rateCards[0];
      return firstCard.entries.map((entry) => ({
        id: entry.roleId,
        code: entry.role.code,
        name: entry.role.name,
        description: entry.role.description ?? null,
      }));
    }

    return [];
  }, [roleInfos, rolesFromRateCards, rateCards]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableRateCard | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState('');
  const [newCardCurrency, setNewCardCurrency] = useState('USD');

  useEffect(() => {
    if (!rateCards.length) {
      setSelectedId(null);
      setDraft(null);
      return;
    }

    setSelectedId((previous) => {
      if (previous && rateCards.some((card) => card.id === previous)) {
        return previous;
      }
      return rateCards[0]?.id ?? null;
    });
  }, [rateCards]);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }

    const selected = rateCards.find((card) => card.id === selectedId);
    if (!selected) {
      setDraft(null);
      return;
    }

    const rolesForDraft =
      availableRoles.length > 0
        ? availableRoles
        : selected.entries.map((entry) => ({
            id: entry.roleId,
            code: entry.role.code,
            name: entry.role.name,
            description: entry.role.description ?? null,
          }));

    setDraft((previous) => {
      if (!previous || previous.id !== selected.id) {
        return toEditable(selected, rolesForDraft);
      }

      const existingRoleIds = new Set(previous.entries.map((entry) => entry.roleId));
      const hasNewRole = rolesForDraft.some((role) => !existingRoleIds.has(role.id));
      if (hasNewRole) {
        return toEditable(selected, rolesForDraft);
      }

      return previous;
    });
  }, [availableRoles, rateCards, selectedId]);

  const updateMutation = useMutation<
    RateCard,
    Error,
    { id: string; body: UpdateRateCardPayload }
  >({
    mutationFn: ({ id, body }) =>
      updateRateCard(session, id, body),
    onSuccess: (card) => {
      setStatusMessage('Saved changes to the rate card.');
      setErrorMessage(null);
      setDraft(toEditable(card, roleInfos));
      setSelectedId(card.id);
      queryClient.invalidateQueries({ queryKey: ['rate-cards', session.id] });
    },
    onError: (mutationError: unknown) => {
      setStatusMessage(null);
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to update the rate card.',
      );
    },
  });

  const createMutation = useMutation<RateCard, Error, CreateRateCardPayload>({
    mutationFn: (payload) => createRateCard(session, payload),
    onSuccess: (card) => {
      setStatusMessage('Created a new rate card.');
      setErrorMessage(null);
      setNewCardName('');
      setNewCardCurrency(card.currency);
      setSelectedId(card.id);
      setDraft(toEditable(card, roleInfos));
      queryClient.invalidateQueries({ queryKey: ['rate-cards', session.id] });
    },
    onError: (mutationError: unknown) => {
      setStatusMessage(null);
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to create the rate card.',
      );
    },
  });

  const handleEntryChange = (
    roleId: string,
    field: 'billRate' | 'costRate',
    value: string,
  ) => {
    setDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        entries: previous.entries.map((entry) =>
          entry.roleId === roleId ? { ...entry, [field]: value } : entry,
        ),
      };
    });
  };

  const handleSave = () => {
    if (!selectedId || !draft) return;

    const original = rateCards.find((card) => card.id === selectedId);
    if (!original) return;

    const payload: UpdateRateCardPayload = {};

    const trimmedName = draft.name.trim();
    if (trimmedName && trimmedName !== original.name) {
      payload.name = trimmedName;
    }

    const uppercaseCurrency = draft.currency.trim().toUpperCase();
    if (
      uppercaseCurrency &&
      uppercaseCurrency !== original.currency
    ) {
      payload.currency = uppercaseCurrency;
    }

    const normalizedValidFrom = draft.validFrom.trim();
    const originalValidFrom = (original.validFrom ?? '').slice(0, 10);
    if (normalizedValidFrom !== originalValidFrom && normalizedValidFrom) {
      payload.validFrom = normalizedValidFrom;
    }

    const normalizedValidTo = draft.validTo.trim();
    const originalValidTo = (original.validTo ?? '').slice(0, 10);
    if (normalizedValidTo !== originalValidTo && normalizedValidTo) {
      payload.validTo = normalizedValidTo;
    }

    const entryUpdates: NonNullable<typeof payload.entries> = [];

    for (const entry of draft.entries) {
      const bill = Number(entry.billRate);
      const cost = Number(entry.costRate);

      if (Number.isNaN(bill) || Number.isNaN(cost)) {
        setErrorMessage(`Provide numeric rates for ${entry.roleName}.`);
        return;
      }

      if (bill < 0 || cost < 0) {
        setErrorMessage('Rates cannot be negative.');
        return;
      }

      const originalEntry = original.entries.find(
        (item) => item.roleId === entry.roleId,
      );

      if (
        !originalEntry ||
        originalEntry.billRate !== bill ||
        originalEntry.costRate !== cost
      ) {
        entryUpdates.push({
          roleId: entry.roleId,
          billRate: bill,
          costRate: cost,
        });
      }
    }

    if (entryUpdates.length > 0) {
      payload.entries = entryUpdates;
    }

    if (Object.keys(payload).length === 0) {
      setStatusMessage('No changes to save.');
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);
    updateMutation.mutate({ id: selectedId, body: payload });
  };

  const handleReset = () => {
    if (!selectedId) return;
    const original = rateCards.find((card) => card.id === selectedId);
    if (!original) return;
    setDraft(availableRoles.length ? toEditable(original, availableRoles) : null);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleCreate = () => {
    const trimmedName = newCardName.trim();
    const trimmedCurrency = newCardCurrency.trim().toUpperCase().slice(0, 3);

    if (availableRoles.length === 0) {
      setErrorMessage('Add at least one role before creating a rate card.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Provide a name for the rate card.');
      return;
    }

    if (trimmedCurrency.length !== 3) {
      setErrorMessage('Currency should be a 3-letter ISO code.');
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);
    createMutation.mutate({
      name: trimmedName,
      currency: trimmedCurrency,
    });
  };

  const loadingState =
    isLoading || rolesLoading || !data || !rolesData;
  const fetchErrorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Unable to load rate cards.'
        : rolesError instanceof Error
          ? rolesError.message
          : rolesError
            ? 'Unable to load roles.'
            : null;

  const disableSave = updateMutation.isPending || !draft;

  let mainContent: ReactNode;

  if (loadingState) {
    mainContent = (
      <p className="text-sm text-muted-foreground">Loading rate cards…</p>
    );
  } else if (fetchErrorMessage) {
    mainContent = (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {fetchErrorMessage}
      </div>
    );
  } else if (!availableRoles.length && (!draft || draft.entries.length === 0)) {
    mainContent = (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Define at least one active role in the catalog above to start managing rate cards.
      </div>
    );
  } else if (!rateCards.length) {
    mainContent = (
      <p className="text-sm text-muted-foreground">
        No rate cards yet. Create one to set delivery guardrails for your roles.
      </p>
    );
  } else {
    mainContent = (
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <div className="space-y-2">
          {rateCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className={cn(
                'w-full rounded-xl border px-3 py-3 text-left transition',
                selectedId === card.id
                  ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                  : 'border-border/60 bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{card.name}</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {card.currency}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.entries.length} roles · updated {formatDate(card.updatedAt)}
              </p>
            </button>
          ))}
        </div>

        {draft ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Name</span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((previous) =>
                      previous
                        ? { ...previous, name: event.target.value }
                        : previous,
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Currency</span>
                <input
                  value={draft.currency}
                  maxLength={3}
                  onChange={(event) =>
                    setDraft((previous) =>
                      previous
                        ? {
                            ...previous,
                            currency: event.target.value
                              .toUpperCase()
                              .slice(0, 3),
                          }
                        : previous,
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Valid from</span>
                <input
                  type="date"
                  value={draft.validFrom}
                  onChange={(event) =>
                    setDraft((previous) =>
                      previous
                        ? { ...previous, validFrom: event.target.value }
                        : previous,
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground">Valid to</span>
                <input
                  type="date"
                  value={draft.validTo}
                  onChange={(event) =>
                    setDraft((previous) =>
                      previous
                        ? { ...previous, validTo: event.target.value }
                        : previous,
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/70">
              <table className="min-w-full divide-y divide-border/80 text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-right">Bill rate</th>
                    <th className="px-4 py-2 text-right">Cost rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {draft.entries.map((entry) => (
                    <tr key={entry.roleId}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Badge
                            variant="outline"
                            className="rounded-full border-dashed px-2 uppercase"
                          >
                            {entry.roleCode}
                          </Badge>
                          <span className="font-medium text-foreground">
                            {entry.roleName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={entry.billRate}
                          onChange={(event) =>
                            handleEntryChange(
                              entry.roleId,
                              'billRate',
                              event.target.value,
                            )
                          }
                          className="h-9 w-full rounded-lg border border-border bg-background/80 px-3 text-right text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={entry.costRate}
                          onChange={(event) =>
                            handleEntryChange(
                              entry.roleId,
                              'costRate',
                              event.target.value,
                            )
                          }
                          className="h-9 w-full rounded-lg border border-border bg-background/80 px-3 text-right text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={disableSave}
                className="gap-2"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            Select a rate card to review the role-by-role rates.
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-lg">
      <CardHeader>
        <CardTitle>Rate card management</CardTitle>
        <CardDescription>
          Standardize bill and cost rates across every role before estimates go to review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <h3 className="text-sm font-semibold text-foreground">Add a rate card</h3>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs">
              <span className="font-medium text-foreground">Name</span>
              <input
                value={newCardName}
                onChange={(event) => setNewCardName(event.target.value)}
                className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex w-full flex-col gap-1 text-xs md:w-32">
              <span className="font-medium text-foreground">Currency</span>
              <input
                value={newCardCurrency}
                maxLength={3}
                onChange={(event) =>
                  setNewCardCurrency(event.target.value.toUpperCase().slice(0, 3))
                }
                className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </label>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gap-2 md:w-auto"
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
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
