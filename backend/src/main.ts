import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_DEFAULTS, SESSION_HEADER_KEY } from './common/constants'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(APP_DEFAULTS.API_GLOBAL_PREFIX);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || APP_DEFAULTS.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', SESSION_HEADER_KEY],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT || APP_DEFAULTS.PORT);
  await app.listen(port);
}

bootstrap();
