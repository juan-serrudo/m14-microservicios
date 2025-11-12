import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { configSwagger } from './helpers/swagger.helper';
import { bold } from 'chalk';
import { kafkaProducer } from './infrastructure/kafka.producer';

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

  // Conectar Kafka producer si EDA está habilitado
  const useEda = configService.get<boolean>('useEda');
  if (useEda) {
    try {
      await kafkaProducer.connect();
      console.log(bold.green('📨 Kafka producer connected'));
    } catch (error) {
      console.warn(bold.yellow('⚠️  Failed to connect Kafka producer, continuing without events'));
    }
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log(bold.yellow('SIGTERM received, shutting down gracefully...'));
    if (useEda) {
      await kafkaProducer.disconnect();
    }
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log(bold.yellow('SIGINT received, shutting down gracefully...'));
    if (useEda) {
      await kafkaProducer.disconnect();
    }
    await app.close();
    process.exit(0);
  });

  await app.listen(port, '0.0.0.0');
  console.log(bold.blue(`🚀 Password Service (${instanceId}) is running on: http://0.0.0.0:${port}`));
  if (configService.get('swaggerShow')) {
    console.log(bold.green(`📚 Swagger documentation available at: http://0.0.0.0:${port}/api`));
  }
  if (useEda) {
    console.log(bold.green(`📨 Kafka EDA enabled - publishing events to topic: ${configService.get('kafkaTopicPasswordEvents')}`));
  }
}

bootstrap();

