#!/bin/bash
set -e

# KODA.BUILD — Setup inicial da VPS
# Rodar UMA VEZ na VPS: bash scripts/setup-vps.sh

echo "🔧 KODA.BUILD — Setup VPS"

# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar dependências
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Verificar Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi

# Criar diretório da app
mkdir -p /opt/koda
mkdir -p /var/www/certbot

# Copiar config Nginx
cp /opt/koda/nginx/koda.conf /etc/nginx/sites-available/koda
ln -sf /etc/nginx/sites-available/koda /etc/nginx/sites-enabled/koda
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar Nginx (sem SSL ainda)
nginx -t && systemctl reload nginx

echo "✅ Setup base concluído!"
echo "👉 Próximo: configurar /opt/koda/.env.production e rodar certbot"
