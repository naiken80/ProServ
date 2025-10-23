import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { GetProjectSummariesDto } from './dto/get-project-summaries.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjectSummaries(@Query() query: GetProjectSummariesDto) {
    return this.projectsService.getProjectSummaries(query);
  }

  @Get(':id')
  getProjectSummary(@Param('id') id: string) {
    return this.projectsService.getProjectSummary(id);
  }

  @Post()
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Patch(':id')
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, dto);
  }
}
