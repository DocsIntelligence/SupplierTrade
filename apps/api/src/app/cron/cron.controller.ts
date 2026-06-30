import { Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CronJobs } from './cron.jobs';

@ApiTags('cron')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/cron')
export class CronController {
  constructor(
    private readonly jobs: CronJobs,
    private readonly registry: SchedulerRegistry,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List registered cron jobs' })
  list() {
    const out: Array<{ name: string; running: boolean }> = [];
    for (const [name, job] of this.registry.getCronJobs()) {
      out.push({ name, running: job.isActive });
    }
    return out;
  }

  @Post(':name/run')
  @ApiOperation({ summary: 'Trigger a cron job once, now' })
  async run(@Param('name') name: string) {
    const runner = this.jobs.manualRunners()[name];
    if (!runner) throw new NotFoundException(`No runner for job "${name}"`);
    const result = await runner();
    return { name, result };
  }
}
