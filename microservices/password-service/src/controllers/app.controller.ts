import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { StorageClientService } from '../services/storage-client.service';

@ApiTags('INICIO')
@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly storageClient: StorageClientService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check del servicio',
    description: 'Retorna el estado del servicio y del circuit breaker',
  })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
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

