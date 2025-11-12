import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from './config/data-source';
import { configSwagger } from './helpers/swagger.helper';
import { bold } from 'chalk';
import { KafkaConsumerService } from './infrastructure/kafka.consumer';
import { AuditPasswordEvents } from './entities/audit-password-events.entity';

async function runMigrations() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    // No lanzar error, puede que las migraciones ya estén aplicadas
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar TypeORM con PRAGMA WAL
  const dataSource = app.get(DataSource);
  if (dataSource && dataSource.isInitialized) {
    try {
      await dataSource.query('PRAGMA journal_mode = WAL;');
      await dataSource.query('PRAGMA synchronous = NORMAL;');
      await dataSource.query('PRAGMA cache_size = 10000;');
      await dataSource.query('PRAGMA foreign_keys = ON;');
      console.log('Database configured with WAL mode');
    } catch (error) {
      console.warn('Warning: Could not configure database:', error.message);
    }
  }

  // Ejecutar migraciones usando el DataSource de configuración
  const configService = app.get(ConfigService);
  process.env.SQLITE_DB_PATH = configService.get<string>('sqliteDbPath');
  await runMigrations();

  const packageJson = configService.get('packageJson');
  const port = configService.get<number>('port') || 3001;

  // Configurar Swagger si está habilitado
  if (configService.get('swaggerShow')) {
    configSwagger(app, packageJson);
  }

  // Iniciar Kafka consumer (en background, no bloquea el inicio)
  let kafkaConsumer: KafkaConsumerService | null = null;
  try {
    const auditRepository = app.get(DataSource).getRepository(AuditPasswordEvents);
    kafkaConsumer = new KafkaConsumerService(auditRepository);
    // Iniciar en background sin bloquear
    kafkaConsumer.start().catch((error) => {
      console.warn(bold.yellow('⚠️  Error starting Kafka consumer:'), error);
    });
    // Dar tiempo para conectar
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.warn(bold.yellow('⚠️  Failed to initialize Kafka consumer, continuing without events:'), error);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log(bold.yellow('SIGTERM received, shutting down gracefully...'));
    if (kafkaConsumer) {
      await kafkaConsumer.stop();
    }
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log(bold.yellow('SIGINT received, shutting down gracefully...'));
    if (kafkaConsumer) {
      await kafkaConsumer.stop();
    }
    await app.close();
    process.exit(0);
  });

  await app.listen(port, '0.0.0.0');
  console.log(bold.blue(`🚀 Storage SQLite service is running on: http://0.0.0.0:${port}`));
  if (configService.get('swaggerShow')) {
    console.log(bold.green(`📚 Swagger documentation available at: http://0.0.0.0:${port}/api`));
  }
  if (kafkaConsumer) {
    console.log(bold.green(`📨 Kafka consumer listening to topic: ${configService.get('kafkaTopicPasswordEvents')}`));
  }
}

bootstrap();

