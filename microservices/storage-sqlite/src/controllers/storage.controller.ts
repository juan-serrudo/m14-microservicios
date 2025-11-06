import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { PasswordManager } from '../entities/password-manager.entity';

@Controller('api/v1/storage/password_manager')
@UseGuards(ApiKeyGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.storageService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.storageService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: Partial<PasswordManager>) {
    return this.storageService.create(data);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() data: Partial<PasswordManager>) {
    return this.storageService.update(+id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.storageService.delete(+id);
  }
}

