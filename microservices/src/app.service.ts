import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { ResponseDTO } from './dto/response.dto';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getPing(): ResponseDTO {
    const packageJson = this.configService.get<any>('packageJson');

    return {
      error: false,
      message: packageJson?.description,
      response: {
        data: {
          author: packageJson.author,
          dateTimeServer: DateTime.now().toJSDate(),
          nameApp: packageJson?.name,
          version: packageJson?.version,
        },
      },
      status: 200,
    };
  }
}
