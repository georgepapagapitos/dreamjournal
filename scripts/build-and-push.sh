#!/bin/bash
set -e

# Configuration
IMAGE_NAME="georgepapagapitos/dreamjournal"  # Your Docker Hub username
VERSION="${1:-latest}"

echo "🔨 Building multi-platform image: $IMAGE_NAME:$VERSION"

# Build for both amd64 (Linux server) and arm64 (Mac)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t $IMAGE_NAME:$VERSION \
  -t $IMAGE_NAME:latest \
  --push \
  .

echo "✅ Image pushed to Docker Hub: $IMAGE_NAME:$VERSION"
echo ""
echo "To deploy on your server, run:"
echo "  cd /srv/docker/dreamjournal"
echo "  docker compose pull"
echo "  docker compose up -d"