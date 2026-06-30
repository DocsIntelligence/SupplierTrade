import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhooksService } from './webhooks.service';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(private readonly webhooks: WebhooksService) {
    super();
  }

  async process(job: Job<{ deliveryId: string }>): Promise<void> {
    this.logger.debug(`Delivering webhook ${job.data.deliveryId} attempt ${job.attemptsMade + 1}`);
    await this.webhooks.deliverNow(job.data.deliveryId);
  }
}
