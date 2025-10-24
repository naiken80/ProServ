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

import { GetProjectSummariesDto } from './dto/get-project-summaries.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { ActiveUser } from '../auth/session-user.decorator';
import { SessionGuard } from '../auth/session.guard';

@Controller({ path: 'projects', version: '1' })
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjectSummaries(
    @ActiveUser() user: SessionUser,
    @Query() query: GetProjectSummariesDto,
  ) {
    return this.projectsService.getProjectSummaries(user, query);
  }

  @Get(':id')
  getProjectWorkspace(
    @ActiveUser() user: SessionUser,
    @Param('id') id: string,
  ) {
    return this.projectsService.getProjectWorkspace(user, id);
  }

  @Post()
  createProject(
    @ActiveUser() user: SessionUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(user, dto);
  }

  @Patch(':id')
  updateProject(
    @ActiveUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(user, id, dto);
  }
}
