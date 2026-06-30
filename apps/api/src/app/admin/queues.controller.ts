import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getQueueToken } from '@nestjs/bullmq';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

const KNOWN_QUEUES = ['mail', 'webhooks'] as const;

@ApiTags('admin-queues')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/queues')
export class QueuesController {
  constructor(private readonly moduleRef: ModuleRef) {}

  private getQueue(name: string): Queue | null {
    try {
      return this.moduleRef.get<Queue>(getQueueToken(name), { strict: false });
    } catch {
      return null;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List queue counts (BullMQ)' })
  async list() {
    const results: Array<{ name: string; counts?: Record<string, number>; available: boolean }> = [];
    for (const name of KNOWN_QUEUES) {
      const q = this.getQueue(name);
      if (!q) {
        results.push({ name, available: false });
        continue;
      }
      const counts = await q.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      );
      results.push({ name, available: true, counts });
    }
    return results;
  }

  @Get(':name/recent')
  @ApiOperation({ summary: 'Recent jobs for a queue' })
  async recent(@Param('name') name: string) {
    const q = this.getQueue(name);
    if (!q) return { available: false, jobs: [] };
    const jobs = await q.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 50);
    return {
      available: true,
      jobs: jobs.map((j) => ({
        id: j.id,
        name: j.name,
        status: j.finishedOn ? (j.failedReason ? 'failed' : 'completed') : 'pending',
        attempts: j.attemptsMade,
        progress: j.progress,
        failedReason: j.failedReason,
        timestamp: j.timestamp,
        finishedOn: j.finishedOn,
      })),
    };
  }
}
