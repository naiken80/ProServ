import compression from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app/app.module';

import type { AppConfig, ApplicationSettings } from './config/application.config';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ logger: false, trustProxy: true });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService<AppConfig>);
  const settings = configService.getOrThrow<ApplicationSettings>('app');

  app.setGlobalPrefix(settings.http.globalPrefix, {
    exclude: ['health'],
  });

  if (settings.http.enableVersioning) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
  }

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: settings.environment === 'production',
    }),
  );

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(cors, {
    origin: settings.cors.allowedOrigins.includes('*')
      ? true
      : settings.cors.allowedOrigins,
    credentials: true,
    allowedHeaders: settings.cors.allowedHeaders,
    methods: settings.cors.allowedMethods,
    maxAge: 86400,
  });

  await app.register(rateLimit, {
    max: settings.rateLimit.max,
    timeWindow: settings.rateLimit.timeWindowMs,
  });

  await app.register(compression, { global: true });

  const port = settings.http.port;
  const host = settings.http.host;

  await app.listen({ port, host });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('API failed to start', error);
  process.exit(1);
});
