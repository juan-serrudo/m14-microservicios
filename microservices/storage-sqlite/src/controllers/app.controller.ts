import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('INICIO')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({
    summary: 'Health check del servicio',
    description: 'Retorna el estado del servicio de almacenamiento',
  })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
  getHealth() {
    return {
      status: 'ok',
      service: 'storage-sqlite',
      timestamp: new Date().toISOString(),
    };
  }
}

