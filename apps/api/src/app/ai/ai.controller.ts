import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { User } from '@org/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

interface GenerateBody {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string; // Force a specific provider
  stream?: boolean;
}

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available AI providers' })
  getProviders() {
    return { providers: this.aiService.getAvailableProviders() };
  }

  /**
   * Server-side: full response (JSON)
   * Client-side: streaming (SSE) when body.stream = true
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate AI response (supports streaming via SSE)',
  })
  async generate(
    @Body() body: GenerateBody,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { prompt, systemPrompt, temperature, maxTokens, provider, stream } =
      body;

    if (!prompt?.trim()) {
      return { error: 'Prompt is required' };
    }

    const options = { systemPrompt, temperature, maxTokens };

    // ─── Streaming (SSE) ──────────────────────────────────────────
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      try {
        for await (const chunk of this.aiService.stream(prompt, options)) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write(`data: [DONE]\n\n`);
      } catch (error) {
        res.write(
          `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`,
        );
      }
      res.end();
      return;
    }

    // ─── Full response (JSON) ─────────────────────────────────────
    if (provider) {
      return this.aiService.generateWith(provider, prompt, options);
    }
    return this.aiService.generate(prompt, options);
  }
}
