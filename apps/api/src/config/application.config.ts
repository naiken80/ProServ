import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  API_HOST: z.string().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_GLOBAL_PREFIX: z.string().default('api'),
  API_ENABLE_VERSIONING: z.coerce.boolean().default(true),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  CORS_ALLOWED_METHODS: z.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: z.string().default(
    'Content-Type,Authorization,X-Request-Id,X-Correlation-Id,X-Proserv-User-Id,X-Proserv-User-Email,X-Proserv-User-Name,X-Proserv-User-Roles',
  ),
  DATABASE_URL: z.string().url(),
  SHADOW_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export interface ApplicationSettings {
  environment: EnvironmentVariables['NODE_ENV'];
  http: {
    host: string;
    port: number;
    globalPrefix: string;
    enableVersioning: boolean;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  rateLimit: {
    max: number;
    timeWindowMs: number;
  };
  database: {
    url: string;
    shadowUrl?: string;
  };
  cache: {
    redisUrl?: string;
  };
}

const parseDelimited = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const loadApplicationSettings = (): ApplicationSettings => {
  const env = environmentSchema.parse(process.env);
  return {
    environment: env.NODE_ENV,
    http: {
      host: env.API_HOST,
      port: env.API_PORT,
      globalPrefix: env.API_GLOBAL_PREFIX,
      enableVersioning: env.API_ENABLE_VERSIONING,
    },
    cors: {
      allowedOrigins:
        env.CORS_ALLOWED_ORIGINS === '*'
          ? ['*']
          : parseDelimited(env.CORS_ALLOWED_ORIGINS),
      allowedMethods: parseDelimited(env.CORS_ALLOWED_METHODS),
      allowedHeaders: parseDelimited(env.CORS_ALLOWED_HEADERS),
    },
    rateLimit: {
      max: env.API_RATE_LIMIT_MAX,
      timeWindowMs: env.API_RATE_LIMIT_WINDOW_MS,
    },
    database: {
      url: env.DATABASE_URL,
      shadowUrl: env.SHADOW_DATABASE_URL,
    },
    cache: {
      redisUrl: env.REDIS_URL,
    },
  };
};

export const validateEnvironment = (config: Record<string, unknown>): EnvironmentVariables => {
  return environmentSchema.parse(config);
};

export interface AppConfig {
  app: ApplicationSettings;
}
