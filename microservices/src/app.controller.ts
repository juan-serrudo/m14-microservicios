import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseDTO } from './dto/response.dto';

@ApiTags('INICIO')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Permite verificar si el servicio está funcionando.',
  })
  getPing(): ResponseDTO {
    return this.appService.getPing();
  }
}
