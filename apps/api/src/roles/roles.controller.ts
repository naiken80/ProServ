import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { SessionUser } from '@proserv/shared';

import { ActiveUser } from '../auth/session-user.decorator';
import { SessionGuard } from '../auth/session.guard';

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ListRolesQueryDto } from './dto/list-roles.dto';

@Controller({ path: 'roles', version: '1' })
@UseGuards(SessionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  listRoles(
    @ActiveUser() user: SessionUser,
    @Query() query: ListRolesQueryDto,
  ) {
    return this.rolesService.listRoles(user, query);
  }

  @Post()
  createRole(
    @ActiveUser() user: SessionUser,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(user, dto);
  }

  @Patch(':id')
  updateRole(
    @ActiveUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(user, id, dto);
  }

  @Post(':id/archive')
  archiveRole(
    @ActiveUser() user: SessionUser,
    @Param('id') id: string,
  ) {
    return this.rolesService.archiveRole(user, id);
  }
}

