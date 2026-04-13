#!/bin/bash
# ============================================================
# AloClínica VPS Setup Script
# Execute via: bash vps-setup.sh
# VPS: 72.62.138.208 (Ubuntu 24.04 + Easypanel) - São Paulo
# ============================================================
set -euo pipefail

echo "=== AloClínica VPS Setup ==="
echo "IP: 72.62.138.208"
echo "Data: $(date)"

# ── 1. Add SSH public key (Claude Code access) ──────────────
echo "[1/6] Configurando chave SSH..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh

cat >> /root/.ssh/authorized_keys << 'SSHKEY'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF1jmpqEOw1/7AvUd5TC57f+oR8WC72JVNdoVAjoLmdB claude-aloclinica-vps
SSHKEY

chmod 600 /root/.ssh/authorized_keys
echo "  ✓ Chave SSH adicionada"

# ── 2. Enable password + key authentication ─────────────────
echo "[2/6] Configurando SSH..."
sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config
systemctl restart sshd
echo "  ✓ SSH configurado"

# ── 3. System updates ────────────────────────────────────────
echo "[3/6] Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git htop unzip
echo "  ✓ Sistema atualizado"

# ── 4. Docker (should be installed with Easypanel) ──────────
echo "[4/6] Verificando Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version
echo "  ✓ Docker OK"

# ── 5. Configure Easypanel port in nginx (proxy to 3010) ────
echo "[5/6] Configurando proxy Easypanel..."

# Create nginx proxy config for the app if not exists
cat > /etc/nginx/sites-available/aloclinica << 'NGINXCONF'
server {
    listen 80;
    server_name aloclinica.com.br www.aloclinica.com.br;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXCONF

# Only enable if nginx is present (Easypanel may use Traefik)
if command -v nginx &> /dev/null; then
  ln -sf /etc/nginx/sites-available/aloclinica /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
fi
echo "  ✓ Proxy configurado"

# ── 6. UFW firewall check ────────────────────────────────────
echo "[6/6] Verificando firewall local..."
ufw status 2>/dev/null || echo "  UFW não instalado (Hostinger firewall ativo)"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Setup concluído com sucesso!"
echo "  Easypanel: http://72.62.138.208:3000"
echo "  App (após deploy): http://72.62.138.208:3010"
echo "============================================"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "  1. Acesse http://72.62.138.208:3000 (Easypanel)"
echo "  2. Crie um projeto 'aloclinica'"
echo "  3. Adicione o GitHub Actions secret VPS_SSH_PRIVATE_KEY"
echo "  4. Faça push para a branch main para iniciar o deploy"
