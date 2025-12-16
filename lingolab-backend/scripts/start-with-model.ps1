# Start LingoLab Backend + AI Model + PostgreSQL together (Windows PowerShell)
# ============================================================================

$ErrorActionPreference = "Stop"

# Directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
$ModelDir = Join-Path (Split-Path -Parent $BackendDir) "modelIELTS"
$ModelContainerName = "ielts-scoring-api"
$PostgresContainerName = "lingolab_postgres_dev"
$ModelImageName = "modelielts-ielts-api"

# Database config (should match .env)
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "54321" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "lingolab_db" }

# Track what we started
$script:PostgresWasRunningBefore = $false
$script:ModelWasRunningBefore = $false
$script:BackendProcess = $null

# Cleanup function
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    
    # Stop backend
    if ($script:BackendProcess -and !$script:BackendProcess.HasExited) {
        Write-Host "   Stopping Backend..." -ForegroundColor Yellow
        Stop-Process -Id $script:BackendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Stop AI Model Docker container
    if ($env:KEEP_MODEL_RUNNING -eq "1") {
        Write-Host "   KEEP_MODEL_RUNNING=1 -> leaving AI Model container running" -ForegroundColor Yellow
    } elseif ($script:ModelWasRunningBefore) {
        Write-Host "   AI Model was already running -> leaving it untouched" -ForegroundColor Yellow
    } else {
        Push-Location $ModelDir
        Write-Host "   Stopping AI Model container..." -ForegroundColor Yellow
        docker-compose down 2>$null
        Pop-Location
    }
    
    # Stop PostgreSQL container
    if ($env:KEEP_DB_RUNNING -eq "1") {
        Write-Host "   KEEP_DB_RUNNING=1 -> leaving PostgreSQL container running" -ForegroundColor Yellow
    } elseif ($script:PostgresWasRunningBefore) {
        Write-Host "   PostgreSQL was already running -> leaving it untouched" -ForegroundColor Yellow
    } else {
        Write-Host "   Stopping PostgreSQL container..." -ForegroundColor Yellow
        docker stop $PostgresContainerName 2>$null
        docker rm $PostgresContainerName 2>$null
    }
}

# Register cleanup on Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }
trap { Cleanup; break }

Write-Host "🚀 Starting LingoLab Full Stack..." -ForegroundColor Blue
Write-Host ""

# Check if Docker is running
try {
    docker info 2>$null | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# ===================================================================
# 1. START POSTGRESQL DATABASE
# ===================================================================
Write-Host "🗄️  Starting PostgreSQL Database (port $DbPort)..." -ForegroundColor Green

# Check if container is already running
$PostgresRunning = docker ps -q -f "name=^${PostgresContainerName}$" 2>$null
$PostgresExists = docker ps -aq -f "name=^${PostgresContainerName}$" 2>$null

if ($PostgresRunning) {
    $script:PostgresWasRunningBefore = $true
    Write-Host "✅ PostgreSQL container already running" -ForegroundColor Green
} elseif ($PostgresExists) {
    Write-Host "🔄 Starting existing PostgreSQL container..." -ForegroundColor Yellow
    docker start $PostgresContainerName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Failed to start existing container, removing and recreating..." -ForegroundColor Yellow
        docker rm $PostgresContainerName 2>$null
        $PostgresExists = $null
    }
}

# If container doesn't exist, create it
if (-not $PostgresRunning -and -not $PostgresExists) {
    Write-Host "🛠️  Creating new PostgreSQL container..." -ForegroundColor Green
    docker run -d `
        --name $PostgresContainerName `
        -e "POSTGRES_USER=$DbUser" `
        -e "POSTGRES_PASSWORD=$DbPassword" `
        -e "POSTGRES_DB=$DbName" `
        -p "${DbPort}:5432" `
        -v "lingolab_postgres_data:/var/lib/postgresql/data" `
        --health-cmd="pg_isready -U $DbUser" `
        --health-interval=5s `
        --health-timeout=5s `
        --health-retries=10 `
        postgres:15-alpine
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create PostgreSQL container" -ForegroundColor Red
        docker rm $PostgresContainerName 2>$null
        exit 1
    }
}

# Wait for PostgreSQL to be ready
if (-not $script:PostgresWasRunningBefore) {
    Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    $MaxAttempts = 30
    $Attempt = 0
    
    while ($Attempt -lt $MaxAttempts) {
        $Health = docker inspect --format='{{.State.Health.Status}}' $PostgresContainerName 2>$null
        if ($Health -eq "healthy") {
            Write-Host "✅ PostgreSQL is ready on port $DbPort" -ForegroundColor Green
            break
        }
        $Attempt++
        if ($Attempt -lt $MaxAttempts) {
            Write-Host "   Waiting... ($Attempt/$MaxAttempts) - status: $Health" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    
    if ($Attempt -eq $MaxAttempts) {
        Write-Host "❌ PostgreSQL failed to become healthy. Check: docker logs $PostgresContainerName" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ===================================================================
# 2. RUN MIGRATIONS & SEED DATA IF NEEDED
# ===================================================================
Write-Host "🔄 Running database migrations..." -ForegroundColor Green
Push-Location $BackendDir

$MigrationOutput = npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts 2>&1
$MigrationExit = $LASTEXITCODE

if ($MigrationExit -ne 0) {
    if ($MigrationOutput -match "already exists") {
        Write-Host "⚠️  Tables already exist (likely created by synchronize:true)" -ForegroundColor Yellow
        Write-Host "   Skipping migrations - database schema is already set up" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $MigrationOutput
        Pop-Location
        exit 1
    }
} else {
    Write-Host "✅ Migrations completed" -ForegroundColor Green
}

# Check if database needs seeding
Write-Host "🔍 Checking if database needs seeding..." -ForegroundColor Yellow
$UserCount = docker exec $PostgresContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM users;" 2>$null
$UserCount = if ($UserCount) { $UserCount.Trim() } else { "0" }

if ($UserCount -eq "0" -or [string]::IsNullOrEmpty($UserCount)) {
    Write-Host "🌱 Fresh database detected! Running seed script..." -ForegroundColor Green
    npx ts-node scripts/seed-database.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Seed failed, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Database already has data ($UserCount users), skipping seed" -ForegroundColor Green
}

Pop-Location
Write-Host ""

# ===================================================================
# 3. START AI MODEL
# ===================================================================
Write-Host "📊 Starting AI Scoring Model (port 8000) via Docker..." -ForegroundColor Green
Push-Location $ModelDir

$ModelRunning = docker ps -q -f "name=${ModelContainerName}" 2>$null

if ($ModelRunning) {
    $script:ModelWasRunningBefore = $true
}

$ModelHealth = docker inspect --format='{{.State.Health.Status}}' $ModelContainerName 2>$null
if (-not $ModelHealth) { $ModelHealth = "unknown" }

if ($ModelRunning -and $ModelHealth -eq "healthy") {
    Write-Host "✅ AI Model already running and healthy -> skipping rebuild/start" -ForegroundColor Green
} else {
    if ($ModelRunning) {
        Write-Host "⚠️  AI Model container is running but not healthy yet (health: $ModelHealth)." -ForegroundColor Yellow
        Write-Host "   Waiting for it to become healthy..." -ForegroundColor Yellow
    } else {
        $ModelImageExists = docker images -q $ModelImageName 2>$null
        
        if ($ModelImageExists -and -not $env:FORCE_MODEL_BUILD) {
            Write-Host "✅ Found existing AI Model image: $ModelImageName" -ForegroundColor Green
            Write-Host "🔁 Starting container from existing image..." -ForegroundColor Green
            docker-compose up -d
        } else {
            if ($env:FORCE_MODEL_BUILD) {
                Write-Host "🛠️  FORCE_MODEL_BUILD=1 -> Rebuilding AI Model image (no-cache)..." -ForegroundColor Yellow
                docker-compose build --no-cache
            } else {
                Write-Host "🛠️  No existing image found, building AI Model (this may take a while)..." -ForegroundColor Yellow
                docker-compose build
            }
            
            # Clean up dangling images after build to save disk space
            Write-Host "🧹 Cleaning up old Docker images..." -ForegroundColor Yellow
            docker image prune -f 2>$null
            
            docker-compose up -d
        }
    }
    
    Write-Host "⏳ Waiting for model to initialize (this may take 30-60 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    $MaxAttempts = 12
    $Attempt = 0
    while ($Attempt -lt $MaxAttempts) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Host "✅ AI Model is running on http://localhost:8000" -ForegroundColor Green
                break
            }
        } catch {}
        
        $Attempt++
        if ($Attempt -lt $MaxAttempts) {
            Write-Host "   Still loading... ($Attempt/$MaxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
    
    if ($Attempt -eq $MaxAttempts) {
        Write-Host "⚠️  AI Model may still be loading. Check: docker logs $ModelContainerName" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Pop-Location

# ===================================================================
# 4. START BACKEND
# ===================================================================
$BackendPort = if ($env:PORT) { $env:PORT } else { "3001" }
Write-Host "🖥️  Starting Backend API (port $BackendPort)..." -ForegroundColor Green
Push-Location $BackendDir

# Generate routes first
npx tsoa spec-and-routes

# Start backend in background
$script:BackendProcess = Start-Process -FilePath "npx" -ArgumentList "ts-node", "src/server.ts" -PassThru -NoNewWindow

Write-Host ""
Write-Host "================================" -ForegroundColor Blue
Write-Host "🎉 All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "   PostgreSQL:   localhost:$DbPort" -ForegroundColor Blue
Write-Host "   Backend API:  http://localhost:$BackendPort" -ForegroundColor Blue
Write-Host "   Swagger Docs: http://localhost:$BackendPort/docs" -ForegroundColor Blue
Write-Host "   AI Model:     http://localhost:8000" -ForegroundColor Blue
Write-Host "   Model Docs:   http://localhost:8000/docs" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Blue

Pop-Location

# Wait for backend process
try {
    $script:BackendProcess.WaitForExit()
} finally {
    Cleanup
}
