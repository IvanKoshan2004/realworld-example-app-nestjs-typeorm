import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import * as cors from 'cors';
import { EntityNotFoundFilter } from './helpers/filters/entity-not-found.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<string>('PORT');
  const CORS_HOST = configService.get<string>('CORS_HOST');
  const CORS_PORT = configService.get<string>('CORS_PORT');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const errorDescriptions = {};
        errors.forEach((error) => {
          errorDescriptions[error.property] = [
            ...Object.values(error.constraints),
          ];
        });
        throw new UnprocessableEntityException({
          errors: errorDescriptions,
        });
      },
    }),
  );
  app.useGlobalFilters(new EntityNotFoundFilter());
  app.use(
    cors({
      origin: `http://${CORS_HOST}:${CORS_PORT}`,
      credentials: true,
    }),
  );

  await app.listen(PORT || 3000);
}
bootstrap();
