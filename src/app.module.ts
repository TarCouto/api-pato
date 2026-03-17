import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestLogService } from './common/services/request-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [
    RequestLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
