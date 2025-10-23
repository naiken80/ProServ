import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import {
  loadApplicationSettings,
  validateEnvironment,
} from '../config/application.config';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
      cache: true,
      validate: validateEnvironment,
      load: [
        () => ({
          app: loadApplicationSettings(),
        }),
      ],
    }),
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.LOG_LEVEL ?? 'info',
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: true,
          transport:
            process.env.NODE_ENV === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    singleLine: false,
                  },
                }
              : undefined,
        },
      }),
    }),
    PrismaModule,
    HealthModule,
    ProjectsModule,
  ],
})
export class AppModule {}
