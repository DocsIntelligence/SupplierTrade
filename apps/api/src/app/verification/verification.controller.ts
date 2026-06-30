import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiCookieAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VerificationService, SubmitVerificationInput } from './verification.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('verification')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  @ApiOperation({ summary: 'My verification records' })
  list(@CurrentUser() user: CurrentUserRef) {
    return this.verification.list(user.id);
  }

  /**
   * Submit a verification request. Optionally upload one evidence file
   * (image / pdf) under the `evidence` form-data field. Free-form `payload`
   * is JSON-stringified in the form data — the server parses it.
   */
  @Post()
  @UseInterceptors(FileInterceptor('evidence'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a verification request' })
  submit(
    @CurrentUser() user: CurrentUserRef,
    @Body() body: { kind: string; payload?: string },
    @UploadedFile() evidence?: Express.Multer.File,
  ) {
    const input: SubmitVerificationInput = {
      kind: body.kind,
      payload: body.payload ? safeParse(body.payload) : undefined,
      evidence: evidence
        ? {
            buffer: evidence.buffer,
            filename: evidence.originalname,
            mimetype: evidence.mimetype,
          }
        : undefined,
    };
    return this.verification.submit(user.id, input);
  }
}

function safeParse(s: string): Record<string, unknown> | undefined {
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}
