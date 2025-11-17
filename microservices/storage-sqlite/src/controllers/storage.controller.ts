import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from '../services/storage.service';
import { JwtGuard } from '../guards/jwt.guard';
import { PasswordManager } from '../entities/password-manager.entity';

@ApiTags('STORAGE - PASSWORD MANAGER')
@ApiBearerAuth()
@ApiSecurity('Bearer')
@Controller('api/v1/storage/password_manager')
@UseGuards(JwtGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las entradas',
    description: 'Retorna todas las entradas de la tabla password_manager',
  })
  @ApiResponse({ status: 200, description: 'Lista de entradas obtenida exitosamente' })
  async findAll() {
    return this.storageService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una entrada por ID',
    description: 'Retorna una entrada específica por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada', type: 'number' })
  @ApiResponse({ status: 200, description: 'Entrada obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.storageService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva entrada',
    description: 'Crea una nueva entrada en la tabla password_manager',
  })
  @ApiResponse({ status: 201, description: 'Entrada creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async create(@Body() data: Partial<PasswordManager>) {
    return this.storageService.create(data);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una entrada',
    description: 'Actualiza una entrada existente por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a actualizar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Entrada actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  async update(@Param('id') id: string, @Body() data: Partial<PasswordManager>) {
    return this.storageService.update(+id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar una entrada',
    description: 'Elimina una entrada existente por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Entrada eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Entrada no encontrada' })
  async delete(@Param('id') id: string) {
    return this.storageService.delete(+id);
  }
}

