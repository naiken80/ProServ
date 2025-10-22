import { HealthCheckService } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';

import { PrismaHealthIndicator } from '../infra/prisma/prisma.health-indicator';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('delegates to the health check service', async () => {
    const healthCheckService = {
      check: jest.fn(async (indicators: Array<() => Promise<unknown>>) => {
        for (const indicator of indicators) {
          await indicator();
        }

        return { status: 'ok' };
      }),
    } as unknown as HealthCheckService;

    const prismaHealthIndicator = {
      isHealthy: jest.fn().mockResolvedValue({ status: 'up' }),
    } as unknown as PrismaHealthIndicator;

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: PrismaHealthIndicator, useValue: prismaHealthIndicator },
      ],
    }).compile();

    const controller = module.get(HealthController);

    await controller.check();

    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(prismaHealthIndicator.isHealthy).toHaveBeenCalledWith('database');
  });
});
