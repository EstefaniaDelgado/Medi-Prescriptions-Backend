import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { JwtExceptionFilter } from './common/filters/jwt-exception.filter';
import { RolesExceptionFilter } from './common/filters/roles-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Aplicar filtros globales para errores JWT y Roles
  app.useGlobalFilters(new JwtExceptionFilter(), new RolesExceptionFilter());

  const frontendUrl = process.env.APP_ORIGIN ?? 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(cookieParser());

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Prescriptions API')
    .setDescription('API para gestión de prescripciones médicas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  Logger.error(err);
});
