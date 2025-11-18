import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  sub?: string;
  azp?: string;
  client_id?: string;
  scope?: string;
  [key: string]: any;
}

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);
  private readonly jwksClient: JwksClient;
  private readonly expectedIssuers: string[];
  private readonly expectedAudience: string;

  constructor(private configService: ConfigService) {
    const keycloakUrl = this.configService.get<string>('keycloakUrl') || 'http://keycloak:8080';
    const realm = this.configService.get<string>('keycloakRealm') || 'm14-microservicios';
    this.expectedAudience = this.configService.get<string>('keycloakAudience') || 'password-service-client';

    // Aceptar tokens con issuer de la red interna (keycloak:8080) o del host (localhost:8081)
    // Esto permite usar tokens obtenidos desde el host para pruebas
    const internalIssuer = `${keycloakUrl}/realms/${realm}`;
    const hostIssuer = `http://localhost:8081/realms/${realm}`;
    this.expectedIssuers = [internalIssuer, hostIssuer];

    // Configurar JWKS client para obtener las claves públicas de Keycloak
    // Usar la URL interna para JWKS (desde dentro de Docker)
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    this.jwksClient = new JwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 horas
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.logger.log(`JWT Guard initialized - Accepted issuers: ${this.expectedIssuers.join(', ')}, Audience: ${this.expectedAudience}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      this.logger.warn('Missing Authorization header');
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Extraer el token del header "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn('Invalid Authorization header format');
      throw new UnauthorizedException('Invalid Authorization header format. Expected: Bearer <token>');
    }

    const token = parts[1];

    try {
      // Decodificar el token sin verificar primero para obtener el kid (key id)
      const decoded = jwt.decode(token, { complete: true }) as {
        header: { kid?: string; alg?: string };
        payload: JwtPayload;
      } | null;

      if (!decoded || !decoded.header || !decoded.payload) {
        throw new Error('Invalid token structure');
      }

      // Obtener la clave pública desde JWKS
      const signingKey = await this.getKey(decoded.header.kid);
      if (!signingKey) {
        throw new Error('Unable to retrieve signing key from Keycloak');
      }

      // Verificar la firma y decodificar el token
      const payload = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;

      // Validar issuer (aceptar tanto issuer interno como del host)
      if (!payload.iss || !this.expectedIssuers.includes(payload.iss)) {
        this.logger.warn(`Invalid issuer: ${payload.iss}, expected one of: ${this.expectedIssuers.join(', ')}`);
        throw new UnauthorizedException('Invalid token issuer');
      }

      // Validar audience
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audiences.includes(this.expectedAudience) && !audiences.includes('account')) {
        this.logger.warn(`Invalid audience: ${payload.aud}, expected: ${this.expectedAudience}`);
        throw new UnauthorizedException('Invalid token audience');
      }

      // Validar expiración (JwtService.verify ya lo hace, pero verificamos explícitamente)
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }

      // Agregar información del token al request para uso posterior
      request.user = {
        clientId: payload.client_id || payload.azp || payload.sub,
        sub: payload.sub,
        scope: payload.scope,
      };

      this.logger.debug(`Token validated successfully for client: ${request.user.clientId}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException(`Invalid or expired token: ${error.message}`);
    }
  }

  /**
   * Obtiene la clave pública desde JWKS usando el kid (key id) del token
   */
  private async getKey(kid?: string): Promise<string> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      this.logger.error(`Failed to get signing key from JWKS: ${error.message}`);
      throw new Error(`Unable to retrieve signing key: ${error.message}`);
    }
  }
}

