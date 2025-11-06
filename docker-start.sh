#!/bin/bash

# Script para iniciar la aplicación con Docker

echo "🐳 Iniciando el Gestir de Contraseñas con Docker..."

# Crear directorio para datos si no existe
mkdir -p ./data

# Copiar archivo de ejemplo de variables de entorno si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde env.example..."
    cp env.example .env
fi

# Construir y ejecutar con docker-compose
echo "🔨 Construyendo y ejecutando contenedores..."
docker compose up --build -d

echo "✅ Aplicación iniciada correctamente!"
echo "🌐 API disponible en: http://localhost:3000/api"
echo "📚 Swagger disponible en: http://localhost:3000/api-docs"
echo "🔧 Nginx proxy disponible en: http://localhost:8080"

echo ""
echo "📋 Comandos útiles:"
echo "  - Ver logs: docker compose logs -f"
echo "  - Detener: docker compose down"
echo "  - Reiniciar: docker compose restart"
echo "  - Estado: docker compose ps"
