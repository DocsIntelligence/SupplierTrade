import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {} from 'multer';
import { reviewDocumentSchema, type ReviewDocumentDto, type User } from '@org/dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SupplierDocumentsService } from './supplier-documents.service';

@ApiTags('supplier-documents')
@ApiBearerAuth('bearer')
@Controller('suppliers/:id')
@UseGuards(JwtAuthGuard)
export class SupplierDocumentsController {
  constructor(private readonly docs: SupplierDocumentsService) {}

  @Get('requirements')
  @ApiOperation({ summary: 'Config-driven required documents + media for a supplier' })
  requirements(@Param('id') id: string) {
    return this.docs.requirements(id);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List uploaded documents' })
  listDocuments(@Param('id') id: string) {
    return this.docs.listDocuments(id);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        docKey: { type: 'string' },
        label: { type: 'string' },
        note: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a document (config docKey or "other" for a custom doc)',
  })
  addDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docKey') docKey: string,
    @CurrentUser() user: User,
    @Body('label') label?: string,
    @Body('note') note?: string,
  ) {
    return this.docs.addDocument(id, docKey, file, {
      label,
      note,
      uploadedById: user?.id,
    });
  }

  @Patch('documents/:docId/review')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Accept or reject a document (admin)' })
  reviewDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body(new ZodValidationPipe(reviewDocumentSchema)) dto: ReviewDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.docs.reviewDocument(id, docId, dto, user?.id);
  }

  @Delete('documents/:docId')
  @ApiOperation({ summary: 'Delete a document' })
  deleteDocument(@Param('id') id: string, @Param('docId') docId: string) {
    return this.docs.deleteDocument(id, docId);
  }

  @Get('media')
  @ApiOperation({ summary: 'List captured media' })
  listMedia(@Param('id') id: string) {
    return this.docs.listMedia(id);
  }

  @Post('media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        mediaKey: { type: 'string' },
        geoLat: { type: 'number' },
        geoLng: { type: 'number' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload media (mediaKey from config)' })
  addMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('mediaKey') mediaKey: string,
    @Body('geoLat') geoLat?: string,
    @Body('geoLng') geoLng?: string,
  ) {
    return this.docs.addMedia(id, {
      mediaKey,
      file,
      geoLat: geoLat ? Number(geoLat) : undefined,
      geoLng: geoLng ? Number(geoLng) : undefined,
    });
  }
}
