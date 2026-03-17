import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/docs`);
}

bootstrap();
