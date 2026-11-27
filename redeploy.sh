#!/usr/bin/env bash
# ==============================================================================
# DPP Recruitment Portal - Docker Redeploy Script
# ==============================================================================
# Script ini digunakan untuk redeploy aplikasi di VM/server Docker secara otomatis.
#
# Penggunaan:
#   ./redeploy.sh          -> Mode interaktif (atau default: Safe Redeploy)
#   ./redeploy.sh --safe   -> Redeploy AMAN: pertahankan data database, selesaikan
#                             konflik migrasi baseline otomatis.
#   ./redeploy.sh --fresh  -> Fresh Reset: hapus volume database lama (reset dari 0),
#                             terapkan migrasi init baru, dan seed ulang data master.
# ==============================================================================

set -e

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     DPP Recruitment Portal - Docker Redeploy         ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Tentukan nama project dan container
COMPOSE_FILE="docker-compose.yml"
DB_CONTAINER="recruitment-portal_db"
APP_CONTAINER="recruitment-portal_app"
DB_NAME="recruitment_db"
DB_USER="postgres"
HEALTH_URL="http://127.0.0.1:3020/api/health"

MODE=""

# Parsing argumen
case "$1" in
  --fresh|-f)
    MODE="fresh"
    ;;
  --safe|-s)
    MODE="safe"
    ;;
  --help|-h)
    echo "Penggunaan: $0 [--safe | --fresh]"
    echo "  --safe   : Pertahankan data DB, selesaikan migrasi conflict otomatis (Default)"
    echo "  --fresh  : Hapus database volume lama, buat database baru dari 0 (Data dihapus)"
    exit 0
    ;;
  *)
    # Jika dijalankan di terminal interaktif
    if [ -t 0 ]; then
      echo -e "${YELLOW}Pilih Mode Redeploy:${NC}"
      echo "  1) Safe Mode        : Pertahankan data DB, selesaikan status migrasi (Disarankan jika ada data)"
      echo "  2) Fresh Reset Mode : Hapus volume DB lama & reset dari nol (Disarankan jika ingin bersih)"
      read -rp "Pilihan Anda [1/2] (Default: 1): " choice
      if [ "$choice" = "2" ]; then
        MODE="fresh"
      else
        MODE="safe"
      fi
    else
      MODE="safe"
    fi
    ;;
esac

if [ "$MODE" = "fresh" ]; then
  echo -e "\n${RED}[PERINGATAN] Anda memilih FRESH RESET MODE.${NC}"
  echo -e "${RED}Semua data di database lokal container akan DIHAPUS dan dibuat ulang dari 0.${NC}"
  if [ -t 0 ]; then
    read -rp "Apakah Anda yakin ingin melanjutkan? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "Dibatalkan."
      exit 0
    fi
  fi

  echo -e "\n${YELLOW}[1/4] Menghentikan container dan menghapus volume database lama...${NC}"
  docker compose -f "$COMPOSE_FILE" down -v

  echo -e "\n${YELLOW}[2/4] Melakukan build image app terbaru (--no-cache)...${NC}"
  docker compose -f "$COMPOSE_FILE" build --no-cache app

  echo -e "\n${YELLOW}[3/4] Menjalankan seluruh container (DB & App)...${NC}"
  docker compose -f "$COMPOSE_FILE" up -d

else
  echo -e "\n${GREEN}[SAFE MODE] Mempertahankan data database yang ada...${NC}"

  echo -e "\n${YELLOW}[1/4] Menghentikan container app (DB tetap running)...${NC}"
  docker compose -f "$COMPOSE_FILE" stop app 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" up -d db

  echo -e "\n${YELLOW}[2/4] Menunggu database siap...${NC}"
  until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    echo "Menunggu database..."
    sleep 2
  done

  echo -e "\n${YELLOW}[3/4] Memastikan status migrasi Prisma (resolving failed baseline if any)...${NC}"
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
    UPDATE \"_prisma_migrations\"
    SET finished_at = NOW(), applied_steps_count = 1, rolled_back_at = NULL, logs = NULL
    WHERE finished_at IS NULL;
  " 2>/dev/null || true

  echo -e "\n${YELLOW}[4/4] Membangun dan menjalankan ulang container app...${NC}"
  docker compose -f "$COMPOSE_FILE" up -d --build app
fi

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${YELLOW}Menunggu container app sehat (Healthcheck)...${NC}"

max_retries=15
counter=0
success=false

while [ $counter -lt $max_retries ]; do
  sleep 4
  counter=$((counter + 1))
  
  status=$(docker inspect --format='{{json .State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo "\"starting\"")
  
  if [ "$status" = "\"healthy\"" ]; then
    success=true
    break
  fi
  echo "Menunggu container sehat... ($counter/$max_retries - status: $status)"
done

echo -e "\n${BLUE}======================================================${NC}"
docker compose -f "$COMPOSE_FILE" ps

if [ "$success" = true ]; then
  echo -e "\n${GREEN}✔ Redeploy BERHASIL! Aplikasi berjalan normal dan healthy di port 3020.${NC}"
else
  echo -e "\n${YELLOW}Log 40 baris terakhir dari container app:${NC}"
  docker logs --tail 40 "$APP_CONTAINER"
  echo -e "\n${RED}Periksa log di atas jika ada kendala.${NC}"
fi
