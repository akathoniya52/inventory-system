#!/usr/bin/env bash
#
# Build the backend image (for cloud-compatible linux/amd64) and push it to Docker Hub.
#
# Usage:
#   ./push-backend.sh <dockerhub-username> [tag]
#
# Examples:
#   ./push-backend.sh johndoe                 # -> johndoe/inventorypro-backend:latest
#   ./push-backend.sh johndoe v1.0.0          # -> johndoe/inventorypro-backend:v1.0.0
#
# Environment overrides:
#   IMAGE_NAME   image repo name              (default: inventorypro-backend)
#   PLATFORM     target platform              (default: linux/amd64)
#   LOAD_LOCAL   also load image into local docker (default: false)
#
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}›${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; }

# --- Args --------------------------------------------------------------------
USER="${1:-}"
TAG="${2:-latest}"
IMAGE_NAME="${IMAGE_NAME:-inventorypro-backend}"
PLATFORM="${PLATFORM:-linux/amd64}"

if [ -z "$USER" ]; then
  error "Docker Hub username required."
  echo "Usage: ./push-backend.sh <dockerhub-username> [tag]"
  exit 1
fi

IMAGE="docker.io/${USER}/${IMAGE_NAME}:${TAG}"

# --- Pre-flight --------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  error "Docker is not installed."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  error "Docker daemon is not running. Start Docker Desktop and retry."
  exit 1
fi

# Ensure a buildx builder exists (needed for --platform cross-builds).
if ! docker buildx inspect inventorypro-builder >/dev/null 2>&1; then
  info "Creating buildx builder 'inventorypro-builder'…"
  docker buildx create --name inventorypro-builder --use >/dev/null
else
  docker buildx use inventorypro-builder
fi

# --- Docker Hub login --------------------------------------------------------
if ! docker system info 2>/dev/null | grep -q "Username:"; then
  info "Logging in to Docker Hub (user: ${USER})…"
  docker login -u "$USER"
fi

# --- Build & push ------------------------------------------------------------
info "Building ${IMAGE} for ${PLATFORM} and pushing to Docker Hub…"

EXTRA_FLAGS=(--push)
if [ "${LOAD_LOCAL:-false}" = "true" ]; then
  warn "LOAD_LOCAL=true: building single-arch and loading locally as well."
fi

docker buildx build \
  --platform "$PLATFORM" \
  -t "$IMAGE" \
  "${EXTRA_FLAGS[@]}" \
  ./backend

echo
ok "Pushed: ${IMAGE}"
echo -e "   Docker Hub: ${GREEN}https://hub.docker.com/r/${USER}/${IMAGE_NAME}/tags${NC}"
echo
info "Pull it anywhere with:  docker pull ${USER}/${IMAGE_NAME}:${TAG}"
