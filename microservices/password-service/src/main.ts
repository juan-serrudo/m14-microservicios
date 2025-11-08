import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { configSwagger } from './helpers/swagger.helper';
import { bold } from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const packageJson = configService.get('packageJson');
  const port = configService.get<number>('port') || 3000;
  const instanceId = process.env.SERVICE_INSTANCE_ID || 'unknown';

  // Configurar Swagger si está habilitado
  if (configService.get('swaggerShow')) {
    configSwagger(app, packageJson);
  }

  await app.listen(port, '0.0.0.0');
  console.log(bold.blue(`🚀 Password Service (${instanceId}) is running on: http://0.0.0.0:${port}`));
  if (configService.get('swaggerShow')) {
    console.log(bold.green(`📚 Swagger documentation available at: http://0.0.0.0:${port}/api`));
  }
}

bootstrap();

