import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { APP_DEFAULTS, SESSION_HEADER_KEY } from './common/constants';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Back-Office User & Session Management API')
    .setDescription('REST API for managing back-office users and active authentication sessions')
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', name: SESSION_HEADER_KEY, in: 'header' },
      SESSION_HEADER_KEY,
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(APP_DEFAULTS.SWAGGER_PATH, app, document);

  const port = Number(process.env.PORT || APP_DEFAULTS.PORT);
  await app.listen(port);
}

bootstrap();
