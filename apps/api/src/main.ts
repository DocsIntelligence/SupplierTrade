import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const globalPrefix = config.get<string>('GLOBAL_PREFIX') ?? 'api';
  const port = config.get<number>('PORT') ?? 7130;
  const corsOrigin =
    config.get<string>('CORS_ORIGIN') ?? 'http://localhost:7100';
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  // Signals are handled explicitly in setupGracefulShutdown (below), which
  // calls app.close() — that runs all onModuleDestroy/onApplicationShutdown
  // hooks (e.g. DB disconnect). We don't also call enableShutdownHooks() to
  // avoid two signal listeners racing to close the app.

  // ─── Swagger ────────────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('@org/api')
      .setDescription('Backend API — Auth, Users, Health')
      .setVersion('1.0.0')
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'HttpOnly cookie set on login/register',
      })
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer',
      )
      .addTag('auth', 'Authentication & session management')
      .addTag('users', 'User management')
      .addTag('health', 'Health checks')
      .addTag('config', 'Public configuration')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      customCssUrl:
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
      customJs: [
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
      ],
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    Logger.log(`📖 Swagger at http://localhost:${port}/docs`);
  }

  await app.listen(port);
  Logger.log(`🚀 API running at http://localhost:${port}/${globalPrefix}`);

  setupGracefulShutdown(app, port);
}

/**
 * Close the HTTP server (releasing the port) and run Nest shutdown hooks on
 * SIGINT/SIGTERM, then exit. A force-exit timer guards against a hung close
 * (e.g. a lingering DB/Redis handle keeping the event loop alive) so the port
 * never stays bound. SIGKILL (`kill -9`) can't be caught — use SIGTERM/SIGINT.
 */
function setupGracefulShutdown(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  port: number,
) {
  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return; // ignore repeated signals
    shuttingDown = true;
    Logger.log(`Received ${signal} — shutting down gracefully…`);

    // Hard stop if graceful close hasn't finished in time; `unref` so the timer
    // itself doesn't keep the process alive.
    const force = setTimeout(() => {
      Logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
    force.unref();

    try {
      await app.close();
      Logger.log(`Port ${port} released. Bye 👋`);
      process.exit(0);
    } catch (err) {
      Logger.error(`Error during shutdown: ${(err as Error).message}`);
      process.exit(1);
    }
  };

  (['SIGINT', 'SIGTERM', 'SIGHUP'] as NodeJS.Signals[]).forEach((sig) =>
    process.once(sig, () => void shutdown(sig)),
  );
}

void bootstrap();
