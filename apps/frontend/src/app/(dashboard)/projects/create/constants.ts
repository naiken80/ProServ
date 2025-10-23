import type { z } from 'zod';

import { billingModelSchema } from '@proserv/shared';

export type BillingModelOption = {
  value: z.infer<typeof billingModelSchema>;
  label: string;
  description: string;
};

export const billingModelOptions: BillingModelOption[] = [
  {
    value: 'TIME_AND_MATERIAL',
    label: 'Time & materials',
    description: 'Flexible staffing with billable hours.',
  },
  {
    value: 'FIXED_PRICE',
    label: 'Fixed price',
    description: 'Pre-defined scope with fixed billing.',
  },
  {
    value: 'RETAINER',
    label: 'Retainer',
    description: 'Recurring advisory or managed support.',
  },
  {
    value: 'MANAGED_SERVICE',
    label: 'Managed service',
    description: 'Outcome-based service delivery.',
  },
];
