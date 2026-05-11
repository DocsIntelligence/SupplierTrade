import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type {} from 'multer';
import type { User } from '@org/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Check if storage is configured' })
  getStatus() {
    return { enabled: this.storage.isEnabled() };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Query('folder') folder?: string,
  ) {
    return this.storage.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: folder ?? undefined,
      userId: user.id,
    });
  }

  @Post('presign/upload')
  @ApiOperation({ summary: 'Get a presigned URL for direct upload' })
  async getPresignedUpload(
    @Body() body: { filename: string; contentType: string; folder?: string },
    @CurrentUser() user: User,
  ) {
    const ext = body.filename.split('.').pop() ?? '';
    const key = body.folder
      ? `${body.folder}/${crypto.randomUUID()}.${ext}`
      : `${user.id}/${crypto.randomUUID()}.${ext}`;

    return this.storage.getPresignedUploadUrl(key, body.contentType);
  }

  @Post('presign/download')
  @ApiOperation({ summary: 'Get a presigned URL for download' })
  async getPresignedDownload(@Body() body: { key: string }) {
    const url = await this.storage.getPresignedDownloadUrl(body.key);
    return { url };
  }

  @Get('files')
  @ApiOperation({ summary: 'List files in user folder' })
  async listFiles(@CurrentUser() user: User, @Query('prefix') prefix?: string) {
    return this.storage.list(prefix ?? `${user.id}/`);
  }

  @Delete('{*key}')
  @ApiOperation({ summary: 'Delete a file by key' })
  async deleteFile(@Param('key') key: string) {
    await this.storage.delete(key);
    return { message: 'File deleted' };
  }
}
