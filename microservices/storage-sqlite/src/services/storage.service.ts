import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordManager } from '../entities/password-manager.entity';
import { v4 as uuidv4 } from 'uuid';

export interface StorageResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
    traceId: string;
    retryable?: boolean;
  };
}

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(PasswordManager)
    private passwordManagerRepository: Repository<PasswordManager>,
  ) {}

  private generateTraceId(): string {
    return uuidv4();
  }

  async findAll(): Promise<StorageResponse> {
    const traceId = this.generateTraceId();
    try {
      const items = await this.passwordManagerRepository.find({
        order: { id: 'ASC' },
      });
      return { data: items };
    } catch (error) {
      return {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Error al obtener los registros',
          traceId,
          retryable: true,
        },
      };
    }
  }

  async findOne(id: number): Promise<StorageResponse> {
    const traceId = this.generateTraceId();
    try {
      const item = await this.passwordManagerRepository.findOne({ where: { id } });
      if (!item) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'Registro no encontrado',
            traceId,
            retryable: false,
          },
        };
      }
      return { data: item };
    } catch (error) {
      return {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Error al obtener el registro',
          traceId,
          retryable: true,
        },
      };
    }
  }

  async create(data: Partial<PasswordManager>): Promise<StorageResponse> {
    const traceId = this.generateTraceId();
    try {
      const newItem = this.passwordManagerRepository.create(data);
      const savedItem = await this.passwordManagerRepository.save(newItem);
      return { data: savedItem };
    } catch (error) {
      return {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Error al crear el registro',
          traceId,
          retryable: false,
        },
      };
    }
  }

  async update(id: number, data: Partial<PasswordManager>): Promise<StorageResponse> {
    const traceId = this.generateTraceId();
    try {
      const item = await this.passwordManagerRepository.findOne({ where: { id } });
      if (!item) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'Registro no encontrado',
            traceId,
            retryable: false,
          },
        };
      }

      Object.assign(item, data);
      const updatedItem = await this.passwordManagerRepository.save(item);
      return { data: updatedItem };
    } catch (error) {
      return {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Error al actualizar el registro',
          traceId,
          retryable: true,
        },
      };
    }
  }

  async delete(id: number): Promise<StorageResponse> {
    const traceId = this.generateTraceId();
    try {
      const item = await this.passwordManagerRepository.findOne({ where: { id } });
      if (!item) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'Registro no encontrado',
            traceId,
            retryable: false,
          },
        };
      }

      await this.passwordManagerRepository.delete(id);
      return { data: { id, deleted: true } };
    } catch (error) {
      return {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Error al eliminar el registro',
          traceId,
          retryable: true,
        },
      };
    }
  }
}

