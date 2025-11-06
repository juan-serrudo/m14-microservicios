import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { StorageClientService } from './storage-client.service';
import { CipherService } from './cipher.service';
import { CreatePasswordDto, UpdatePasswordDto, DecryptPasswordDto } from '../dto/password.dto';
import { v4 as uuidv4 } from 'uuid';

export interface PasswordResponse {
  id: number;
  title: string;
  description?: string;
  username: string;
  url?: string;
  category: string;
  notes?: string;
  createdAt: Date;
  updateAt: Date;
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly storageClient: StorageClientService,
    private readonly cipherService: CipherService,
  ) {}

  private generateTraceId(): string {
    return uuidv4();
  }

  private sanitizeResponse(data: any): PasswordResponse {
    // No exponer encryptedPassword ni masterKeyHash
    const { encryptedPassword, masterKeyHash, ...sanitized } = data;
    return sanitized;
  }

  async findAll(): Promise<{ data: PasswordResponse[] } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      const response = await this.storageClient.findAll();

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      const passwords = (response.data || []).map((item: any) => this.sanitizeResponse(item));

      return { data: passwords };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al obtener las contraseñas',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? true,
        },
      };
    }
  }

  async findOne(id: number): Promise<{ data: PasswordResponse } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      const response = await this.storageClient.findOne(id);

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      return { data: this.sanitizeResponse(response.data) };
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al obtener la contraseña',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? true,
        },
      };
    }
  }

  async create(createDto: CreatePasswordDto): Promise<{ data: PasswordResponse } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      // Cifrar la contraseña
      const encryptedPassword = this.cipherService.encryptPassword(createDto.password, createDto.masterKey);

      // Generar hash de la clave maestra
      const masterKeyHash = await this.cipherService.hashMasterKey(createDto.masterKey);

      const storageData = {
        title: createDto.title,
        description: createDto.description || '',
        username: createDto.username,
        encryptedPassword,
        url: createDto.url || '',
        category: createDto.category,
        notes: createDto.notes || '',
        masterKeyHash,
        state: 1,
      };

      const response = await this.storageClient.create(storageData);

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      return { data: this.sanitizeResponse(response.data) };
    } catch (error) {
      this.logger.error('Error in create:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al crear la contraseña',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? false,
        },
      };
    }
  }

  async update(id: number, updateDto: UpdatePasswordDto): Promise<{ data: { id: number } } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      // Obtener la entrada existente para verificar la clave maestra
      const existingResponse = await this.storageClient.findOne(id);

      if (existingResponse.error) {
        return {
          error: {
            code: existingResponse.error.code,
            message: existingResponse.error.message,
            traceId: existingResponse.error.traceId || traceId,
            retryable: existingResponse.error.retryable,
          },
        };
      }

      const existing = existingResponse.data;

      // Verificar la clave maestra
      const isMasterKeyValid = await this.cipherService.verifyMasterKey(
        updateDto.masterKey,
        existing.masterKeyHash,
      );

      if (!isMasterKeyValid) {
        return {
          error: {
            code: 'INVALID_MASTER_KEY',
            message: 'Clave maestra incorrecta',
            traceId,
            retryable: false,
          },
        };
      }

      const updateData: any = {};

      if (updateDto.title !== undefined) updateData.title = updateDto.title;
      if (updateDto.description !== undefined) updateData.description = updateDto.description;
      if (updateDto.username !== undefined) updateData.username = updateDto.username;
      if (updateDto.url !== undefined) updateData.url = updateDto.url;
      if (updateDto.category !== undefined) updateData.category = updateDto.category;
      if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

      // Si se proporciona una nueva contraseña, cifrarla
      if (updateDto.password !== undefined) {
        updateData.encryptedPassword = this.cipherService.encryptPassword(updateDto.password, updateDto.masterKey);
      }

      const response = await this.storageClient.update(id, updateData);

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      return { data: { id } };
    } catch (error) {
      this.logger.error('Error in update:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al actualizar la contraseña',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? false,
        },
      };
    }
  }

  async delete(id: number, masterKey: string): Promise<{ data: { id: number; deleted: boolean } } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      // Obtener la entrada existente para verificar la clave maestra
      const existingResponse = await this.storageClient.findOne(id);

      if (existingResponse.error) {
        return {
          error: {
            code: existingResponse.error.code,
            message: existingResponse.error.message,
            traceId: existingResponse.error.traceId || traceId,
            retryable: existingResponse.error.retryable,
          },
        };
      }

      const existing = existingResponse.data;

      // Verificar la clave maestra
      const isMasterKeyValid = await this.cipherService.verifyMasterKey(masterKey, existing.masterKeyHash);

      if (!isMasterKeyValid) {
        return {
          error: {
            code: 'INVALID_MASTER_KEY',
            message: 'Clave maestra incorrecta',
            traceId,
            retryable: false,
          },
        };
      }

      const response = await this.storageClient.delete(id);

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      return { data: { id, deleted: true } };
    } catch (error) {
      this.logger.error('Error in delete:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al eliminar la contraseña',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? false,
        },
      };
    }
  }

  async decrypt(id: number, decryptDto: DecryptPasswordDto): Promise<{ data: { id: number; title: string; username: string; decryptedPassword: string } } | { error: any }> {
    const traceId = this.generateTraceId();
    try {
      const response = await this.storageClient.findOne(id);

      if (response.error) {
        return {
          error: {
            code: response.error.code,
            message: response.error.message,
            traceId: response.error.traceId || traceId,
            retryable: response.error.retryable,
          },
        };
      }

      const passwordEntry = response.data;

      // Verificar la clave maestra
      const isMasterKeyValid = await this.cipherService.verifyMasterKey(
        decryptDto.masterKey,
        passwordEntry.masterKeyHash,
      );

      if (!isMasterKeyValid) {
        return {
          error: {
            code: 'INVALID_MASTER_KEY',
            message: 'Clave maestra incorrecta',
            traceId,
            retryable: false,
          },
        };
      }

      // Descifrar la contraseña
      const decryptedPassword = this.cipherService.decryptPassword(
        passwordEntry.encryptedPassword,
        decryptDto.masterKey,
      );

      return {
        data: {
          id: passwordEntry.id,
          title: passwordEntry.title,
          username: passwordEntry.username,
          decryptedPassword,
        },
      };
    } catch (error) {
      this.logger.error('Error in decrypt:', error);
      return {
        error: {
          code: error.response?.code || 'INTERNAL_ERROR',
          message: error.response?.message || 'Error al descifrar la contraseña',
          traceId: error.response?.traceId || traceId,
          retryable: error.response?.retryable ?? false,
        },
      };
    }
  }
}

