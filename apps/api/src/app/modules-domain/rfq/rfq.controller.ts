import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  closeRfqSchema,
  createRfqLineSchema,
  createRfqResponseSchema,
  createRfqSchema,
  recordBuyerValidationSignalSchema,
  rfqListQuerySchema,
  updateRfqResponseSchema,
  type CloseRfqDto,
  type CreateRfqDto,
  type CreateRfqLineDto,
  type CreateRfqResponseDto,
  type RecordBuyerValidationSignalDto,
  type RfqListQuery,
  type UpdateRfqResponseDto,
  type User,
} from '@org/dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RfqService } from './rfq.service';

@ApiTags('rfq')
@ApiBearerAuth('bearer')
@Controller('rfqs')
@UseGuards(JwtAuthGuard)
export class RfqController {
  constructor(private readonly rfq: RfqService) {}

  @Post()
  @ApiOperation({ summary: 'Create an RFQ with commodity lines' })
  create(
    @Body(new ZodValidationPipe(createRfqSchema)) dto: CreateRfqDto,
    @CurrentUser() user: User,
  ) {
    return this.rfq.create(dto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs (server-side pagination + search + sort)' })
  list(
    @Query(new ZodValidationPipe(rfqListQuerySchema)) query: RfqListQuery,
  ) {
    return this.rfq.list(query);
  }

  @Get('validation-summary')
  @ApiOperation({ summary: 'Paid-intent metrics for the validation dashboard' })
  validationSummary(@Query('domainKey') domainKey: string) {
    return this.rfq.validationSummary(domainKey);
  }

  @Get(':id')
  @ApiOperation({ summary: 'RFQ detail with lines, responses, validation signals' })
  get(@Param('id') id: string) {
    return this.rfq.get(id);
  }

  @Post(':id/lines')
  @ApiOperation({ summary: 'Add a commodity line' })
  addLine(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createRfqLineSchema)) dto: CreateRfqLineDto,
  ) {
    return this.rfq.addLine(id, dto);
  }

  @Post(':id/open')
  @ApiOperation({ summary: 'Publish/open the RFQ' })
  open(@Param('id') id: string) {
    return this.rfq.open(id);
  }

  @Post(':id/matches/generate')
  @ApiOperation({ summary: 'Generate deterministic supplier/listing matches' })
  generate(@Param('id') id: string) {
    return this.rfq.generateMatches(id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Ranked supplier/listing suggestions' })
  matches(@Param('id') id: string) {
    return this.rfq.matches(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Supplier or manual response to an RFQ' })
  addResponse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createRfqResponseSchema))
    dto: CreateRfqResponseDto,
  ) {
    return this.rfq.addResponse(id, dto);
  }

  @Patch(':id/responses/:rid')
  @ApiOperation({ summary: 'Update a response status/quote' })
  updateResponse(
    @Param('id') id: string,
    @Param('rid') rid: string,
    @Body(new ZodValidationPipe(updateRfqResponseSchema))
    dto: UpdateRfqResponseDto,
  ) {
    return this.rfq.updateResponse(id, rid, dto);
  }

  @Post(':id/qc-requests')
  @ApiOperation({ summary: 'Request QC for a shortlisted listing' })
  requestQc(@Param('id') id: string, @Body('listingId') listingId: string) {
    return this.rfq.requestQc(id, listingId);
  }

  @Post(':id/validation')
  @ApiOperation({ summary: 'Record buyer willingness-to-pay / paid intent' })
  recordValidation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordBuyerValidationSignalSchema))
    dto: RecordBuyerValidationSignalDto,
  ) {
    return this.rfq.recordValidation(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Award / close / cancel the RFQ' })
  close(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeRfqSchema)) dto: CloseRfqDto,
  ) {
    return this.rfq.close(id, dto);
  }
}
