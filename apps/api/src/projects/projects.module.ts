import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SessionGuard } from '../auth/session.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, SessionGuard],
})
export class ProjectsModule {}
