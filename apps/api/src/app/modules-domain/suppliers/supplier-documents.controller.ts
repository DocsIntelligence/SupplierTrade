import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document (docKey from config)' })
  addDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docKey') docKey: string,
  ) {
    return this.docs.addDocument(id, docKey, file);
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
