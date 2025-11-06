# 🐳 Despliegue con Docker

Este documento explica cómo desplegar la aplicación M8 Final Backend usando Docker.

## 📋 Prerrequisitos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)

## 🚀 Inicio Rápido

### Opción 1: Script Automático
```bash
./docker-start.sh
```

### Opción 2: Comandos Manuales

1. **Construir y ejecutar:**
```bash
docker compose up --build -d
```

2. **Ver logs:**
```bash
docker compose logs -f
```

3. **Detener la aplicación:**
```bash
docker compose down
```

## 🌐 Acceso a la Aplicación

- **API Principal:** http://localhost:3000
- **Swagger Documentation:** http://localhost:3000/api
- **Nginx Proxy:** http://localhost:8080

## 📁 Estructura de Archivos Docker

```
├── Dockerfile              # Configuración del contenedor de la aplicación
├── docker-compose.yml      # Orquestación de servicios
├── .dockerignore           # Archivos a ignorar en el build
├── nginx.conf              # Configuración del proxy reverso
├── env.example             # Variables de entorno de ejemplo
├── docker-start.sh         # Script de inicio automático
└── DOCKER.md              # Esta documentación
```

## 🔧 Configuración

### Variables de Entorno

Copia `env.example` a `.env` y modifica según tus necesidades:

```bash
cp env.example .env
```

Variables principales:
- `PORT`: Puerto de la aplicación (default: 3000)
- `NODE_ENV`: Entorno de ejecución (production/development)
- `ENV_CORS`: Configuración CORS
- `ENV_SWAGGER_SHOW`: Mostrar documentación Swagger
- `ENV_SYNCHRONIZE`: Sincronización automática de base de datos

### Volúmenes

- `./data:/app/data`: Directorio para persistir datos de SQLite
- `./database.sqlite:/app/database.sqlite:ro`: Base de datos existente (solo lectura)

## 🛠️ Comandos Útiles

### Gestión de Contenedores
```bash
# Ver estado de contenedores
docker compose ps

# Reiniciar servicios
docker compose restart

# Reconstruir contenedores
docker compose up --build

# Detener y eliminar contenedores
docker compose down

# Detener y eliminar volúmenes
docker compose down -v
```

### Logs y Debugging
```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f app
docker compose logs -f nginx

# Ejecutar comando en el contenedor
docker compose exec app sh
```

### Limpieza
```bash
# Limpiar contenedores parados
docker compose rm

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo (¡CUIDADO!)
docker system prune -a
```

## 🔍 Troubleshooting

### Problema: Puerto ya en uso
```bash
# Verificar qué proceso usa el puerto
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usar puerto 3001 en lugar de 3000
  - "8081:80"    # Usar puerto 8081 en lugar de 8080
```

### Problema: Base de datos no se monta
```bash
# Verificar permisos del directorio
ls -la ./data

# Crear directorio si no existe
mkdir -p ./data
```

### Problema: Aplicación no responde
```bash
# Verificar logs
docker compose logs app

# Verificar salud del contenedor
docker compose ps
```

## 📊 Monitoreo

### Health Check
La aplicación incluye un health check que verifica:
- Disponibilidad del endpoint `/api`
- Intervalo: 30 segundos
- Timeout: 10 segundos
- Reintentos: 3

### Verificar Estado
```bash
# Estado de salud
docker compose ps

# Logs de health check
docker compose logs app | grep health
```

## 🔒 Seguridad

- La aplicación se ejecuta con un usuario no-root
- Los volúmenes tienen permisos apropiados
- Nginx actúa como proxy reverso
- Variables de entorno sensibles en archivos separados

## 📈 Escalabilidad

Para escalar horizontalmente:

```bash
# Escalar la aplicación
docker compose up --scale app=3 -d

# Verificar réplicas
docker compose ps
```

## 🆘 Soporte

Si encuentras problemas:

1. Verifica los logs: `docker compose logs -f`
2. Revisa la configuración en `docker-compose.yml`
3. Verifica que Docker esté funcionando: `docker --version`
4. Reinicia los servicios: `docker compose restart`
