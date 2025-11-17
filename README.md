# Práctica de Microservicios - M14

## Descripción

Sistema de microservicios para gestión de contraseñas con arquitectura dividida en dos servicios y comunicación asíncrona mediante Kafka:

- **password-service** (Microservicio A): API pública con lógica de negocio y cifrado (Producer de Kafka)
- **storage-sqlite** (Microservicio B): API interna CRUD genérica para SQLite (Consumer de Kafka)
- **Kafka**: Broker de mensajería para eventos asíncronos

## Arquitectura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  NGINX LB   │───────────────────────┐
└──────┬──────┘                       │
       │ Round Robin                  │
       ├──────────────┐               │
       ▼              ▼               ▼
┌──────────┐    ┌──────────┐ ┌──────────────┐
│  A (ps1) │    │  A (ps2) │ │  B (storage) │
│ Producer │    │ Producer │ │  Consumer    │
└────┬─────┘    └────┬─────┘ └──────┬───────┘
     │               │               │
     │ OAuth2       │ OAuth2        │
     │ Bearer Token │ Bearer Token  │
     └───────────────┴───────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼                           ▼
┌─────────────┐            ┌─────────────┐
│  Keycloak   │            │    Kafka    │
│  OAuth2/    │            │   Broker    │
│  OpenID     │            │  (KRaft)    │
│  Connect    │            └─────────────┘
└─────────────┘
```

## Estructura del Proyecto

```
m14-microservicios/
├── microservices/
│   ├── password-service/     # Microservicio A
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── storage-sqlite/       # Microservicio B
│       ├── src/
│       ├── Dockerfile
│       └── package.json
└── deploy/
    ├── docker-compose.yml
    ├── lb-a/                 # Load Balancer
    ├── frontend/             # Frontend simple
    └── env/                  # Variables de entorno
```

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (para desarrollo local)

## Instalación y Ejecución

> **Nota**: Migramos de la imagen Bitnami a la Docker Official Image (`apache/kafka`) para operar Kafka en modo **KRaft** (sin ZooKeeper). Esto reduce la complejidad operativa y alinea el despliegue con las guías oficiales de Docker.

### 1. Configurar Variables de Entorno

Copiar los archivos de ejemplo y ajustar si es necesario:

```bash
cd deploy/env
# Los archivos .example.env ya están configurados
# Si necesitas cambiar valores, edita los archivos directamente
```

### 2. Construir y Ejecutar con Docker Compose

```bash
cd deploy
docker compose up --build
```

Este comando:
- Construye las imágenes de los microservicios
- Configura las redes (pública y privada)
- Inicia todos los servicios (2 réplicas de A, 1 de B, LB, frontend)
- Ejecuta las migraciones automáticamente

#### Listeners expuestos

- `HOST` listener: `localhost:9092` para clientes externos o pruebas locales
- `DOCKER` listener: `kafka:9093` para comunicación interna entre contenedores
- `storage-sqlite`: `localhost:3001` para acceder al consumer y a los endpoints de auditoría
- Kafka corre en modo KRaft, eliminando por completo la dependencia de ZooKeeper.

#### Pasos rápidos de prueba

1. Crear una contraseña (produce un evento):
   ```bash
   curl -X POST http://localhost:8080/api/v1/passwords \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Demo Kafka",
       "username": "demo@kafka.io",
       "password": "S3creta!",
       "masterKey": "claveDemoKafka"
     }'
   ```
2. Verificar que el evento llegó al consumer:
   ```bash
   docker logs deploy-storage-sqlite-1 | grep "Kafka\|Demo Kafka"
   ```
3. Consultar los eventos creados (disponible desde el host en el puerto 3001):
   ```bash
   curl -X GET http://localhost:3001/api/v1/audit/password-events \
     -H "X-API-Key: change-me"
   ```
4. Listar tópicos disponibles (usa el listener interno `kafka:9092`):
   ```bash
   docker exec deploy-kafka-1 /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --list
   ```

### 3. Verificar que los Servicios Estén Funcionando

```bash
# Health check del load balancer (debe redirigir a A)
curl http://localhost:8080/health

# Health check directo de storage (disponible en el host)
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

## Endpoints del Microservicio A (password-service)

Todas las llamadas deben ir al Load Balancer en el puerto **8080**.

### 1. Crear Contraseña

```bash
curl -X POST http://localhost:8080/api/v1/passwords \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gmail Personal",
    "description": "Cuenta principal de Gmail",
    "username": "usuario@gmail.com",
    "password": "miContraseñaSegura123!",
    "url": "https://gmail.com",
    "category": "Redes Sociales",
    "notes": "Cuenta creada en 2020",
    "masterKey": "miClaveMaestraSegura123!"
  }'
```

### 2. Listar Todas las Contraseñas

```bash
curl http://localhost:8080/api/v1/passwords
```

### 3. Obtener Contraseña por ID

```bash
curl http://localhost:8080/api/v1/passwords/1
```

### 4. Actualizar Contraseña

```bash
curl -X PUT http://localhost:8080/api/v1/passwords/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gmail Personal Actualizado",
    "masterKey": "miClaveMaestraSegura123!"
  }'
```

### 5. Eliminar Contraseña

```bash
curl -X DELETE "http://localhost:8080/api/v1/passwords/1?masterKey=miClaveMaestraSegura123!"
```

### 6. Descifrar Contraseña

```bash
curl -X POST http://localhost:8080/api/v1/passwords/1/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "masterKey": "miClaveMaestraSegura123!"
  }'
```

### 7. Health Check

```bash
curl http://localhost:8080/health
```

### 8. Documentación Swagger

Una vez iniciado el servicio, accede a la documentación Swagger:

- **Password Service**: http://localhost:8080/api (a través del load balancer)
- **Storage SQLite**: http://localhost:3001/api (requiere `Authorization: Bearer <token>`)
- **Keycloak Admin Console**: http://localhost:8081 (usuario: `admin`, contraseña: `admin`)

Nota: Swagger está habilitado por defecto con `ENV_SWAGGER_SHOW=true` en los archivos de configuración.

## Autenticación Servicio a Servicio con OAuth2/Keycloak

El sistema implementa autenticación servicio a servicio usando **OAuth2 client_credentials** con **Keycloak** como proveedor de identidad, siguiendo principios de **Zero Trust**.

### Arquitectura de Autenticación

1. **Keycloak** actúa como servidor de autenticación OAuth2/OpenID Connect:
   - Realm: `m14-microservicios`
   - Client: `password-service-client` (tipo `confidential`)
   - Flow habilitado: `client_credentials`

2. **password-service** (cliente OAuth2):
   - Obtiene access tokens desde Keycloak usando `client_credentials`
   - Cachea tokens en memoria hasta su expiración (menos 60 segundos de margen)
   - Incluye el token en todas las llamadas a `storage-sqlite` usando el header `Authorization: Bearer <token>`

3. **storage-sqlite** (resource server):
   - Valida tokens JWT usando JWKS (JSON Web Key Set) de Keycloak
   - Verifica: firma, issuer (`iss`), audience (`aud`), expiración (`exp`)
   - Rechaza peticiones sin token o con token inválido

### Configuración Automática (Infrastructure as Code)

Keycloak se configura automáticamente al iniciar con `docker compose up`:

- El realm `m14-microservicios` se importa desde `deploy/keycloak/realm-export.json`
- El client `password-service-client` se crea con el secret configurado
- **No se requieren pasos manuales** en la UI de Keycloak

### Flujo de Autenticación

```
1. password-service → Keycloak: POST /realms/m14-microservicios/protocol/openid-connect/token
   (grant_type=client_credentials, client_id, client_secret)

2. Keycloak → password-service: { access_token, expires_in, ... }

3. password-service → storage-sqlite: GET /api/v1/storage/password_manager
   (Authorization: Bearer <access_token>)

4. storage-sqlite → Keycloak: GET /realms/m14-microservicios/protocol/openid-connect/certs
   (para obtener claves públicas JWKS)

5. storage-sqlite valida el token y procesa la petición
```

### Variables de Entorno

**password-service** (`deploy/env/password-service.example.env`):
```env
USE_OAUTH2=true
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=m14-microservicios
KEYCLOAK_CLIENT_ID=password-service-client
KEYCLOAK_CLIENT_SECRET=password-service-secret-2024
```

**storage-sqlite** (`deploy/env/storage-sqlite.example.env`):
```env
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=m14-microservicios
KEYCLOAK_AUDIENCE=password-service-client
```

### Probar la Autenticación OAuth2

#### 1. Verificar que Keycloak está funcionando

```bash
# Health check de Keycloak
curl http://localhost:8081/health/ready

# Obtener un token manualmente (desde el host)
curl -X POST http://localhost:8081/realms/m14-microservicios/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=password-service-client" \
  -d "client_secret=password-service-secret-2024"
```

#### 2. Verificar que password-service obtiene tokens

```bash
# Ver logs de password-service
docker logs deploy-password-service-1-1 | grep "OAuth2\|access token"
```

#### 3. Probar un flujo completo

```bash
# Crear una contraseña (password-service obtendrá token automáticamente)
curl -X POST http://localhost:8080/api/v1/passwords \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test OAuth2",
    "username": "test@oauth2.com",
    "password": "test123",
    "masterKey": "master123"
  }'

# Verificar que storage-sqlite recibió el token
docker logs deploy-storage-sqlite-1 | grep "Token validated\|client"
```

#### 4. Verificar rechazo de peticiones sin token

```bash
# Intentar acceder directamente a storage-sqlite sin token (debe fallar)
curl http://localhost:3001/api/v1/storage/password_manager
# Debe retornar: 401 Unauthorized
```

#### 5. Verificar rechazo de tokens inválidos

```bash
# Intentar con un token inválido
curl http://localhost:3001/api/v1/storage/password_manager \
  -H "Authorization: Bearer invalid-token-12345"
# Debe retornar: 401 Unauthorized
```

### Características de Seguridad

- **Cacheo de tokens**: Los tokens se cachean en memoria para evitar solicitudes repetidas a Keycloak
- **Renovación automática**: Los tokens se renuevan automáticamente 60 segundos antes de expirar
- **Validación robusta**: Verificación de firma, issuer, audience y expiración
- **Manejo de errores**: Si un token es rechazado (401), el caché se limpia automáticamente
- **Integración con Circuit Breaker**: Los errores de autenticación se integran con el Circuit Breaker existente

### Notas Importantes

- **Keycloak Admin Console**: Disponible en http://localhost:8081 (usuario: `admin`, contraseña: `admin`)
- **Secret del Client**: El secret está hardcodeado en el realm export como `password-service-secret-2024` para uso académico. En producción, debe ser más seguro y gestionado de forma segura.
- **Compatibilidad**: El sistema mantiene soporte para `X-API-Key` como fallback si `USE_OAUTH2=false`, pero OAuth2 es el método recomendado.

## Comunicación Asíncrona con Kafka

El sistema implementa comunicación asíncrona mediante Kafka para eventos de contraseñas.

### Arquitectura Kafka

- **Producer**: `password-service` publica eventos cuando se crean, actualizan o eliminan contraseñas
- **Consumer**: `storage-sqlite` consume eventos y los guarda en una tabla de auditoría
- **Topic**: `passwords.v1.events` (1 partición, replication factor 1)
- **Feature Flag**: `USE_EDA=true` para habilitar/deshabilitar eventos

### Esquema de Eventos

```json
{
  "eventId": "uuid",
  "type": "password.created | password.updated | password.deleted",
  "at": "ISO-8601 timestamp",
  "schemaVersion": "1",
  "data": {
    "id": "number",
    "title": "string",
    "username": "string",
    "url": "string",
    "category": "string"
  }
}
```

**Nota**: Los eventos NO incluyen datos sensibles (no hay `encryptedPassword`, `masterKey`, `masterKeyHash`).

### Probar Kafka

#### 1. Crear una contraseña (dispara evento)

```bash
curl -X POST http://localhost:8080/api/v1/passwords \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gmail Personal",
    "description": "Cuenta principal",
    "username": "usuario@gmail.com",
    "password": "miContraseña123!",
    "url": "https://gmail.com",
    "category": "Redes Sociales",
    "notes": "Test Kafka",
    "masterKey": "miClaveMaestra123!"
  }'
```

#### 2. Verificar eventos en la auditoría

Los eventos se guardan automáticamente en la tabla `audit_password_events` en storage-sqlite.

**Ver todos los eventos** (desde dentro de la red Docker o usando un proxy):

```bash
# Consultar eventos directamente en la base de datos (desde dentro del contenedor)
docker run --rm -it -v deploy_storage_sqlite_data:/data alpine \
  sh -c "apk add --no-cache sqlite >/dev/null && sqlite3 /data/database.sqlite \"SELECT eventId, type, occurredAt FROM audit_password_events ORDER BY receivedAt DESC LIMIT 10;\""
```

**O usar el endpoint de auditoría** (requiere Bearer token):

Primero obtener un token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8081/realms/m14-microservicios/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=password-service-client" \
  -d "client_secret=password-service-secret-2024" | jq -r '.access_token')
```

Luego usar el token:
```bash
curl -X GET http://localhost:3001/api/v1/audit/password-events \
  -H "Authorization: Bearer $TOKEN"
```

**Ver estadísticas de eventos**:

```bash
curl -X GET http://localhost:3001/api/v1/audit/password-events/stats/summary \
  -H "Authorization: Bearer $TOKEN"
```

**Ver un evento específico por eventId**:

```bash
curl -X GET http://localhost:3001/api/v1/audit/password-events/{eventId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Verificar logs

```bash
# Ver logs del producer (password-service)
docker logs deploy-password-service-1-1 | grep "Published"

# Ver logs del consumer (storage-sqlite)
docker logs deploy-storage-sqlite-1 | grep "Kafka\|event"
```

#### 4. Verificar idempotencia

Crear la misma contraseña múltiples veces y verificar que los eventos se procesen correctamente sin duplicados (por eventId único).

### Características de Kafka

- **Idempotencia**: Los eventos se deduplican por `eventId` (índice único en la base de datos)
- **DLQ (Dead Letter Queue)**: Eventos que fallan se guardan con tipo `dlq.error` y el error en el campo `error`
- **Reintentos**: El consumer maneja reintentos automáticos
- **Graceful Shutdown**: Ambos servicios manejan cierre limpio de conexiones Kafka

### Configuración de Kafka

**Variables de entorno (password-service)**:
```env
KAFKA_BROKERS=kafka:9093
KAFKA_TOPIC_PASSWORD_EVENTS=passwords.v1.events
KAFKA_CLIENT_ID=password-service
USE_EDA=true
```

**Variables de entorno (storage-sqlite)**:
```env
KAFKA_BROKERS=kafka:9093
KAFKA_TOPIC_PASSWORD_EVENTS=passwords.v1.events
KAFKA_CLIENT_ID=storage-sqlite
KAFKA_GROUP_ID=storage-sqlite-group
```

### Notas Importantes

- **Consistencia Eventual**: Los eventos se procesan de forma asíncrona, por lo que puede haber un pequeño retraso entre la creación de la contraseña y el procesamiento del evento.
- **No Bloqueante**: Si Kafka no está disponible, el producer no falla la operación principal, solo registra un warning.
- **Auditoría Completa**: Todos los eventos se guardan en la tabla `audit_password_events` con timestamp, payload y posibles errores.
- **Kafka en KRaft**: El broker utiliza la Docker Official Image (`apache/kafka`) en modo KRaft, por lo que no se despliega ni requiere ZooKeeper.

## Endpoints del Microservicio B (storage-sqlite)

**Nota**: Estos endpoints están expuestos en `localhost:3001`, pero requieren el header `Authorization: Bearer <token>` para su consumo. El token debe ser obtenido desde Keycloak usando OAuth2 client_credentials.

```
GET    /api/v1/storage/password_manager      # Listar todos
GET    /api/v1/storage/password_manager/:id  # Obtener uno
POST   /api/v1/storage/password_manager      # Crear
PUT    /api/v1/storage/password_manager/:id  # Actualizar
DELETE /api/v1/storage/password_manager/:id  # Eliminar
GET    /health                                # Health check
```

## Características Técnicas

### Microservicio A (password-service)

- **Cifrado**: AES usando crypto-js
- **Hash**: bcryptjs para claves maestras (12 rounds)
- **Cliente HTTP**: Axios con:
  - Timeout: 3 segundos
  - Retry exponencial: 2 intentos
  - Circuit Breaker: estados closed/open/half-open
- **Seguridad**: No expone `encryptedPassword` ni `masterKeyHash` en respuestas

### Microservicio B (storage-sqlite)

- **Base de datos**: SQLite con archivo en volumen persistente
- **ORM**: TypeORM con migrations (sin synchronize)
- **PRAGMA WAL**: Modo Write-Ahead Logging habilitado
- **Autenticación**: OAuth2 JWT Bearer tokens (validación con JWKS de Keycloak)
  - Soporte legacy para X-API-Key (deshabilitado por defecto)

### Circuit Breaker

El Circuit Breaker tiene 3 estados:
- **CLOSED**: Funcionando normalmente
- **OPEN**: Demasiados fallos, rechaza peticiones
- **HALF_OPEN**: Probando si el servicio se recuperó

Configuración:
- Umbral de fallos: 5 (CB_FAILURE_THRESHOLD)
- Tiempo de reset: 15 segundos (CB_RESET_TIMEOUT_MS)

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "data": {
    "id": 1,
    "title": "Gmail Personal",
    "username": "usuario@gmail.com",
    ...
  }
}
```

### Respuesta de Error

```json
{
  "code": "NOT_FOUND",
  "message": "Registro no encontrado",
  "traceId": "uuid-v4",
  "retryable": false
}
```

## Desarrollo Local

### Instalar Dependencias

```bash
# Microservicio A
cd microservices/password-service
npm install

# Microservicio B
cd microservices/storage-sqlite
npm install
```

### Ejecutar en Desarrollo

```bash
# Microservicio B (puerto 3001)
cd microservices/storage-sqlite
npm run start:dev

# Microservicio A (puerto 3000)
cd microservices/password-service
npm run start:dev
```

### Ejecutar Migraciones (B)

```bash
cd microservices/storage-sqlite
npm run migration:run
```

### Ejecutar Tests

```bash
# Test unitario en A
cd microservices/password-service
npm test

# Test unitario en B
cd microservices/storage-sqlite
npm test
```

## Variables de Entorno

### password-service.example.env

```env
PORT=3000
LOG_LEVEL=info
STORAGE_BASE_URL=http://storage-sqlite:3001
STORAGE_API_KEY=change-me
CIPHER_SECRET=dev-secret-32bytes-min
REQUEST_TIMEOUT_MS=3000
RETRY_ATTEMPTS=2
CB_FAILURE_THRESHOLD=5
CB_RESET_TIMEOUT_MS=15000
# OAuth2 / Keycloak Configuration
USE_OAUTH2=true
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=m14-microservicios
KEYCLOAK_CLIENT_ID=password-service-client
KEYCLOAK_CLIENT_SECRET=password-service-secret-2024
```

### storage-sqlite.example.env

```env
PORT=3001
LOG_LEVEL=info
SQLITE_DB_PATH=/data/database.sqlite
STORAGE_API_KEY=change-me
# OAuth2 / Keycloak Configuration for JWT Validation
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=m14-microservicios
KEYCLOAK_AUDIENCE=password-service-client
```

## Redes Docker

- **public_net**: Expone lb-a (puerto 8080) y frontend (puerto 3000)
- **private_net**: Comunicación interna entre A y B

## Volúmenes

- **storage_sqlite_data**: Persiste el archivo `database.sqlite` del servicio B
- **keycloak_data**: Persiste la base de datos interna de Keycloak

## Troubleshooting

### Los servicios no se comunican

Verifica que:
1. Keycloak esté funcionando y saludable: `curl http://localhost:8081/health/ready`
2. El realm `m14-microservicios` esté importado correctamente (ver logs de Keycloak)
3. Las variables de entorno de Keycloak coincidan en ambos servicios
4. La URL `STORAGE_BASE_URL` sea correcta (usar el nombre del servicio Docker)
5. Ambos servicios estén en la misma red `private_net`
6. Los tokens OAuth2 se estén obteniendo correctamente (ver logs de password-service)

### Error de autenticación OAuth2

Si recibes errores 401 Unauthorized:
1. Verifica que Keycloak esté disponible: `docker logs deploy-keycloak-1`
2. Verifica que el client secret sea correcto en `password-service.example.env`
3. Verifica que el realm y audience sean correctos en `storage-sqlite.example.env`
4. Revisa los logs de ambos servicios para ver mensajes de error específicos

### Circuit Breaker está abierto

El Circuit Breaker se abre después de 5 fallos consecutivos. Espera 15 segundos para que pase a estado HALF_OPEN y vuelva a intentar.

### Base de datos no se crea

Verifica que:
1. El volumen `storage_sqlite_data` esté creado
2. Las migraciones se ejecuten correctamente
3. El servicio tenga permisos de escritura en `/data`

## Limpieza

```bash
# Detener y eliminar contenedores
cd deploy
docker compose down

# Eliminar también volúmenes (¡CUIDADO! Elimina los datos)
docker compose down -v
```

