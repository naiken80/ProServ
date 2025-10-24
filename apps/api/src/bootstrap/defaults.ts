export type DefaultRoleDefinition = {
  code: string;
  name: string;
  description: string;
  billRate: number;
  costRate: number;
};

export const DEFAULT_ORG_ROLE_DEFINITIONS: DefaultRoleDefinition[] = [
  {
    code: 'ARCH',
    name: 'Solution Architect',
    description: 'Design end-to-end solution blueprints and guardrails.',
    billRate: 325,
    costRate: 165,
  },
  {
    code: 'ENGM',
    name: 'Engagement Manager',
    description: 'Own governance, steering cadence, and commercial health.',
    billRate: 285,
    costRate: 155,
  },
  {
    code: 'DEL',
    name: 'Delivery Lead',
    description: 'Coordinate squads, risks, and day-to-day execution.',
    billRate: 245,
    costRate: 135,
  },
  {
    code: 'ANA',
    name: 'Business Analyst',
    description: 'Drive requirements, user stories, and acceptance criteria.',
    billRate: 185,
    costRate: 95,
  },
];
