import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import { AppController } from './controllers/app.controller';
import { PasswordController } from './controllers/password.controller';
import { PasswordService } from './services/password.service';
import { StorageClientService } from './services/storage-client.service';
import { CipherService } from './services/cipher.service';
import { OAuth2Service } from './services/oauth2.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 3000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AppController, PasswordController],
  providers: [PasswordService, StorageClientService, CipherService, OAuth2Service],
})
export class AppModule {}

