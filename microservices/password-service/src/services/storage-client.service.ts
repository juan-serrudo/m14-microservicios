import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, delay, catchError, throwError, retryWhen, concatMap, timer } from 'rxjs';
import { CircuitBreaker, CircuitState } from '../utils/circuit-breaker';
import { v4 as uuidv4 } from 'uuid';
import { AxiosResponse } from 'axios';
import { OAuth2Service } from './oauth2.service';

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
  private readonly requestTimeout: number;
  private readonly retryAttempts: number;
  private readonly useOAuth2: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly oauth2Service: OAuth2Service,
  ) {
    this.baseUrl = this.configService.get<string>('storageBaseUrl') || 'http://storage-sqlite:3001';
    this.requestTimeout = this.configService.get<number>('requestTimeoutMs') || 3000;
    this.retryAttempts = this.configService.get<number>('retryAttempts') || 2;
    this.useOAuth2 = this.configService.get<string>('USE_OAUTH2') !== 'false'; // Por defecto true

    const failureThreshold = this.configService.get<number>('cbFailureThreshold') || 5;
    const resetTimeout = this.configService.get<number>('cbResetTimeoutMs') || 15000;
    this.circuitBreaker = new CircuitBreaker(failureThreshold, resetTimeout);

    if (this.useOAuth2) {
      this.logger.log('Storage client configured to use OAuth2 authentication');
    } else {
      this.logger.warn('Storage client configured to use legacy X-API-Key authentication');
    }
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
      
      // Obtener token OAuth2 si está habilitado
      let authHeader: string;
      if (this.useOAuth2) {
        try {
          const accessToken = await this.oauth2Service.getAccessToken();
          authHeader = `Bearer ${accessToken}`;
        } catch (oauthError) {
          this.logger.error(`Failed to obtain OAuth2 token: ${oauthError.message}`);
          this.circuitBreaker.recordFailure();
          throw new HttpException(
            {
              code: 'OAUTH2_ERROR',
              message: 'No se pudo autenticar con el servicio de almacenamiento',
              traceId,
              retryable: true,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
      } else {
        // Fallback a X-API-Key para compatibilidad
        const apiKey = this.configService.get<string>('storageApiKey') || 'change-me';
        authHeader = apiKey;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Usar Authorization Bearer para OAuth2 o X-API-Key para legacy
      if (this.useOAuth2) {
        headers['Authorization'] = authHeader;
      } else {
        headers['X-API-Key'] = authHeader;
      }

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
            // Si es error 401 (Unauthorized), limpiar caché de token
            if (error.response?.status === 401 && this.useOAuth2) {
              this.logger.warn('Received 401 Unauthorized, clearing OAuth2 token cache');
              this.oauth2Service.clearCache();
            }
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

