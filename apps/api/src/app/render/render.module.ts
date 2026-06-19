import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';

/**
 * Generic HTML → PDF/PNG/DOCX rendering. Needs headless Chrome at `CHROME_URL`
 * (Browserless) or `PUPPETEER_EXECUTABLE_PATH` (local Chromium). Output is
 * stored via StorageService.
 */
@Module({
  imports: [StorageModule],
  controllers: [RenderController],
  providers: [RenderService],
  exports: [RenderService],
})
export class RenderModule {}
