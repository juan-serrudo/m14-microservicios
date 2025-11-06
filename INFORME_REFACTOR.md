# Informe de Arquitectura: División de Microservicio m1

## Fecha de Análisis
2024

---

## 1. Stack Tecnológico Detectado

### Framework y Runtime
- **Framework**: NestJS v11.0.1 (Node.js)
- **Runtime**: Node.js 20 (según Dockerfile)
- **Lenguaje**: TypeScript 5.7.3
- **Paradigma**: Programación orientada a objetos con decoradores

### Dependencias Principales
- **ORM**: TypeORM v0.3.21 con driver SQLite (`sqlite3` v5.1.7)
- **Base de Datos**: SQLite (archivo `database.sqlite`)
- **Validación**: `class-validator` v0.14.1, `class-transformer` v0.5.1
- **Seguridad**:
  - `bcryptjs` v3.0.2 (hashing de claves maestras)
  - `crypto-js` v4.2.0 (cifrado AES de contraseñas)
- **Documentación API**: Swagger/OpenAPI (`@nestjs/swagger` v11.0.7)
- **Configuración**: `@nestjs/config` v4.0.1
- **Utilidades**: `luxon` v3.5.0 (fechas), `chalk` v4.1.2 (logging)

### Infraestructura
- **Docker**: Multi-stage build (base + production)
- **Proxy Reverso**: Nginx (opcional)
- **Gestión de Procesos**: PM2 (referenciado en configuración)

---

## 2. Módulos Actuales y Estructura

### 2.1 Módulos NestJS
```
AppModule
├── AppController (endpoint ping/health)
├── AppService
├── PasswordManagerController
├── PasswordManagerService
├── ConfigModule (global)
└── Providers:
    ├── databaseProviders (DataSource TypeORM)
    └── passwordManagerProviders (Repository<PasswordManager>)
```

### 2.2 Capas de la Aplicación

#### **Controladores** (`src/modules/password-manager/`)
- `PasswordManagerController`: 7 endpoints REST
  - `GET /password-manager/` - Listar todas
  - `GET /password-manager/:id` - Obtener por ID
  - `GET /password-manager/category/:category` - Filtrar por categoría
  - `POST /password-manager/` - Crear entrada
  - `PUT /password-manager/:id` - Actualizar entrada
  - `DELETE /password-manager/:id` - Eliminar entrada
  - `POST /password-manager/:id/decrypt` - Descifrar contraseña

#### **Servicios** (`src/modules/password-manager/`)
- `PasswordManagerService`: Lógica de negocio
  - Cifrado/descifrado AES (`crypto-js`)
  - Hashing/verificación de clave maestra (`bcryptjs`)
  - Operaciones CRUD sobre repositorio TypeORM
  - Validación de clave maestra antes de operaciones sensibles

#### **Entidades** (`src/entitys/`)
- `PasswordManager`: Entidad TypeORM con campos:
  - `id`, `createdAt`, `updateAt`, `version`, `state`
  - `title`, `description`, `username`, `url`, `category`, `notes`
  - `encryptedPassword` (texto cifrado)
  - `masterKeyHash` (hash bcrypt de la clave maestra)

#### **DTOs** (`src/dto/`)
- `CreatePasswordManagerDto`: Validación de creación
- `UpdatePasswordManagerDto`: Validación de actualización (parcial)
- `DecryptPasswordDto`: Validación para descifrado
- `ResponseDTO`: Formato estándar de respuesta

#### **Providers** (`src/providers/`)
- `database.providers.ts`: Configuración de DataSource TypeORM
  - Conexión a SQLite
  - Configuración de `synchronize` (auto-migraciones)
  - Carga de entidades
- `password-manager.providers.ts`: Factory del Repository

#### **Infraestructura**
- `main.ts`: Bootstrap de NestJS
  - Configuración CORS, validación global, interceptores
  - Swagger, versionado de API, compresión
- `configurations/configuration.ts`: Variables de entorno
- `interceptors/response-format.interceptor.ts`: Formateo de respuestas
- `helpers/`: Utilidades (CORS, Swagger, package.json)

---

## 3. Dependencias y Puntos de Acoplamiento

### 3.1 Acoplamiento Actual (Monolítico)

#### **Acoplamiento Fuerte:**
1. **PasswordManagerService → TypeORM Repository**
   - Inyección directa del `Repository<PasswordManager>`
   - Uso de métodos TypeORM: `find()`, `findOne()`, `save()`, `update()`, `delete()`
   - Queries embebidas en el servicio (ej: `where: { category }`)

2. **PasswordManagerService → Base de Datos**
   - Acceso directo a SQLite mediante TypeORM
   - No hay abstracción de persistencia

3. **Lógica de Negocio + Persistencia**
   - Cifrado/descifrado + validación de clave maestra + CRUD en el mismo servicio
   - No hay separación de responsabilidades

#### **Acoplamiento Moderado:**
1. **DTOs compartidos**: Usados tanto por controlador como por servicio
2. **ResponseDTO**: Formato estándar acoplado a toda la aplicación
3. **Configuración global**: `ConfigModule` compartido

### 3.2 Dependencias Externas
- SQLite (archivo local)
- TypeORM (ORM)
- Librerías de cifrado (crypto-js, bcryptjs)

---

## 4. Propuesta de Bounded Contexts

### 4.1 Microservicio: `password-service`

**Responsabilidades:**
- API pública para gestión de contraseñas
- Lógica de negocio: cifrado/descifrado AES
- Validación de clave maestra (hashing/verificación bcrypt)
- Validación de entrada (DTOs)
- Transformación de datos (DTOs ↔ Entidades de dominio)
- **NO** accede directamente a SQLite

**Endpoints Propuestos:**
```
POST   /api/v1/passwords              - Crear contraseña
GET    /api/v1/passwords              - Listar todas (sin passwords cifradas)
GET    /api/v1/passwords/:id          - Obtener por ID
GET    /api/v1/passwords/category/:category - Filtrar por categoría
PUT    /api/v1/passwords/:id          - Actualizar entrada
DELETE /api/v1/passwords/:id          - Eliminar entrada
POST   /api/v1/passwords/:id/decrypt  - Descifrar contraseña
```

**Tecnologías:**
- NestJS (mantener)
- Cliente HTTP para comunicarse con `storage-sqlite` (Axios o HttpModule de NestJS)

### 4.2 Microservicio: `storage-sqlite`

**Responsabilidades:**
- API REST genérica para acceso a SQLite
- CRUD parametrizado y seguro (sin lógica de negocio)
- Queries parametrizadas (prevenir SQL injection)
- Migraciones de base de datos
- Abstracción de TypeORM/Repository
- **NO** contiene lógica de cifrado/descifrado ni validación de clave maestra

**Endpoints Propuestos:**
```
POST   /api/v1/storage/:table          - Crear registro
GET    /api/v1/storage/:table          - Listar con filtros (query params)
GET    /api/v1/storage/:table/:id      - Obtener por ID
PUT    /api/v1/storage/:table/:id      - Actualizar registro
DELETE /api/v1/storage/:table/:id      - Eliminar registro
POST   /api/v1/storage/migrations/run  - Ejecutar migraciones
GET    /api/v1/storage/migrations/status - Estado de migraciones
```

**Ejemplo de Query Parametrizada:**
```
GET /api/v1/storage/password_manager?filter[category]=Redes%20Sociales&select=id,title,username,category
```

**Tecnologías:**
- NestJS (mantener)
- TypeORM + SQLite (mantener)
- Validación de tablas permitidas (whitelist)
- Validación de campos permitidos (select/update)

### 4.3 Interfaz entre Microservicios

**Comunicación:**
- Protocolo: HTTP REST (síncrono)
- Formato: JSON
- Autenticación: API Key o JWT (a definir)

**Contrato de Datos:**
- `password-service` envía DTOs de dominio a `storage-sqlite`
- `storage-sqlite` devuelve datos crudos (sin transformación de negocio)
- `password-service` transforma datos crudos a DTOs de respuesta

**Ejemplo de Flujo:**
```
Cliente → password-service (POST /passwords)
  ↓
password-service: cifra password, hashea masterKey
  ↓
password-service → storage-sqlite (POST /storage/password_manager)
  ↓
storage-sqlite: persiste en SQLite
  ↓
storage-sqlite → password-service (retorna entidad)
  ↓
password-service: oculta campos sensibles, transforma a DTO
  ↓
password-service → Cliente (ResponseDTO)
```

---

## 5. Riesgos Identificados

### 5.1 Riesgos Técnicos

#### **Alto Riesgo:**
1. **Pérdida de Transacciones Atómicas**
   - Actualmente, cifrado + guardado son atómicos (misma transacción TypeORM)
   - Al separar, si falla el guardado en `storage-sqlite`, el cifrado ya ocurrió
   - **Mitigación**: Implementar patrón de compensación o transacciones distribuidas

2. **Performance y Latencia**
   - Cada operación requiere 2 hops (password-service → storage-sqlite)
   - Latencia de red adicional
   - **Mitigación**: Considerar caché en `password-service`, conexiones HTTP persistentes

3. **Acoplamiento de Datos**
   - `password-service` necesita conocer la estructura de la tabla `password_manager`
   - Si cambia el esquema, ambos servicios deben actualizarse
   - **Mitigación**: Versión de esquema, contratos de API estrictos

#### **Medio Riesgo:**
4. **Migración de Datos**
   - `database.sqlite` existente debe ser accesible solo por `storage-sqlite`
   - Migraciones deben ejecutarse en `storage-sqlite`
   - **Mitigación**: Script de migración de datos si es necesario

5. **Seguridad**
   - `storage-sqlite` debe validar que solo se acceda a tablas permitidas
   - Validación de campos permitidos (evitar exponer `encryptedPassword` o `masterKeyHash` sin control)
   - **Mitigación**: Whitelist de tablas/campos, autenticación entre servicios

6. **Manejo de Errores**
   - Errores de `storage-sqlite` deben propagarse correctamente a `password-service`
   - **Mitigación**: Estandarizar códigos de error HTTP, retry policies

#### **Bajo Riesgo:**
7. **Testing**
   - Tests E2E requieren ambos servicios corriendo
   - **Mitigación**: Mock del cliente HTTP en tests unitarios

### 5.2 Riesgos de Negocio

1. **Complejidad Operacional**
   - Dos servicios para mantener, monitorear, desplegar
   - **Mitigación**: Docker Compose, logging centralizado

2. **Tiempo de Desarrollo**
   - Refactor requiere tiempo de desarrollo y testing
   - **Mitigación**: Plan por fases, pruebas incrementales

---

## 6. Plan de Refactor por Fases

### Fase 1: Preparación y Setup (1-2 días)
**Objetivo**: Crear estructura base de ambos microservicios sin migrar lógica

**Tareas:**
1. Crear estructura de proyecto `password-service`
   - Copiar `package.json`, `tsconfig.json`, configuración base
   - Crear `app.module.ts` básico
   - Configurar cliente HTTP (HttpModule de NestJS)

2. Crear estructura de proyecto `storage-sqlite`
   - Copiar `package.json`, `tsconfig.json`, configuración base
   - Crear `app.module.ts` básico
   - Configurar TypeORM y DataSource
   - Crear controlador genérico `/storage/:table`

3. Configurar Docker Compose para ambos servicios
   - `password-service` en puerto 3000
   - `storage-sqlite` en puerto 3001
   - Compartir volumen de `database.sqlite` (solo lectura para password-service si es necesario, o solo para storage-sqlite)

4. Configurar comunicación básica entre servicios
   - Variable de entorno `STORAGE_SERVICE_URL` en `password-service`

**Archivos a Crear/Modificar:**
- `microservices/password-service/` (nuevo directorio)
- `microservices/storage-sqlite/` (nuevo directorio)
- `docker-compose.yml` actualizado (o nuevo en raíz)

---

### Fase 2: Migración de storage-sqlite (2-3 días)
**Objetivo**: Implementar microservicio de almacenamiento genérico

**Tareas:**
1. Implementar controlador genérico de almacenamiento
   - Endpoints CRUD para `/storage/:table`
   - Validación de tabla permitida (whitelist)
   - Validación de campos permitidos (select, update)

2. Implementar servicio de almacenamiento
   - Abstracción sobre TypeORM Repository
   - Métodos genéricos: `create()`, `findAll()`, `findOne()`, `update()`, `delete()`
   - Soporte para filtros por query params (ej: `?filter[category]=X`)

3. Migrar entidad `PasswordManager`
   - Mover `entitys/password-manager.entity.ts` a `storage-sqlite`
   - Configurar providers de base de datos en `storage-sqlite`

4. Implementar sistema de migraciones
   - Endpoint para ejecutar migraciones
   - Endpoint para consultar estado de migraciones

5. Configurar autenticación básica entre servicios
   - API Key en headers (X-API-Key)

**Archivos a Crear/Modificar:**
- `storage-sqlite/src/modules/storage/storage.controller.ts` (nuevo)
- `storage-sqlite/src/modules/storage/storage.service.ts` (nuevo)
- `storage-sqlite/src/entitys/password-manager.entity.ts` (movido)
- `storage-sqlite/src/providers/database.providers.ts` (movido/adaptado)
- `storage-sqlite/src/dto/storage-query.dto.ts` (nuevo, para filtros)

---

### Fase 3: Migración de password-service (2-3 días)
**Objetivo**: Implementar microservicio de lógica de negocio

**Tareas:**
1. Migrar `PasswordManagerService`
   - Remover dependencia directa de TypeORM Repository
   - Inyectar cliente HTTP (HttpService de NestJS)
   - Adaptar métodos para llamar a `storage-sqlite`

2. Migrar `PasswordManagerController`
   - Mantener endpoints públicos
   - Adaptar para usar servicio actualizado

3. Migrar DTOs
   - `CreatePasswordManagerDto`, `UpdatePasswordManagerDto`, `DecryptPasswordDto`
   - `ResponseDTO` (compartido o duplicado según necesidad)

4. Implementar cliente de almacenamiento
   - Servicio `StorageClientService` que encapsula llamadas HTTP
   - Manejo de errores y retry policies
   - Transformación de datos (entidades ↔ DTOs)

5. Mantener lógica de cifrado/descifrado
   - Métodos privados en `PasswordManagerService`
   - No cambiar algoritmo de cifrado

**Archivos a Crear/Modificar:**
- `password-service/src/modules/password-manager/password-manager.service.ts` (adaptado)
- `password-service/src/modules/password-manager/password-manager.controller.ts` (mantener)
- `password-service/src/dto/password-manager.dto.ts` (movido)
- `password-service/src/dto/response.dto.ts` (movido)
- `password-service/src/providers/storage-client.provider.ts` (nuevo)
- `password-service/src/modules/storage-client/storage-client.service.ts` (nuevo)

---

### Fase 4: Limpieza y Optimización (1-2 días)
**Objetivo**: Eliminar código obsoleto y optimizar comunicación

**Tareas:**
1. Remover código obsoleto de `m1`
   - Archivos no utilizados
   - Dependencias no necesarias

2. Optimizar comunicación entre servicios
   - Implementar caché en `password-service` (opcional)
   - Conexiones HTTP persistentes
   - Timeout y retry policies

3. Documentación
   - Actualizar README.md de cada microservicio
   - Documentar API de `storage-sqlite`
   - Documentar variables de entorno

4. Testing
   - Tests unitarios en ambos servicios
   - Tests E2E con ambos servicios corriendo
   - Tests de integración (mock de `storage-sqlite` en `password-service`)

**Archivos a Modificar:**
- Eliminar `microservices/m1/` (o mantener como referencia temporal)
- `password-service/README.md` (nuevo)
- `storage-sqlite/README.md` (nuevo)
- `docker-compose.yml` (actualizado)

---

### Fase 5: Producción y Monitoreo (1 día)
**Objetivo**: Preparar para despliegue en producción

**Tareas:**
1. Configurar logging centralizado
2. Configurar health checks en ambos servicios
3. Configurar variables de entorno para producción
4. Actualizar Dockerfiles y docker-compose
5. Documentar proceso de despliegue

---

## 7. Estimación de Cambios de Archivos

### Archivos a Crear (Nuevos)

#### `password-service/`:
- `package.json` (nuevo, basado en m1)
- `tsconfig.json` (nuevo, basado en m1)
- `src/main.ts` (nuevo, adaptado)
- `src/app.module.ts` (nuevo)
- `src/app.controller.ts` (nuevo, opcional)
- `src/app.service.ts` (nuevo, opcional)
- `src/modules/password-manager/password-manager.controller.ts` (nuevo, copiado de m1)
- `src/modules/password-manager/password-manager.service.ts` (nuevo, adaptado)
- `src/modules/storage-client/storage-client.service.ts` (nuevo)
- `src/modules/storage-client/storage-client.module.ts` (nuevo)
- `src/dto/password-manager.dto.ts` (nuevo, copiado de m1)
- `src/dto/response.dto.ts` (nuevo, copiado de m1)
- `src/interceptors/response-format.interceptor.ts` (nuevo, copiado de m1)
- `src/configurations/configuration.ts` (nuevo, adaptado)
- `src/helpers/*.ts` (nuevos, copiados de m1)
- `Dockerfile` (nuevo, basado en m1)
- `docker-compose.yml` (nuevo, o actualizar existente)
- `README.md` (nuevo)

**Total estimado: ~18-20 archivos nuevos**

#### `storage-sqlite/`:
- `package.json` (nuevo, basado en m1)
- `tsconfig.json` (nuevo, basado en m1)
- `src/main.ts` (nuevo, adaptado)
- `src/app.module.ts` (nuevo)
- `src/app.controller.ts` (nuevo, opcional)
- `src/app.service.ts` (nuevo, opcional)
- `src/modules/storage/storage.controller.ts` (nuevo)
- `src/modules/storage/storage.service.ts` (nuevo)
- `src/modules/storage/storage.module.ts` (nuevo)
- `src/modules/migrations/migrations.controller.ts` (nuevo)
- `src/modules/migrations/migrations.service.ts` (nuevo)
- `src/modules/migrations/migrations.module.ts` (nuevo)
- `src/entitys/password-manager.entity.ts` (nuevo, movido de m1)
- `src/providers/database.providers.ts` (nuevo, movido de m1)
- `src/dto/storage-query.dto.ts` (nuevo)
- `src/dto/storage-response.dto.ts` (nuevo)
- `src/interceptors/response-format.interceptor.ts` (nuevo, copiado de m1)
- `src/configurations/configuration.ts` (nuevo, adaptado)
- `src/helpers/*.ts` (nuevos, copiados de m1)
- `src/middlewares/api-key.middleware.ts` (nuevo, autenticación)
- `Dockerfile` (nuevo, basado en m1)
- `README.md` (nuevo)

**Total estimado: ~20-22 archivos nuevos**

### Archivos a Modificar
- `docker-compose.yml` (raíz o en m1) - Actualizar para ambos servicios
- Variables de entorno (`.env` o similar) - Agregar `STORAGE_SERVICE_URL`, `API_KEY`

### Archivos a Eliminar (después de migración)
- `microservices/m1/` - Todo el directorio (opcional: mantener como referencia temporal)

---

## 8. Resumen Ejecutivo

### Arquitectura Propuesta
- **password-service**: API pública con lógica de negocio (cifrado, validación)
- **storage-sqlite**: API genérica de almacenamiento (CRUD parametrizado)

### Puntos Clave
1. Separación de responsabilidades: negocio vs. persistencia
2. Comunicación HTTP REST entre servicios
3. Mantenimiento del stack tecnológico actual (NestJS, TypeScript, SQLite)
4. Migración incremental por fases

### Riesgos Principales
1. Pérdida de atomicidad en transacciones
2. Latencia adicional por comunicación HTTP
3. Complejidad operacional (dos servicios)

### Estimación Total
- **Tiempo**: 7-11 días de desarrollo
- **Archivos nuevos**: ~38-42 archivos
- **Archivos modificados**: ~2-3 archivos
- **Archivos eliminados**: ~1 directorio (m1)

---

## 9. Próximos Pasos Recomendados

1. **Revisar y aprobar** este informe con el equipo
2. **Definir autenticación** entre servicios (API Key vs JWT)
3. **Definir estrategia de migración de datos** (si hay datos en producción)
4. **Configurar entorno de desarrollo** para ambos servicios
5. **Iniciar Fase 1** del plan de refactor

---

**Fin del Informe**


