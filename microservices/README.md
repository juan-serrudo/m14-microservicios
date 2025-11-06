# Gestor de Contraseñas - Backend

## Descripción

Sistema de gestión de contraseñas seguro desarrollado con NestJS, que implementa técnicas de criptografía avanzada para el almacenamiento seguro de credenciales.

## Características de Seguridad

- **Cifrado AES**: Las contraseñas se cifran usando el algoritmo AES antes de ser almacenadas
- **Hash bcrypt**: Las claves maestras se hashean con bcrypt (12 rounds) para máxima seguridad
- **Verificación de clave maestra**: Todas las operaciones sensibles requieren verificación de la clave maestra
- **Almacenamiento seguro**: No se almacenan contraseñas en texto plano
- **Base de datos SQLite**: Persistencia segura con TypeORM

## Tecnologías Utilizadas

- **NestJS 11**: Framework de Node.js
- **TypeORM**: ORM para base de datos
- **SQLite**: Base de datos local
- **bcryptjs**: Hashing de claves maestras
- **crypto-js**: Cifrado AES de contraseñas
- **Swagger**: Documentación de API
- **class-validator**: Validación de DTOs

## Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Variables de Entorno

```bash
# Puerto del servidor
PORT=3000

# Tamaño máximo de requests
APP_MAX_SIZE=10mb

# Entorno (dev/prod)
ENV_ENTORNO=dev

# CORS (para producción)
ENV_CORS=https://dominio1.com,https://dominio2.com

# Habilitar Swagger
ENV_SWAGGER_SHOW=true

# Sincronización de base de datos (solo desarrollo)
ENV_SYNCHRONIZE=false
```

## Endpoints de la API

### Gestión de Contraseñas

- `GET /password-manager` - Obtener todas las entradas
- `GET /password-manager/:id` - Obtener entrada específica
- `GET /password-manager/category/:category` - Filtrar por categoría
- `POST /password-manager` - Crear nueva entrada
- `PUT /password-manager/:id` - Actualizar entrada
- `DELETE /password-manager/:id?masterKey=xxx` - Eliminar entrada
- `POST /password-manager/:id/decrypt` - Descifrar contraseña

### Documentación Swagger

Una vez iniciado el servidor, accede a:
- **Swagger UI**: `http://localhost:3000/api`

## Ejemplo de Uso

### 1. Crear nueva entrada

```json
POST /password-manager
{
  "title": "Gmail Personal",
  "description": "Cuenta principal de Gmail",
  "username": "usuario@gmail.com",
  "password": "miContraseñaSegura123!",
  "url": "https://gmail.com",
  "category": "Email",
  "notes": "Cuenta creada en 2020",
  "masterKey": "miClaveMaestraSegura123!"
}
```

### 2. Descifrar contraseña

```json
POST /password-manager/1/decrypt
{
  "masterKey": "miClaveMaestraSegura123!"
}
```

### 3. Actualizar entrada

```json
PUT /password-manager/1
{
  "title": "Gmail Personal Actualizado",
  "masterKey": "miClaveMaestraSegura123!"
}
```

## Arquitectura de Seguridad

### Cifrado de Contraseñas
- **Algoritmo**: AES (Advanced Encryption Standard)
- **Clave**: Derivada de la clave maestra del usuario
- **Resultado**: Contraseña cifrada almacenada en base de datos

### Hash de Clave Maestra
- **Algoritmo**: bcrypt
- **Rounds**: 12 (configurable)
- **Propósito**: Verificación segura sin almacenar la clave original

### Flujo de Seguridad
1. Usuario proporciona clave maestra
2. Sistema verifica hash con bcrypt
3. Si es válida, permite operaciones
4. Para descifrar: usa AES con clave maestra
5. Para cifrar: usa AES con clave maestra

## Estructura del Proyecto

```
src/
├── entitys/
│   └── password-manager.entity.ts    # Entidad de base de datos
├── dto/
│   └── password-manager.dto.ts        # DTOs de validación
├── modules/
│   └── password-manager/
│       ├── password-manager.controller.ts
│       └── password-manager.service.ts
├── providers/
│   └── password-manager.providers.ts  # Proveedores de repositorio
└── configurations/
    └── configuration.ts               # Configuración de entorno
```

## Consideraciones de Seguridad

1. **Nunca almacenar claves maestras en texto plano**
2. **Usar HTTPS en producción**
3. **Implementar rate limiting**
4. **Logs de auditoría para operaciones sensibles**
5. **Backup seguro de la base de datos**

## Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar tests
npm run test

# Linting
npm run lint
```

## Autor

**Juan Victor Serrudo Chavez**
- Email: juan.serrudo@ucb.edu.bo
- Proyecto: Módulo 8 - Maestría UCB
