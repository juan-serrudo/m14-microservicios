import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseDTO } from 'src/dto/response.dto';
import { PasswordManagerService } from './password-manager.service';
import { CreatePasswordManagerDto, UpdatePasswordManagerDto, DecryptPasswordDto } from 'src/dto/password-manager.dto';

@ApiTags('GESTOR DE CONTRASEÑAS')
@Controller('password-manager')
export class PasswordManagerController {
  constructor(private readonly passwordManagerService: PasswordManagerService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Obtener todas las entradas de contraseñas',
    description: 'Retorna una lista de todas las entradas de contraseñas almacenadas (sin mostrar las contraseñas cifradas)'
  })
  async findAll(): Promise<ResponseDTO> {
    return this.passwordManagerService.findAll();
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Obtener una entrada específica',
    description: 'Retorna los detalles de una entrada específica (sin mostrar la contraseña cifrada)'
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada', type: 'number' })
  async findOne(@Param('id') id: number): Promise<ResponseDTO> {
    return this.passwordManagerService.findOne(id);
  }

  @Get('/category/:category')
  @ApiOperation({
    summary: 'Obtener entradas por categoría',
    description: 'Retorna todas las entradas de una categoría específica'
  })
  @ApiParam({ name: 'category', description: 'Categoría a filtrar', type: 'string' })
  async findByCategory(@Param('category') category: string): Promise<ResponseDTO> {
    return this.passwordManagerService.findByCategory(category);
  }

  @Post('/')
  @ApiOperation({
    summary: 'Crear nueva entrada de contraseña',
    description: 'Crea una nueva entrada de contraseña con cifrado AES y hash de la clave maestra'
  })
  async save(@Body() passwordData: CreatePasswordManagerDto): Promise<ResponseDTO> {
    return this.passwordManagerService.save(passwordData);
  }

  @Put('/:id')
  @ApiOperation({
    summary: 'Actualizar entrada de contraseña',
    description: 'Actualiza una entrada existente. Requiere la clave maestra para verificación'
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a actualizar', type: 'number' })
  async update(@Param('id') id: number, @Body() passwordData: UpdatePasswordManagerDto): Promise<ResponseDTO> {
    return this.passwordManagerService.update(id, passwordData);
  }

  @Delete('/:id')
  @ApiOperation({
    summary: 'Eliminar entrada de contraseña',
    description: 'Elimina una entrada existente. Requiere la clave maestra para verificación'
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a eliminar', type: 'number' })
  @ApiQuery({ name: 'masterKey', description: 'Clave maestra para verificación', type: 'string' })
  async delete(@Param('id') id: number, @Query('masterKey') masterKey: string): Promise<ResponseDTO> {
    return this.passwordManagerService.delete(id, masterKey);
  }

  @Post('/:id/decrypt')
  @ApiOperation({
    summary: 'Descifrar contraseña',
    description: 'Descifra y retorna la contraseña original. Requiere la clave maestra correcta'
  })
  @ApiParam({ name: 'id', description: 'ID de la entrada a descifrar', type: 'number' })
  async decryptPassword(@Param('id') id: number, @Body() decryptData: DecryptPasswordDto): Promise<ResponseDTO> {
    return this.passwordManagerService.decryptPassword(id, decryptData);
  }
}
