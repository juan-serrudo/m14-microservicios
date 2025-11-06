import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClientService } from '../services/storage-client.service';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly storageClient: StorageClientService,
  ) {}

  @Get('health')
  getHealth() {
    const instanceId = process.env.SERVICE_INSTANCE_ID || 'unknown';
    const circuitBreakerState = this.storageClient.getCircuitBreakerState();

    return {
      status: 'ok',
      service: 'password-service',
      instanceId,
      circuitBreakerState,
      timestamp: new Date().toISOString(),
    };
  }
}

