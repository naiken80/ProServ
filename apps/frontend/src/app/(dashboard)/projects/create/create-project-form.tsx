'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/frontend/components/ui/button';

import { createProject } from '@/frontend/lib/client/projects';

import type { BillingModelOption } from './constants';

type CreateProjectFormProps = {
  billingModels: BillingModelOption[];
};

export function CreateProjectForm({
  billingModels,
}: CreateProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [billingModel, setBillingModel] = useState(
    billingModels[0]?.value ?? 'TIME_AND_MATERIAL',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const summary = await createProject({
        name,
        clientName,
        startDate,
        baseCurrency,
        billingModel,
      });

      router.push(`/projects/${summary.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to create project. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableSubmit =
    !name.trim() || !clientName.trim() || !startDate || !baseCurrency;

  return (
    <form
      className="space-y-8 rounded-3xl border border-border/60 bg-card/70 p-8 shadow-lg"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Project foundation
        </h2>
        <p className="text-sm text-muted-foreground">
          Capture the essentials so the workspace can personalize staffing and
          financial framing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Project name
          </span>
          <input
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. AI Transformation Blueprint"
            className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Client name
          </span>
          <input
            name="clientName"
            required
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="e.g. Northwind Manufacturing"
            className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Kickoff</span>
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <input
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
            />
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Base currency
          </span>
          <input
            name="baseCurrency"
            required
            value={baseCurrency}
            maxLength={3}
            onChange={(event) =>
              setBaseCurrency(event.target.value.toUpperCase())
            }
            className="h-11 rounded-xl border border-border bg-background/80 px-4 text-sm uppercase outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          Billing model
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {billingModels.map((option) => {
            const checked = option.value === billingModel;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-sm transition ${
                  checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 bg-background/60 text-muted-foreground hover:border-ring hover:text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="billingModel"
                  value={option.value}
                  className="sr-only"
                  checked={checked}
                  onChange={() => setBillingModel(option.value)}
                />
                <span className="font-semibold">{option.label}</span>
                <span className="text-xs">{option.description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>
            Workspace scaffolding includes staffing, rates, and scenario drafts.
          </span>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={disableSubmit || isSubmitting}
          className="shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : (
            <>
              Launch workspace
              <Sparkles className="ml-2 h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
