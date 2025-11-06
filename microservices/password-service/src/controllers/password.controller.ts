import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { PasswordService } from '../services/password.service';
import { CreatePasswordDto, UpdatePasswordDto, DecryptPasswordDto } from '../dto/password.dto';

@Controller('api/v1/passwords')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreatePasswordDto) {
    const result = await this.passwordService.create(createDto);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const result = await this.passwordService.findAll();
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const result = await this.passwordService.findOne(+id);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateDto: UpdatePasswordDto) {
    const result = await this.passwordService.update(+id, updateDto);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Query('masterKey') masterKey: string) {
    if (!masterKey) {
      throw new HttpException(
        {
          code: 'MISSING_MASTER_KEY',
          message: 'La clave maestra es requerida',
          traceId: '',
          retryable: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.passwordService.delete(+id, masterKey);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Post(':id/decrypt')
  @HttpCode(HttpStatus.OK)
  async decrypt(@Param('id') id: string, @Body() decryptDto: DecryptPasswordDto) {
    const result = await this.passwordService.decrypt(+id, decryptDto);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  private getHttpStatus(code: string): HttpStatus {
    const statusMap: Record<string, HttpStatus> = {
      NOT_FOUND: HttpStatus.NOT_FOUND,
      INVALID_MASTER_KEY: HttpStatus.UNAUTHORIZED,
      CIRCUIT_BREAKER_OPEN: HttpStatus.SERVICE_UNAVAILABLE,
      STORAGE_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
      STORAGE_ERROR: HttpStatus.BAD_GATEWAY,
      INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
      MISSING_MASTER_KEY: HttpStatus.BAD_REQUEST,
    };
    return statusMap[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

