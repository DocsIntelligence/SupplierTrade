import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigController } from './config.controller';
import { TypedConfigService } from './config.service';
import { validateEnv } from './schema';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],
  controllers: [ConfigController],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class AppConfigModule {}
