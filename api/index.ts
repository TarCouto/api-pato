import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/config/swagger.config';

const server = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );
    app.enableCors();
    setupSwagger(app);
    await app.init();
    cachedApp = app;
  }
  return server;
}

export default async (req: any, res: any) => {
  const serverInstance = await bootstrap();
  serverInstance(req, res);
};
