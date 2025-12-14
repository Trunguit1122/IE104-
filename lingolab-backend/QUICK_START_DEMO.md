# 🚀 Quick Start Guide - LingoLab Backend with Full Demo Data

This guide will help you start the LingoLab backend with a fully seeded database ready for demo and testing.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL client (optional, for database inspection)

## 🎯 One-Command Demo Setup

### Option 1: Docker Compose (Recommended for Demo)

```bash
# Start everything with auto-seeded database
docker-compose up --build
```

This will:
1. ✅ Start PostgreSQL database
2. ✅ Build and start the backend server
3. ✅ Run all database migrations
4. ✅ Seed the database with demo data
5. ✅ Start the API server on port 3000

**Access Points:**
- API Server: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- Database: localhost:54321 (postgres/postgres)

### Option 2: Local Development

```bash
# Install dependencies
cd lingolab-backend
npm install

# Start PostgreSQL (using Docker)
docker-compose up postgres -d

# Wait for database to be ready
sleep 5

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start server in development mode
npm run dev
```

## 🔐 Demo User Credentials

All users have the password: **Password123!**

### Admin Account
- Email: `admin@lingolab.com`
- Role: Administrator
- Full system access

### Teacher Accounts
- `teacher.john@lingolab.com` - John Smith (English teacher)
- `teacher.nguyen@lingolab.com` - Nguyễn Văn A (Vietnamese teacher)
- `teacher.sarah@lingolab.com` - Sarah Johnson (English teacher)

### Learner Accounts
- `learner.alice@example.com` - Alice Brown
- `learner.minh@example.com` - Trần Minh
- `learner.bob@example.com` - Bob Wilson
- `learner.lan@example.com` - Nguyễn Thị Lan
- `learner.charlie@example.com` - Charlie Davis
- `learner.hung@example.com` - Lê Văn Hùng
- `learner.diana@example.com` - Diana Martinez
- `learner.thu@example.com` - Phạm Thu Thảo

## 📊 Demo Data Includes

### Topics (10)
- Education 🎓
- Technology 💻
- Environment 🌍
- Health 🏥
- Work 💼
- Culture 🎭
- Travel ✈️
- Family 👨‍👩‍👧‍👦
- Media 📺
- Society 🏙️

### Prompts
- **Speaking Prompts**: 10+ prompts covering IELTS Speaking Parts 1, 2, and 3
- **Writing Prompts**: 7+ prompts for both Task 1 and Task 2
- Difficulty levels: Easy, Medium, Hard

### Classes (4)
- IELTS Speaking Band 7+ (Code: SPEAK7PLUS)
- IELTS Writing Fundamentals (Code: WRITE101)
- Luyện thi IELTS Toàn diện (Code: IELTS4SKILL)
- IELTS Express - 8 Week Program (Code: EXPRESS8W)

### Learner Profiles
- Pre-configured for all learners with target bands, practice streaks, etc.

## 🧪 Testing the API

### Quick Health Check

```bash
# Check if server is running
curl http://localhost:3000/

# Health check endpoint
curl http://localhost:3000/api/health
```

### Login and Get Token

```bash
# Login as learner
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner.alice@example.com",
    "password": "Password123!"
  }'

# Save the token from response and use it in subsequent requests
TOKEN="your_token_here"

# Get user profile
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Run Complete Test Suite

```bash
# Run comprehensive API tests
cd lingolab-backend
./scripts/test-production-api.sh
```

This will test:
- ✅ Health checks
- ✅ Authentication (register, login, JWT)
- ✅ User management (CRUD, permissions)
- ✅ Topics management
- ✅ Prompts (speaking & writing)
- ✅ Classes (create, join, manage)
- ✅ Learner profiles
- ✅ Practice & attempts
- ✅ Scoring system
- ✅ Feedback system
- ✅ Export & reports

## 🔄 Reset Database

If you need to start fresh:

```bash
# Stop containers
docker-compose down

# Remove volumes (this deletes all data)
docker-compose down -v

# Start fresh
docker-compose up --build
```

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api/swagger.json

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 or 54321 is already in use:

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :54321

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Ensure database is healthy
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Seeding Fails

```bash
# Run seed manually
docker-compose exec backend npm run seed

# Or locally
npm run seed
```

### Clear Database and Re-seed

```bash
# Connect to database
docker exec -it lingolab_postgres psql -U postgres -d lingolab_db

# Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Re-run migrations and seed
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed
```

## 📱 Testing Workflows

### Workflow 1: Learner Practice Flow

1. Login as learner
2. Get practice recommendations: `GET /api/practice/recommendations`
3. Start an attempt: `POST /api/attempts` with promptId
4. Submit response: `PATCH /api/attempts/:id/submit`
5. View scores: `GET /api/scores/attempt/:attemptId`
6. View feedback: `GET /api/feedback/attempt/:attemptId`

### Workflow 2: Teacher Management Flow

1. Login as teacher
2. Create a class: `POST /api/classes`
3. View class learners: `GET /api/classes/:id`
4. Create custom prompts: `POST /api/prompts`
5. Review learner attempts: `GET /api/attempts/class/:classId`
6. Provide feedback: `POST /api/feedback`

### Workflow 3: Admin Dashboard Flow

1. Login as admin
2. View all users: `GET /api/users`
3. Manage topics: `POST /api/topics`
4. View system statistics
5. Export reports

## 🌐 Integration with AI Model

To connect with the AI scoring model (Python Flask):

```bash
# Start AI model server (from modelIELTS directory)
cd ../modelIELTS
pip install -r requirements.txt
python app.py

# The backend will connect to http://localhost:5000
```

Update `AI_MODEL_URL` in docker-compose.yml if running on different host/port.

## 📊 Database Inspection

```bash
# Connect to PostgreSQL
docker exec -it lingolab_postgres psql -U postgres -d lingolab_db

# Useful queries
\dt                          # List all tables
SELECT COUNT(*) FROM users;  # Count users
SELECT * FROM topics;        # View topics
SELECT email, role FROM users; # List all users
\q                           # Quit
```

## 🎉 Success!

You should now have a fully functional LingoLab backend with:
- ✅ 12+ users (1 admin, 3 teachers, 8+ learners)
- ✅ 10 topics
- ✅ 17+ prompts (speaking & writing)
- ✅ 4 classes with enrolled learners
- ✅ Complete learner profiles
- ✅ Ready for demo and testing!

For more details, see:
- Backend Architecture: `README.md`
- API Documentation: http://localhost:3000/api-docs
- Migration Guide: `MIGRATIONS_GUIDE.md`
