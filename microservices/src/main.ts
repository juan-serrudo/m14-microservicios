import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { bold } from 'chalk';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

import { getCors } from './helpers/cors.helper';
import { ResponseFormatInterceptor } from './interceptors/response-format.interceptor';
import { configSwagger } from './helpers/swagger.helper';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableVersioning({ type: VersioningType.URI });
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // compression
  app.use(compression());

  const envService = app.get(ConfigService);
  const packageJson = envService.get('packageJson');
  app.enableCors({
    origin: getCors({
      env_mode: envService.get('ENV_ENTORNO') || '',
      env_cors: envService.get('ENV_CORS') || '',
    }),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(json({ limit: envService.get('appMaxSize') || '10mb' }));
  app.use(urlencoded({ limit: envService.get('appMaxSize') || '10mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Interceptors globales
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  if (envService.get('ENV_SWAGGER_SHOW')) configSwagger(app, packageJson);

  const port = envService.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0').then(async () => {
    console.log(bold.blue('🚀 API is listening ON PORT', (await app.getUrl()) + '/api'));
  });
}
bootstrap();
