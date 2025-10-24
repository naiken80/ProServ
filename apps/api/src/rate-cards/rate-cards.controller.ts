import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { SessionUser } from '@proserv/shared';

import { ActiveUser } from '../auth/session-user.decorator';
import { SessionGuard } from '../auth/session.guard';

import { CreateRateCardDto } from './dto/create-rate-card.dto';
import { UpdateRateCardDto } from './dto/update-rate-card.dto';
import { RateCardsService } from './rate-cards.service';

@Controller({ path: 'rate-cards', version: '1' })
@UseGuards(SessionGuard)
export class RateCardsController {
  constructor(private readonly rateCardsService: RateCardsService) {}

  @Get()
  listRateCards(@ActiveUser() user: SessionUser) {
    return this.rateCardsService.listRateCards(user);
  }

  @Get(':id')
  getRateCard(@ActiveUser() user: SessionUser, @Param('id') id: string) {
    return this.rateCardsService.getRateCard(user, id);
  }

  @Post()
  createRateCard(
    @ActiveUser() user: SessionUser,
    @Body() dto: CreateRateCardDto,
  ) {
    return this.rateCardsService.createRateCard(user, dto);
  }

  @Patch(':id')
  updateRateCard(
    @ActiveUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateRateCardDto,
  ) {
    return this.rateCardsService.updateRateCard(user, id, dto);
  }
}
