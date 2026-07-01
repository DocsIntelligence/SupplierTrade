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
import {
  createSupplierSchema,
  supplierListQuerySchema,
  type CreateSupplierDto,
  type SupplierListQuery,
  type User,
} from '@org/dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth('bearer')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier in a domain (config-validated)' })
  create(
    @Body(new ZodValidationPipe(createSupplierSchema)) dto: CreateSupplierDto,
  ) {
    return this.suppliers.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List suppliers (server-side pagination + search + sort)',
  })
  list(
    @Query(new ZodValidationPipe(supplierListQuerySchema))
    query: SupplierListQuery,
  ) {
    return this.suppliers.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier' })
  get(@Param('id') id: string) {
    return this.suppliers.get(id);
  }

  @Post(':id/events/:event')
  @ApiOperation({ summary: 'Fire a workflow event (e.g. submit)' })
  transition(
    @Param('id') id: string,
    @Param('event') event: string,
    @CurrentUser() user: User,
  ) {
    return this.suppliers.transition(id, event, user?.id);
  }
}
