import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { NotFoundFilter } from './filters/not-found.filter';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.enableCors({
    origin: ['http://localhost:3003', 'http://127.0.0.1:3003'],
    methods: 'GET,POST,PUT',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.useGlobalFilters(new NotFoundFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
