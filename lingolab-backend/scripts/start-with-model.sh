#!/bin/bash
# Start LingoLab Backend + AI Model + PostgreSQL together
# =======================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
MODEL_DIR="$BACKEND_DIR/../modelIELTS"
MODEL_CONTAINER_NAME="ielts-scoring-api"
POSTGRES_CONTAINER_NAME="lingolab_postgres_dev"
# Image name from docker-compose (folder-service format with hyphen)
MODEL_IMAGE_NAME="modelielts-ielts-api"

# Database config (should match .env)
DB_PORT="${DB_PORT:-54321}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-lingolab_db}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LingoLab Full Stack...${NC}"
echo ""

# Track what we started to clean up properly
POSTGRES_WAS_RUNNING_BEFORE=0
MODEL_WAS_RUNNING_BEFORE=0

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null
    
    # Stop AI Model Docker container
    if [ "$KEEP_MODEL_RUNNING" = "1" ]; then
        echo -e "${YELLOW}   KEEP_MODEL_RUNNING=1 -> leaving AI Model container running${NC}"
    elif [ "$MODEL_WAS_RUNNING_BEFORE" -eq 1 ]; then
        echo -e "${YELLOW}   AI Model was already running -> leaving it untouched${NC}"
    else
        cd "$MODEL_DIR"
        echo -e "${YELLOW}   Stopping AI Model container...${NC}"
        docker-compose down 2>/dev/null
    fi

    # Stop PostgreSQL container
    if [ "$KEEP_DB_RUNNING" = "1" ]; then
        echo -e "${YELLOW}   KEEP_DB_RUNNING=1 -> leaving PostgreSQL container running${NC}"
    elif [ "$POSTGRES_WAS_RUNNING_BEFORE" -eq 1 ]; then
        echo -e "${YELLOW}   PostgreSQL was already running -> leaving it untouched${NC}"
    else
        echo -e "${YELLOW}   Stopping PostgreSQL container...${NC}"
        docker stop "$POSTGRES_CONTAINER_NAME" 2>/dev/null
        docker rm "$POSTGRES_CONTAINER_NAME" 2>/dev/null
    fi
    
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# ===================================================================
# 1. START POSTGRESQL DATABASE
# ===================================================================
echo -e "${GREEN}🗄️  Starting PostgreSQL Database (port $DB_PORT)...${NC}"

# Check if any container is already using the port
EXISTING_CONTAINER_ON_PORT=$(docker ps --format '{{.Names}}' -f "publish=$DB_PORT" 2>/dev/null | head -1)

if [ -n "$EXISTING_CONTAINER_ON_PORT" ]; then
    # A container is already using this port - use it!
    POSTGRES_CONTAINER_NAME="$EXISTING_CONTAINER_ON_PORT"
    POSTGRES_WAS_RUNNING_BEFORE=1
    echo -e "${GREEN}✅ Found existing PostgreSQL container: $POSTGRES_CONTAINER_NAME (port $DB_PORT)${NC}"
else
    # Check if our preferred container exists (running or stopped)
    POSTGRES_RUNNING=$(docker ps -q -f "name=^${POSTGRES_CONTAINER_NAME}$")
    POSTGRES_EXISTS=$(docker ps -aq -f "name=^${POSTGRES_CONTAINER_NAME}$")

    if [ -n "$POSTGRES_RUNNING" ]; then
        # Container is running
        POSTGRES_WAS_RUNNING_BEFORE=1
        echo -e "${GREEN}✅ PostgreSQL container already running${NC}"
    elif [ -n "$POSTGRES_EXISTS" ]; then
        # Container exists but stopped - try to start it
        echo -e "${YELLOW}🔄 Starting existing PostgreSQL container...${NC}"
        if ! docker start "$POSTGRES_CONTAINER_NAME" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Failed to start existing container, removing and recreating...${NC}"
            docker rm "$POSTGRES_CONTAINER_NAME" 2>/dev/null
            POSTGRES_EXISTS=""
        fi
    fi

    # If container doesn't exist, create it
    if [ -z "$POSTGRES_EXISTS" ] && [ -z "$POSTGRES_RUNNING" ]; then
        # Check if port is used by another non-docker process
        PORT_IN_USE=$(ss -tlnp 2>/dev/null | grep ":$DB_PORT " | head -1)
        if [ -n "$PORT_IN_USE" ]; then
            echo -e "${RED}❌ Port $DB_PORT is already in use by another process.${NC}"
            echo -e "${YELLOW}   Run: sudo lsof -i :$DB_PORT  to see what's using it${NC}"
            exit 1
        fi

        echo -e "${GREEN}🛠️  Creating new PostgreSQL container...${NC}"
        if ! docker run -d \
            --name "$POSTGRES_CONTAINER_NAME" \
            -e POSTGRES_USER="$DB_USER" \
            -e POSTGRES_PASSWORD="$DB_PASSWORD" \
            -e POSTGRES_DB="$DB_NAME" \
            -p "$DB_PORT:5432" \
            -v lingolab_postgres_data:/var/lib/postgresql/data \
            --health-cmd="pg_isready -U $DB_USER" \
            --health-interval=5s \
            --health-timeout=5s \
            --health-retries=10 \
            postgres:15-alpine; then
            echo -e "${RED}❌ Failed to create PostgreSQL container${NC}"
            # Clean up failed container if it was created
            docker rm "$POSTGRES_CONTAINER_NAME" 2>/dev/null
            exit 1
        fi
    fi
fi

# Wait for PostgreSQL to be ready (only if we just started it)
if [ "$POSTGRES_WAS_RUNNING_BEFORE" -eq 0 ]; then
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    MAX_ATTEMPTS=30
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Check if container is actually running
        CONTAINER_RUNNING=$(docker ps -q -f "name=^${POSTGRES_CONTAINER_NAME}$")
        if [ -z "$CONTAINER_RUNNING" ]; then
            CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$POSTGRES_CONTAINER_NAME" 2>/dev/null || echo "not found")
            echo -e "${RED}❌ Container is not running (status: $CONTAINER_STATUS)${NC}"
            echo -e "${YELLOW}   Check logs: docker logs $POSTGRES_CONTAINER_NAME${NC}"
            exit 1
        fi
        
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER_NAME" 2>/dev/null || echo "starting")
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "${GREEN}✅ PostgreSQL is ready on port $DB_PORT${NC}"
            break
        fi
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo -e "${YELLOW}   Waiting... ($ATTEMPT/$MAX_ATTEMPTS) - status: $HEALTH${NC}"
            sleep 2
        fi
    done

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ PostgreSQL failed to become healthy. Check: docker logs $POSTGRES_CONTAINER_NAME${NC}"
        exit 1
    fi
fi

echo ""

# ===================================================================
# 2. RUN MIGRATIONS & SEED DATA IF NEEDED
# ===================================================================
echo -e "${GREEN}🔄 Running database migrations...${NC}"
cd "$BACKEND_DIR"

# Run migrations (may fail if tables already exist from synchronize:true era)
MIGRATION_OUTPUT=$(npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
    # Check if it's because tables already exist
    if echo "$MIGRATION_OUTPUT" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠️  Tables already exist (likely created by synchronize:true)${NC}"
        echo -e "${YELLOW}   Skipping migrations - database schema is already set up${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        echo "$MIGRATION_OUTPUT"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# Check if database is empty (no users = fresh database)
echo -e "${YELLOW}🔍 Checking if database needs seeding...${NC}"
USER_COUNT=$(docker exec "$POSTGRES_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo -e "${GREEN}🌱 Fresh database detected! Running seed script...${NC}"
    npx ts-node scripts/seed-database.ts
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Seed failed, but continuing...${NC}"
    else
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
    fi
else
    echo -e "${GREEN}✅ Database already has data ($USER_COUNT users), skipping seed${NC}"
fi

echo ""

# ===================================================================
# 3. START AI MODEL
# ===================================================================
echo -e "${GREEN}📊 Starting AI Scoring Model (port 8000) via Docker...${NC}"
cd "$MODEL_DIR"

MODEL_RUNNING=$(docker ps -q -f "name=${MODEL_CONTAINER_NAME}")

# Track if the model was running before to avoid stopping it on exit
if [ -n "$MODEL_RUNNING" ]; then
    MODEL_WAS_RUNNING_BEFORE=1
fi

# Decide whether we need to (re)start the model
MODEL_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$MODEL_CONTAINER_NAME" 2>/dev/null || echo "unknown")

if [ -n "$MODEL_RUNNING" ] && [ "$MODEL_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ AI Model already running and healthy -> skipping rebuild/start${NC}"
else
    if [ -n "$MODEL_RUNNING" ]; then
        echo -e "${YELLOW}⚠️  AI Model container is running but not healthy yet (health: $MODEL_HEALTH).${NC}"
        echo -e "${YELLOW}   Waiting for it to become healthy...${NC}"
    else
        # Check if image already exists (avoid rebuilding!)
        MODEL_IMAGE_EXISTS=$(docker images -q "$MODEL_IMAGE_NAME" 2>/dev/null)
        
        if [ -n "$MODEL_IMAGE_EXISTS" ] && [ -z "$FORCE_MODEL_BUILD" ]; then
            echo -e "${GREEN}✅ Found existing AI Model image: $MODEL_IMAGE_NAME${NC}"
            echo -e "${GREEN}🔁 Starting container from existing image...${NC}"
            docker-compose up -d
        else
            if [ -n "$FORCE_MODEL_BUILD" ]; then
                echo -e "${YELLOW}🛠️  FORCE_MODEL_BUILD=1 -> Rebuilding AI Model image...${NC}"
            else
                echo -e "${YELLOW}🛠️  No existing image found, building AI Model (this may take a while)...${NC}"
            fi
            docker-compose up -d --build
        fi
    fi

    echo -e "${YELLOW}⏳ Waiting for model to initialize (this may take 30-60 seconds)...${NC}"
    sleep 5

    # Check if model started
    MAX_ATTEMPTS=12
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ AI Model is running on http://localhost:8000${NC}"
            break
        fi
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo -e "${YELLOW}   Still loading... ($ATTEMPT/$MAX_ATTEMPTS)${NC}"
            sleep 5
        fi
    done

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${YELLOW}⚠️  AI Model may still be loading. Check: docker logs $MODEL_CONTAINER_NAME${NC}"
    fi

    echo ""
fi

# Start Backend
BACKEND_PORT="${PORT:-3001}"
echo -e "${GREEN}🖥️  Starting Backend API (port $BACKEND_PORT)...${NC}"
cd "$BACKEND_DIR"
npx tsoa spec-and-routes && npx ts-node src/server.ts &
BACKEND_PID=$!

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🎉 All services started!${NC}"
echo ""
echo -e "   PostgreSQL:   ${BLUE}localhost:$DB_PORT${NC}"
echo -e "   Backend API:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "   Swagger Docs: ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "   AI Model:     ${BLUE}http://localhost:8000${NC}"
echo -e "   Model Docs:   ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}================================${NC}"

# Wait for backend process (model runs in Docker)
wait $BACKEND_PID
