import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AppController } from './controllers/app.controller';
import { StorageController } from './controllers/storage.controller';
import { AuditController } from './controllers/audit.controller';
import { StorageService } from './services/storage.service';
import { PasswordManager } from './entities/password-manager.entity';
import { AuditPasswordEvents } from './entities/audit-password-events.entity';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'sqlite',
          database: configService.get<string>('sqliteDbPath'),
          entities: [PasswordManager, AuditPasswordEvents],
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          synchronize: false,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([PasswordManager, AuditPasswordEvents]),
  ],
  controllers: [AppController, StorageController, AuditController],
  providers: [StorageService, ApiKeyGuard],
})
export class AppModule {}

