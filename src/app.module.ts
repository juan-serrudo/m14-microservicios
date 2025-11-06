import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configurations/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PasswordManagerController } from './modules/password-manager/password-manager.controller';
import { PasswordManagerService } from './modules/password-manager/password-manager.service';
import { databaseProviders } from './providers/database.providers';
import { passwordManagerProviders } from './providers/password-manager.providers';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      expandVariables: true,
      isGlobal: true
    }),
  ],
  controllers: [
    AppController,
    PasswordManagerController,
  ],
  providers: [
    AppService,
    PasswordManagerService,
    ...databaseProviders,
    ...passwordManagerProviders,
  ],
  exports: [
    ...databaseProviders,
    ...passwordManagerProviders,
  ],
})

export class AppModule {}
