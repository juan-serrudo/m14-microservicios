import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppDataSource } from './config/data-source';
import { configSwagger } from './helpers/swagger.helper';

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

  const port = configService.get<number>('port') || 3001;
  const swaggerShow = configService.get<boolean>('swaggerShow');

  // Configurar Swagger si está habilitado
  if (swaggerShow) {
    configSwagger(app);
    console.log(`📚 Swagger disponible en: http://0.0.0.0:${port}/api`);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Storage SQLite service is running on: http://0.0.0.0:${port}`);
}

bootstrap();

