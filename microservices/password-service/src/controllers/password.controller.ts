import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PasswordService } from '../services/password.service';
import { CreatePasswordDto, UpdatePasswordDto, DecryptPasswordDto } from '../dto/password.dto';

@ApiTags('GESTOR DE CONTRASEÑAS')
@Controller('api/v1/passwords')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva entrada de contraseña',
    description: 'Crea una nueva entrada de contraseña con cifrado AES y hash de la clave maestra',
  })
  @ApiResponse({ status: 201, description: 'Contraseña creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async create(@Body() createDto: CreatePasswordDto) {
    const result = await this.passwordService.create(createDto);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las entradas de contraseñas',
    description: 'Retorna una lista de todas las entradas de contraseñas almacenadas (sin mostrar las contraseñas cifradas)',
  })
  @ApiResponse({ status: 200, description: 'Lista de contraseñas obtenida exitosamente' })
  async findAll() {
    const result = await this.passwordService.findAll();
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una entrada específica',
    description: 'Retorna los detalles de una entrada específica (sin mostrar la contraseña cifrada)',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada', type: 'number' })
  @ApiResponse({ status: 200, description: 'Entrada obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  async findOne(@Param('id') id: string) {
    const result = await this.passwordService.findOne(+id);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar entrada de contraseña',
    description: 'Actualiza una entrada existente. Requiere la clave maestra para verificación',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a actualizar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'Clave maestra incorrecta' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  async update(@Param('id') id: string, @Body() updateDto: UpdatePasswordDto) {
    const result = await this.passwordService.update(+id, updateDto);
    if ('error' in result) {
      throw new HttpException(result.error, this.getHttpStatus(result.error.code));
    }
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar entrada de contraseña',
    description: 'Elimina una entrada existente. Requiere la clave maestra para verificación',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a eliminar', type: 'number' })
  @ApiQuery({ name: 'masterKey', description: 'Clave maestra para verificación', type: 'string' })
  @ApiResponse({ status: 200, description: 'Contraseña eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'Clave maestra incorrecta' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
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
  @ApiOperation({
    summary: 'Descifrar contraseña',
    description: 'Descifra y retorna la contraseña original. Requiere la clave maestra correcta',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a descifrar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contraseña descifrada exitosamente' })
  @ApiResponse({ status: 401, description: 'Clave maestra incorrecta' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
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

