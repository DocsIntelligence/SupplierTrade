import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QcService } from './qc.service';

@ApiTags('qc')
@ApiBearerAuth('bearer')
@Controller('qc')
@UseGuards(JwtAuthGuard)
export class QcController {
  constructor(private readonly qc: QcService) {}

  @Post('listings/:id')
  @ApiOperation({ summary: 'Score a listing against the domain QC profile' })
  score(
    @Param('id') id: string,
    @Body() body: { criteria: Record<string, number> },
  ) {
    return this.qc.score(id, body.criteria ?? {});
  }

  @Get()
  @ApiOperation({ summary: 'List QC jobs in a domain' })
  list(@Query('domainKey') domainKey: string) {
    return this.qc.list(domainKey);
  }
}
