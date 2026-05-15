#!/bin/bash
set -e

# KODA.BUILD — Deploy Script
# Uso: ./scripts/deploy.sh [production|staging]

ENV=${1:-production}
APP_DIR="/opt/koda"
REPO_URL="https://github.com/mmpavao/SmartCODE.git"

echo "🚀 KODA.BUILD — Deploy [$ENV]"

# Pull latest code
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git pull origin main
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Copiar .env de produção (deve estar em /opt/koda/.env.production na VPS)
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production não encontrado em $APP_DIR!"
    exit 1
fi

# Build e deploy
if [ "$ENV" = "production" ]; then
    docker compose --profile production up -d --build
    echo "✅ Produção rodando em https://koda.build"
elif [ "$ENV" = "staging" ]; then
    docker compose --profile staging up -d --build
    echo "✅ Staging rodando em https://kodabuild.com.br"
fi

# Health check
sleep 10
if [ "$ENV" = "production" ]; then
    curl -fsS http://localhost:5173/ > /dev/null && echo "✅ Health check OK" || echo "❌ Health check falhou"
fi

echo "🎉 Deploy [$ENV] concluído!"
