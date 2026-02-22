#!/bin/bash
set -e

# ─── Trade App — GCP Cloud Run Deployment Script ─────────
#
# Usage:
#   ./scripts/deploy.sh                    # Deploy with defaults
#   ./scripts/deploy.sh --project my-proj  # Specify GCP project
#   ./scripts/deploy.sh --region us-east1  # Specify region
#
# Prerequisites:
#   1. Google Cloud SDK (gcloud) installed
#   2. Docker installed (for local builds) OR use --cloud-build
#   3. Authenticated: gcloud auth login
#   4. Project set: gcloud config set project <PROJECT_ID>
#
# ─────────────────────────────────────────────────────────

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
REGION="us-central1"
SERVICE_NAME="trade-app"
CLOUD_BUILD=false
PROJECT_ID=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --project) PROJECT_ID="$2"; shift ;;
    --region) REGION="$2"; shift ;;
    --service) SERVICE_NAME="$2"; shift ;;
    --cloud-build) CLOUD_BUILD=true ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --project <ID>    GCP project ID (default: current gcloud project)"
      echo "  --region <REGION> Cloud Run region (default: us-central1)"
      echo "  --service <NAME>  Cloud Run service name (default: trade-app)"
      echo "  --cloud-build     Use Cloud Build instead of local Docker"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Get project ID if not provided
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
  if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project set. Run 'gcloud config set project <PROJECT_ID>' or pass --project${NC}"
    exit 1
  fi
fi

IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"
TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Trade App — Cloud Run Deployment       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Project:  ${GREEN}$PROJECT_ID${NC}"
echo -e "  Region:   ${GREEN}$REGION${NC}"
echo -e "  Service:  ${GREEN}$SERVICE_NAME${NC}"
echo -e "  Image:    ${GREEN}$IMAGE:$TAG${NC}"
echo ""

# ─── Step 1: Enable required APIs ────────────────────────
echo -e "${YELLOW}[1/4] Enabling required GCP APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID" 2>/dev/null

echo -e "${GREEN}  ✓ APIs enabled${NC}"

# ─── Step 2: Build the Docker image ─────────────────────
echo ""
echo -e "${YELLOW}[2/4] Building Docker image...${NC}"

if [ "$CLOUD_BUILD" = true ]; then
  echo "  Using Cloud Build..."
  gcloud builds submit \
    --tag "$IMAGE:$TAG" \
    --project="$PROJECT_ID" \
    --timeout=1200s
else
  echo "  Building locally..."
  docker build -t "$IMAGE:$TAG" -t "$IMAGE:latest" .

  echo ""
  echo -e "${YELLOW}[3/4] Pushing image to GCR...${NC}"
  docker push "$IMAGE:$TAG"
  docker push "$IMAGE:latest"
fi

echo -e "${GREEN}  ✓ Image built and pushed${NC}"

# ─── Step 3: Load env vars ──────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Loading environment variables...${NC}"

ENV_VARS="NODE_ENV=production"

# Load from .env.local if available
if [ -f ".env.local" ]; then
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # Only include non-empty values
    if [ -n "$value" ]; then
      ENV_VARS="$ENV_VARS,$key=$value"
    fi
  done < .env.local
  echo -e "${GREEN}  ✓ Environment variables loaded from .env.local${NC}"
else
  echo -e "${YELLOW}  ⚠ No .env.local found. Set env vars manually in Cloud Run console.${NC}"
fi

# ─── Step 4: Deploy to Cloud Run ────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Deploying to Cloud Run...${NC}"

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE:$TAG" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "$ENV_VARS" \
  --execution-environment gen2

# ─── Done ────────────────────────────────────────────────
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format 'value(status.url)' 2>/dev/null)

echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Deployment Complete! 🚀              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Service URL: ${BLUE}$SERVICE_URL${NC}"
echo ""
echo -e "  ${YELLOW}Note: SQLite data is ephemeral on Cloud Run.${NC}"
echo -e "  ${YELLOW}For persistent data, configure a Cloud Storage${NC}"
echo -e "  ${YELLOW}FUSE mount or switch to Cloud SQL.${NC}"
echo ""
