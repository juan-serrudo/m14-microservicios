import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, delay, catchError, throwError, retryWhen, concatMap, timer } from 'rxjs';
import { CircuitBreaker, CircuitState } from '../utils/circuit-breaker';
import { v4 as uuidv4 } from 'uuid';
import { AxiosResponse } from 'axios';

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
export class StorageClientService {
  private readonly logger = new Logger(StorageClientService.name);
  private readonly circuitBreaker: CircuitBreaker;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly requestTimeout: number;
  private readonly retryAttempts: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('storageBaseUrl') || 'http://storage-sqlite:3001';
    this.apiKey = this.configService.get<string>('storageApiKey') || 'change-me';
    this.requestTimeout = this.configService.get<number>('requestTimeoutMs') || 3000;
    this.retryAttempts = this.configService.get<number>('retryAttempts') || 2;

    const failureThreshold = this.configService.get<number>('cbFailureThreshold') || 5;
    const resetTimeout = this.configService.get<number>('cbResetTimeoutMs') || 15000;
    this.circuitBreaker = new CircuitBreaker(failureThreshold, resetTimeout);
  }

  private async executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<StorageResponse> {
    const traceId = uuidv4();

    if (!this.circuitBreaker.canAttempt()) {
      this.logger.warn(`Circuit breaker is OPEN for ${endpoint}`);
      throw new HttpException(
        {
          code: 'CIRCUIT_BREAKER_OPEN',
          message: 'El servicio de almacenamiento no está disponible temporalmente',
          traceId,
          retryable: true,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      };

      let request$: any;
      if (method === 'GET') {
        request$ = this.httpService.get(url, { headers });
      } else if (method === 'POST') {
        request$ = this.httpService.post(url, data, { headers });
      } else if (method === 'PUT') {
        request$ = this.httpService.put(url, data, { headers });
      } else if (method === 'DELETE') {
        request$ = this.httpService.delete(url, { headers });
      } else {
        throw new HttpException(
          {
            code: 'INVALID_METHOD',
            message: `Método HTTP no soportado: ${method}`,
            traceId: uuidv4(),
            retryable: false,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Aplicar timeout y retry exponencial
      let retryCount = 0;
      const response = await firstValueFrom(
        request$.pipe(
          timeout(this.requestTimeout),
          retryWhen((errors) =>
            errors.pipe(
              concatMap((error) => {
                retryCount++;
                if (retryCount <= this.retryAttempts) {
                  const delayMs = Math.pow(2, retryCount) * 100; // Backoff exponencial
                  this.logger.warn(`Retry ${retryCount} for ${endpoint} after ${delayMs}ms`);
                  return timer(delayMs);
                }
                return throwError(() => error);
              }),
            ),
          ),
          catchError((error) => {
            this.logger.error(`Request failed for ${endpoint}:`, error.message);
            this.circuitBreaker.recordFailure();
            return throwError(() => error);
          }),
        ),
      ) as AxiosResponse<StorageResponse>;

      this.circuitBreaker.recordSuccess();
      return response.data;
    } catch (error) {
      this.circuitBreaker.recordFailure();

      if (error.response?.data) {
        // Error de respuesta HTTP
        const errorData = error.response.data;
        if (errorData.error) {
          return {
            error: {
              code: errorData.error.code || 'STORAGE_ERROR',
              message: errorData.error.message || 'Error al comunicarse con el servicio de almacenamiento',
              traceId: errorData.error.traceId || traceId,
              retryable: errorData.error.retryable ?? true,
            },
          };
        }
      }

      // Si es HttpException, re-lanzarlo
      if (error instanceof HttpException) {
        throw error;
      }

      // Error de timeout o conexión
      throw new HttpException(
        {
          code: 'STORAGE_TIMEOUT',
          message: 'Timeout al comunicarse con el servicio de almacenamiento',
          traceId,
          retryable: true,
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }
  }

  async findAll(): Promise<StorageResponse> {
    return this.executeRequest('GET', '/api/v1/storage/password_manager');
  }

  async findOne(id: number): Promise<StorageResponse> {
    return this.executeRequest('GET', `/api/v1/storage/password_manager/${id}`);
  }

  async create(data: any): Promise<StorageResponse> {
    return this.executeRequest('POST', '/api/v1/storage/password_manager', data);
  }

  async update(id: number, data: any): Promise<StorageResponse> {
    return this.executeRequest('PUT', `/api/v1/storage/password_manager/${id}`, data);
  }

  async delete(id: number): Promise<StorageResponse> {
    return this.executeRequest('DELETE', `/api/v1/storage/password_manager/${id}`);
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }
}

