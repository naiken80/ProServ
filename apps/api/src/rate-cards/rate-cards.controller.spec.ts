import type { SessionUser } from '@proserv/shared';

import { RateCardsController } from './rate-cards.controller';
import type { RateCardsService } from './rate-cards.service';

describe('RateCardsController', () => {
  let controller: RateCardsController;
  let service: jest.Mocked<RateCardsService>;
  const user: SessionUser = {
    id: 'user-1',
    email: 'user@example.com',
    roles: [],
    givenName: 'Casey',
    familyName: 'Lee',
  };

  beforeEach(() => {
    service = {
      listRateCards: jest.fn(),
      getRateCard: jest.fn(),
      createRateCard: jest.fn(),
      updateRateCard: jest.fn(),
    } as unknown as jest.Mocked<RateCardsService>;

    controller = new RateCardsController(service);
  });

  it('retrieves rate cards via the service', async () => {
    const collection = {
      data: [],
      roles: [],
    };
    service.listRateCards.mockResolvedValue(collection);

    const result = await controller.listRateCards(user);

    expect(service.listRateCards).toHaveBeenCalledWith(user);
    expect(result).toBe(collection);
  });

  it('fetches a single rate card by id', async () => {
    const rateCard = {
      id: 'card-1',
      organizationId: 'org-1',
      name: 'Default FY25',
      currency: 'USD',
      validFrom: null,
      validTo: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      entries: [],
    };
    service.getRateCard.mockResolvedValue(rateCard as never);

    const result = await controller.getRateCard(user, 'card-1');

    expect(service.getRateCard).toHaveBeenCalledWith(user, 'card-1');
    expect(result).toBe(rateCard);
  });

  it('creates a rate card through the service', async () => {
    const dto = { name: 'Regional', currency: 'EUR' };
    const created = { id: 'card-2' };
    service.createRateCard.mockResolvedValue(created as never);

    const result = await controller.createRateCard(user, dto as never);

    expect(service.createRateCard).toHaveBeenCalledWith(user, dto);
    expect(result).toBe(created);
  });

  it('updates a rate card through the service', async () => {
    const dto = { name: 'Updated' };
    const updated = { id: 'card-3' };
    service.updateRateCard.mockResolvedValue(updated as never);

    const result = await controller.updateRateCard(user, 'card-3', dto as never);

    expect(service.updateRateCard).toHaveBeenCalledWith(user, 'card-3', dto);
    expect(result).toBe(updated);
  });
});
