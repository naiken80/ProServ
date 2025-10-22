import { z } from 'zod';

export const billingModelSchema = z.enum([
  'TIME_AND_MATERIAL',
  'FIXED_PRICE',
  'RETAINER',
  'MANAGED_SERVICE',
]);
export type BillingModel = z.infer<typeof billingModelSchema>;

export const projectStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const estimateVersionStatusSchema = z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']);
export type EstimateVersionStatus = z.infer<typeof estimateVersionStatusSchema>;

export const workItemTypeSchema = z.enum(['EPIC', 'WORKSTREAM', 'TASK', 'MILESTONE']);
export type WorkItemType = z.infer<typeof workItemTypeSchema>;

export const allocationModelSchema = z.enum(['HOURS', 'PERCENT_FTE', 'FIXED_FEE']);
export type AllocationModel = z.infer<typeof allocationModelSchema>;

export const scenarioStatusSchema = z.enum(['DRAFT', 'REVIEWED', 'APPROVED', 'ARCHIVED']);
export type ScenarioStatus = z.infer<typeof scenarioStatusSchema>;

export const approvalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

export const connectorProviderSchema = z.enum(['SERVICENOW', 'NETSUITE', 'SAP', 'WORKDAY', 'GENERIC']);
export type ConnectorProvider = z.infer<typeof connectorProviderSchema>;

export const connectorStatusSchema = z.enum(['DISCONNECTED', 'CONNECTED', 'ERROR']);
export type ConnectorStatus = z.infer<typeof connectorStatusSchema>;

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  timezone: z.string().default('UTC'),
  currency: z.string().min(3, 'Use ISO currency codes'),
});
export type Organization = z.infer<typeof organizationSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  givenName: z.string(),
  familyName: z.string(),
  organizationId: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const roleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
});
export type Role = z.infer<typeof roleSchema>;

export const rateCardEntrySchema = z.object({
  roleId: z.string(),
  currency: z.string().min(3),
  billRate: z.number().nonnegative(),
  costRate: z.number().nonnegative(),
});
export type RateCardEntry = z.infer<typeof rateCardEntrySchema>;

export const rateCardSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  currency: z.string().min(3),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  entries: z.array(rateCardEntrySchema),
});
export type RateCard = z.infer<typeof rateCardSchema>;

export const fxRateSchema = z.object({
  baseCurrency: z.string().min(3),
  quoteCurrency: z.string().min(3),
  rate: z.number().positive(),
  asOf: z.string().datetime(),
});
export type FxRate = z.infer<typeof fxRateSchema>;

export const timePhasedWeekSchema = z.object({
  weekOf: z.string().date(),
  hours: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  bill: z.number().nonnegative(),
});
export type TimePhasedWeek = z.infer<typeof timePhasedWeekSchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  workItemId: z.string(),
  roleId: z.string(),
  resourceId: z.string().optional(),
  resourceName: z.string().optional(),
  allocationModel: allocationModelSchema,
  notes: z.string().optional(),
  plan: z.array(timePhasedWeekSchema),
});
export type Assignment = z.infer<typeof assignmentSchema>;

type WorkItemShape = {
  id: string;
  versionId: string;
  parentId: string | null;
  name: string;
  type: WorkItemType;
  startDate?: string;
  endDate?: string;
  sequence?: number;
  assignments?: Assignment[];
  children?: WorkItemShape[];
};

export const workItemSchema: z.ZodType<WorkItemShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    versionId: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    type: workItemTypeSchema,
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    sequence: z.number().int().nonnegative().default(0),
    assignments: z.array(assignmentSchema).default([]),
    children: z.array(workItemSchema).default([]),
  }),
);
export type WorkItem = z.infer<typeof workItemSchema>;

export const priceRuleSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  name: z.string(),
  ruleType: z.enum(['DISCOUNT', 'PREMIUM', 'SURCHARGE', 'FLOOR']),
  configuration: z.unknown(),
});
export type PriceRule = z.infer<typeof priceRuleSchema>;

export const scenarioAdjustmentSchema = z.object({
  scenarioId: z.string(),
  workItemId: z.string(),
  adjustment: z.unknown(),
});
export type ScenarioAdjustment = z.infer<typeof scenarioAdjustmentSchema>;

export const scenarioSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: scenarioStatusSchema,
  priceDelta: z.number(),
  costDelta: z.number(),
  durationDelta: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
  adjustments: z.array(scenarioAdjustmentSchema).default([]),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const commentSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  authorId: z.string(),
  workItemId: z.string().nullable(),
  message: z.string(),
  createdAt: z.string().datetime(),
});
export type Comment = z.infer<typeof commentSchema>;

export const approvalSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  approverId: z.string(),
  status: approvalStatusSchema,
  comments: z.string().optional(),
  decidedAt: z.string().datetime().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;

export const activityEventSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  actorId: z.string().nullable(),
  eventType: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  happenedAt: z.string().datetime(),
});
export type ActivityEvent = z.infer<typeof activityEventSchema>;

export const connectorSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  provider: connectorProviderSchema,
  status: connectorStatusSchema,
  settings: z.record(z.string(), z.unknown()),
  lastSyncAt: z.string().datetime().optional(),
});
export type Connector = z.infer<typeof connectorSchema>;

export const estimateVersionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  versionNumber: z.number().int().positive(),
  status: estimateVersionStatusSchema,
  description: z.string().optional(),
  rateCardId: z.string().optional(),
  fxSnapshot: z.array(fxRateSchema).default([]),
  workItems: z.array(workItemSchema).default([]),
  scenarios: z.array(scenarioSchema).default([]),
  approvals: z.array(approvalSchema).default([]),
  comments: z.array(commentSchema).default([]),
  activityEvents: z.array(activityEventSchema).default([]),
  lockedAt: z.string().datetime().optional(),
  lockedById: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EstimateVersion = z.infer<typeof estimateVersionSchema>;

export const projectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  clientName: z.string(),
  ownerId: z.string(),
  baseCurrency: z.string().min(3),
  billingModel: billingModelSchema,
  status: projectStatusSchema,
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  versions: z.array(estimateVersionSchema).default([]),
});
export type Project = z.infer<typeof projectSchema>;

export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  client: z.string(),
  owner: z.string(),
  status: z.enum(['planning', 'estimating', 'in-flight']),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  totalValue: z.number().nonnegative(),
  currency: z.string().min(3),
  margin: z.number(),
  updatedAt: z.string().datetime(),
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const environmentConfigSchema = z.object({
  apiUrl: z.string().url(),
  enableMockData: z.boolean().default(false),
});
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

export const sharedSchemas = {
  billingModelSchema,
  projectStatusSchema,
  estimateVersionStatusSchema,
  workItemTypeSchema,
  allocationModelSchema,
  scenarioStatusSchema,
  approvalStatusSchema,
  connectorProviderSchema,
  connectorStatusSchema,
  organizationSchema,
  userSchema,
  roleSchema,
  rateCardSchema,
  fxRateSchema,
  timePhasedWeekSchema,
  assignmentSchema,
  workItemSchema,
  scenarioSchema,
  priceRuleSchema,
  commentSchema,
  approvalSchema,
  activityEventSchema,
  connectorSchema,
  estimateVersionSchema,
  projectSchema,
  projectSummarySchema,
  environmentConfigSchema,
};
