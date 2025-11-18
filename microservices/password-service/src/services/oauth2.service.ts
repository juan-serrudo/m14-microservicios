import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name);
  private cachedToken: CachedToken | null = null;
  private readonly tokenUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenRefreshMarginSeconds: number = 60; // Renovar 60 segundos antes de expirar

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const keycloakUrl = this.configService.get<string>('keycloakUrl') || 'http://keycloak:8080';
    const realm = this.configService.get<string>('keycloakRealm') || 'm14-microservicios';
    this.tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    this.clientId = this.configService.get<string>('keycloakClientId') || 'password-service-client';
    this.clientSecret = this.configService.get<string>('keycloakClientSecret') || 'password-service-secret-2024';

    this.logger.log(`OAuth2 Service initialized - Token URL: ${this.tokenUrl}`);
  }

  /**
   * Obtiene un access token válido, usando caché si está disponible y no expirado
   */
  async getAccessToken(): Promise<string> {
    // Verificar si hay un token en caché y si aún es válido
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      this.logger.debug('Using cached access token');
      return this.cachedToken.token;
    }

    // Obtener nuevo token
    this.logger.log('Requesting new access token from Keycloak');
    try {
      const tokenResponse = await this.requestToken();
      
      // Calcular tiempo de expiración (con margen de seguridad)
      const expiresIn = tokenResponse.expires_in || 300; // Default 5 minutos
      const expiresAt = Date.now() + (expiresIn - this.tokenRefreshMarginSeconds) * 1000;

      // Guardar en caché
      this.cachedToken = {
        token: tokenResponse.access_token,
        expiresAt,
      };

      this.logger.log(`Access token obtained and cached (expires in ${expiresIn}s)`);
      return this.cachedToken.token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to obtain access token from Keycloak: ${errorMessage}`);
      throw new HttpException(
        {
          code: 'OAUTH2_TOKEN_ERROR',
          message: 'No se pudo obtener el token de autenticación',
          details: errorMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Solicita un nuevo token a Keycloak usando client_credentials
   */
  private async requestToken(): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          this.tokenUrl,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 5000,
          },
        ),
      );

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid token response from Keycloak');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `Keycloak token request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
        throw new Error(
          `Keycloak returned error: ${error.response.status} - ${error.response.data?.error_description || error.response.data?.error || 'Unknown error'}`,
        );
      }
      throw error;
    }
  }

  /**
   * Verifica si un token en caché sigue siendo válido
   */
  private isTokenValid(cachedToken: CachedToken): boolean {
    return Date.now() < cachedToken.expiresAt;
  }

  /**
   * Invalida el token en caché (útil para forzar renovación)
   */
  clearCache(): void {
    this.cachedToken = null;
    this.logger.debug('Token cache cleared');
  }
}

