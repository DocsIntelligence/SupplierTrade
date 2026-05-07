import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('REQ');

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    res.on('finish', () => {
      const elapsed = Date.now() - started;
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} +${elapsed}ms`,
      );
    });
    next();
  }
}
