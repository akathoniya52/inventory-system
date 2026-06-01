#!/usr/bin/env bash
#
# InventoryPro — one-command startup script.
# Boots the full stack (PostgreSQL + FastAPI backend + React frontend) via Docker Compose.
#
# Usage:
#   ./start.sh                 Build (if needed) and start all services
#   ./start.sh up              Same as above
#   ./start.sh build           Force a clean rebuild, then start
#   ./start.sh down            Stop and remove containers (keeps the DB volume)
#   ./start.sh logs            Tail logs from all services
#   ./start.sh reset           Stop and DELETE the database volume (fresh start)
#   ./start.sh ps              Show service status
#
set -euo pipefail

# Always run from the directory this script lives in.
cd "$(dirname "$0")"

# --- Colours -----------------------------------------------------------------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}›${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; }

# --- Resolve the docker compose command --------------------------------------
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  error "Docker Compose not found. Install Docker Desktop or the compose plugin."
  exit 1
fi

# --- Pre-flight checks --------------------------------------------------------
preflight() {
  if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed."
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running. Start Docker Desktop and retry."
    exit 1
  fi
  if [ ! -f .env ]; then
    warn ".env not found — creating one from .env.example"
    cp .env.example .env
    ok "Created .env (edit it to change credentials/secrets)"
  fi
}

print_urls() {
  echo
  ok "InventoryPro is up!"
  echo -e "   ${GREEN}Frontend${NC}     http://localhost:3000"
  echo -e "   ${GREEN}Backend API${NC}  http://localhost:8000"
  echo -e "   ${GREEN}API docs${NC}     http://localhost:8000/docs"
  echo
  echo -e "   Login: ${YELLOW}admin@inventorypro.com${NC} / ${YELLOW}admin123${NC}"
  echo
  info "Follow logs with:  ./start.sh logs"
}

CMD="${1:-up}"

case "$CMD" in
  up)
    preflight
    info "Starting services (building images on first run)…"
    $DC up -d --build
    print_urls
    ;;
  build)
    preflight
    info "Rebuilding images from scratch…"
    $DC build --no-cache
    $DC up -d
    print_urls
    ;;
  down)
    info "Stopping services (database volume preserved)…"
    $DC down
    ok "Stopped."
    ;;
  reset)
    warn "This will DELETE all database data."
    read -r -p "Continue? [y/N] " reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      $DC down -v
      ok "Containers and database volume removed."
    else
      info "Aborted."
    fi
    ;;
  logs)
    $DC logs -f
    ;;
  ps)
    $DC ps
    ;;
  *)
    error "Unknown command: $CMD"
    echo "Usage: ./start.sh [up|build|down|reset|logs|ps]"
    exit 1
    ;;
esac
