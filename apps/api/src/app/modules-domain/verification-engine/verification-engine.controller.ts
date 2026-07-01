import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VerificationEngineService } from './verification-engine.service';

@ApiTags('verification-engine')
@ApiBearerAuth('bearer')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class VerificationEngineController {
  constructor(private readonly engine: VerificationEngineService) {}

  @Post(':id/verify')
  @ApiOperation({
    summary: 'Run graded verification for a supplier and advance its workflow',
  })
  verify(@Param('id') id: string) {
    return this.engine.run(id);
  }

  @Get(':id/verification-reports')
  @ApiOperation({ summary: 'List graded verification reports for a supplier' })
  reports(@Param('id') id: string) {
    return this.engine.reports(id);
  }
}
