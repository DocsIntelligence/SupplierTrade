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
import { createListingSchema, type CreateListingDto } from '@org/dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@ApiBearerAuth('bearer')
@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a listing (config-validated attributes)' })
  create(
    @Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingDto,
  ) {
    return this.listings.create(dto);
  }

  @Get()
  list(@Query('domainKey') domainKey: string) {
    return this.listings.list(domainKey);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.listings.get(id);
  }
}
