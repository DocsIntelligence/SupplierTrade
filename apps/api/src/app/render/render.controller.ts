import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@org/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenderHtmlDto, type RenderHtmlInput } from './render.dto';
import { RenderService } from './render.service';

/**
 * Generic document renderer. POST HTML, get back a stored PDF / PNG / DOCX
 * download URL. Domain-agnostic — pair it with the @org/ui rich-text editor
 * (whose output is HTML) for a complete author → export flow.
 */
@ApiTags('render')
@Controller('render')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
export class RenderController {
  constructor(private readonly render: RenderService) {}

  @Post()
  @ApiOperation({ summary: 'Render HTML to a PDF / PNG / DOCX and return a download URL' })
  renderHtml(@CurrentUser() user: User, @Body() body: RenderHtmlDto) {
    return this.render.render(body as RenderHtmlInput, user.id);
  }
}
