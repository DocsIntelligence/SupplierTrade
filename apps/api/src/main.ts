import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const globalPrefix = config.get<string>('GLOBAL_PREFIX') ?? 'api';
  const port = config.get<number>('PORT') ?? 3000;
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200';

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({ origin: corsOrigin.split(','), credentials: true });
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();

  await app.listen(port);
  Logger.log(`🚀 API running at http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
