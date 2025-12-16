# 🎓 LingoLab Backend API

Production-ready IELTS Learning Platform backend with TypeScript, PostgreSQL, AI-powered scoring, and comprehensive API documentation.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication with role-based access (Admin, Teacher, Learner)
- 📚 **Topic & Prompt Management** - 10 topics, 17+ IELTS prompts (Speaking & Writing)
- 🎯 **Practice System** - Complete attempt tracking and submission workflow
- 🤖 **AI Scoring** - Integration with AI model for automated IELTS scoring
- 👨‍🏫 **Class Management** - Teacher can create classes and manage learners
- 📊 **Analytics** - Score statistics, progress tracking, learner profiles
- 💬 **Feedback System** - Teacher feedback on learner attempts
- 📄 **Auto-generated API Docs** - Swagger/OpenAPI documentation

## 🚀 Tech Stack

- **Framework**: Express.js 4.x + TypeScript 5.x
- **Database**: PostgreSQL 15 (Docker)
- **ORM**: TypeORM 0.3.x with migrations
- **API Documentation**: Swagger via TSOA
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer for audio/media files
- **AI Integration**: REST API to Python AI model

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## ⚡ Quick Start - NGƯỜI MỚI CHỈ CẦN 1 LỆNH

```bash
# 1. Clone repository
git clone <your-repo-url>
cd lingolab-backend

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. CHẠY 1 LỆNH - TỰ ĐỘNG MỌI THỨ!
npm run dev:full
```

**Xong!** 🎉 Script tự động:
1. ✅ Tạo PostgreSQL database trong Docker
2. ✅ Chạy migrations
3. ✅ Seed dữ liệu demo (26 users, 10 topics, 17 prompts, 8 classes, ~100 attempts)
4. ✅ Khởi động AI Model (nếu có)
5. ✅ Khởi động Backend API

### 🔑 Login Credentials (Password: `Password123!`)

| Role | Email |
|------|-------|
| 👑 Admin | admin@lingolab.com |
| 👨‍🏫 Teacher | teacher.john@lingolab.com |
| 👨‍🎓 Learner | learner.alice@example.com |

### 🌐 URLs

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:3000 |
| **API Docs (Swagger)** | http://localhost:3000/docs |
| **PostgreSQL** | localhost:54321 |
| **AI Model** | http://localhost:8000 |

---

## 🐳 Chạy Toàn Bộ Trên Docker (Production-like)

```bash
docker-compose up --build
```

Backend sẽ chạy trên **http://localhost:3001**

## 🔐 Demo Credentials

All demo users have password: **`Password123!`**

### Admin
- Email: `admin@lingolab.com`
- Full system access

### Teachers (3)
- `teacher.john@lingolab.com` - John Smith
- `teacher.nguyen@lingolab.com` - Nguyễn Văn A  
- `teacher.sarah@lingolab.com` - Sarah Johnson

### Learners (8)
- `learner.alice@example.com` - Alice Brown
- `learner.minh@example.com` - Trần Minh
- `learner.bob@example.com` - Bob Wilson
- `learner.lan@example.com` - Nguyễn Thị Lan
- *(+4 more learners)*

## 📚 Seeded Demo Data

The database comes pre-populated with:

### 📖 Topics (10)
Education 🎓, Technology 💻, Environment 🌍, Health 🏥, Work 💼, Culture 🎭, Travel ✈️, Family 👨‍👩‍👧‍👦, Media 📺, Society 🏙️

### 💬 Prompts (17)
- **10 Speaking prompts** - IELTS Parts 1, 2, 3 (Easy/Medium/Hard)
- **7 Writing prompts** - Task 1 & Task 2 (150-350 words)

### 🏫 Classes (4)
- IELTS Speaking Band 7+ (Code: `SPEAK7PLUS`)
- IELTS Writing Fundamentals (Code: `WRITE101`)
- Luyện thi IELTS Toàn diện (Code: `IELTS4SKILL`)
- IELTS Express - 8 Week Program (Code: `EXPRESS8W`)

### 👥 Users & Profiles
- 1 Admin, 3 Teachers, 8 Learners
- 8 Learner profiles with target bands, goals, and preferences

## 🧪 Testing the API

### Quick Health Check

```bash
curl http://localhost:3001/health
```

### Login Example

```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner.alice@example.com",
    "password": "Password123!"
  }'
```

### Get Topics

```bash
curl http://localhost:3001/api/topics
```

### Get Prompts (with auth)

```bash
TOKEN="your_jwt_token_here"
curl http://localhost:3001/api/prompts \
  -H "Authorization: Bearer $TOKEN"
```

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI Spec**: http://localhost:3001/swagger.json

## 🛠️ Local Development

### Install Dependencies

```bash
npm install
```

### Start PostgreSQL Only

```bash
docker-compose up postgres -d
```

### Run Migrations

```bash
npm run migration:run
```

### Seed Database

```bash
npm run seed
```

### Start Development Server

```bash
npm run dev
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run swagger` | Generate Swagger docs and routes |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:generate` | Generate new migration |
| `npm run seed` | Seed database with demo data |

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # TypeORM configuration
│   ├── controllers/
│   │   └── UserController.ts    # API controllers with tsoa decorators
│   ├── entities/
│   │   └── User.ts              # TypeORM entities
│   ├── services/
│   │   └── UserService.ts       # Business logic layer
```
lingolab-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # TypeORM DataSource configuration
│   │   ├── ai-scoring.config.ts # AI model integration config
│   │   ├── email.config.ts      # Email service configuration
│   │   └── multer.config.ts     # File upload configuration
│   ├── controllers/              # API endpoints with TSOA decorators
│   │   ├── auth.controller.ts   # Authentication (signup, signin)
│   │   ├── user.controller.ts   # User management
│   │   ├── topic.controller.ts  # Topics CRUD
│   │   ├── prompt.controller.ts # Prompts management
│   │   ├── class.controller.ts  # Class management
│   │   ├── attempt.controller.ts# Practice attempts
│   │   ├── score.controller.ts  # Scoring & statistics
│   │   └── ...
│   ├── entities/                 # TypeORM entities (database models)
│   │   ├── User.ts              # User entity with roles
│   │   ├── Topic.ts             # IELTS topics
│   │   ├── Prompt.ts            # Practice prompts
│   │   ├── Class.ts             # Teacher classes
│   │   ├── Attempt.ts           # Practice attempts
│   │   └── ...
│   ├── services/                 # Business logic layer
│   │   ├── auth.service.ts      # Auth logic
│   │   ├── user.service.ts      # User operations
│   │   ├── topic.service.ts     # Topic logic
│   │   ├── scoring.service.ts   # AI scoring integration
│   │   └── ...
│   ├── dtos/                     # Data Transfer Objects
│   │   ├── auth.dto.ts          # Auth request/response types
│   │   ├── user.dto.ts          # User DTOs
│   │   ├── pagination.dto.ts    # Pagination responses
│   │   └── ...
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── migrations/               # TypeORM migrations
│   ├── utils/                    # Utility functions
│   ├── constants/
│   │   └── messages.ts          # Response messages
│   ├── routes.ts                # Auto-generated by TSOA
│   ├── swagger.json             # Auto-generated OpenAPI spec
│   ├── data-source.ts           # TypeORM DataSource export
│   └── server.ts                # Express server entry point
├── scripts/
│   └── seed-database.ts         # Database seeding script
├── docs/                         # Additional documentation
│   ├── ENDPOINT_REFERENCE.md    # Complete API reference
│   ├── QUICK_START.md           # Quick start guide
│   └── ...
├── uploads/                      # User uploaded files (audio, etc)
├── exports/                      # Generated export files
├── docker-compose.yml           # Docker services definition
├── Dockerfile                   # Backend container image
├── tsconfig.json                # TypeScript configuration
├── tsoa.json                    # TSOA configuration
├── package.json
├── .env.example                 # Environment variables template
└── README.md
```

## 🔐 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lingolab_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Model
AI_MODEL_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-key-here

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
DISABLE_RATE_LIMIT=false
```

## 🗃️ Database Schema

### Main Entities

- **User** - System users (admin, teacher, learner)
- **Topic** - IELTS topics (Education, Technology, etc.)
- **Prompt** - Practice prompts (speaking/writing)
- **Class** - Teacher-created classes
- **Attempt** - Practice attempt records
- **Score** - AI-generated scores
- **Feedback** - Teacher feedback
- **LearnerProfile** - Learner settings and goals

### Relationships

```
User (1) ──── (N) Attempt
User (N) ──── (N) Class (learner enrollments)
User (1) ──── (N) Class (teacher ownership)
Topic (1) ──── (N) Prompt
Prompt (1) ──── (N) Attempt
Attempt (1) ──── (N) Score
Attempt (1) ──── (N) Feedback
User (1) ──── (1) LearnerProfile
```

## 🔧 Database Management

### Reset Database

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build
```

### Access PostgreSQL

```bash
# Connect to database
docker exec -it lingolab_postgres psql -U postgres -d lingolab_db

# List tables
\dt

# Query users
SELECT id, email, role FROM users;

# Exit
\q
```

### Run Migrations Manually

```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## 🤝 Integration with AI Model

Backend integrates with the Python AI scoring model (modelIELTS):

```typescript
// AI Model API calls
POST http://localhost:8000/score-speaking  # Score speaking attempts
POST http://localhost:8000/score-writing   # Score writing attempts
```

Configure AI model URL in `.env`:
```env
AI_MODEL_URL=http://localhost:8000
```

## 📖 Additional Documentation

- **[ENDPOINT_REFERENCE.md](docs/ENDPOINT_REFERENCE.md)** - Complete API endpoint list
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide
- **[API_TEST_FINAL_REPORT.md](API_TEST_FINAL_REPORT.md)** - Testing results
- **[MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)** - Database migration guide

## 🐛 Troubleshooting

### Port Conflict

If port 3001 is already in use:
```bash
# Find process using port
lsof -i :3001

# Change port in docker-compose.yml and .env
PORT=3002
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs lingolab_postgres

# Restart database
docker-compose restart postgres
```

### Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

## 📝 Development Tips

### Hot Reload

The dev server uses `ts-node-dev` for automatic restart on file changes:
```bash
npm run dev
```

### Generate Swagger Docs

After modifying controllers:
```bash
npm run swagger
```

### View Generated Routes

```bash
cat src/routes.ts
```

## 🚀 Deployment

### Docker Production

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Manual Deployment

```bash
# Build
npm run build

# Set production env
export NODE_ENV=production

# Run migrations
npm run migration:run

# Start server
npm start
```

## 📄 License

MIT

## 👥 Contributors

LingoLab Team

---

**Happy Coding!** 🎉

### VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/node_modules/.bin/ts-node",
      "args": ["src/server.ts"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📚 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [tsoa Documentation](https://tsoa-community.github.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RESTful API Design Best Practices](https://restfulapi.net/)

## 🚀 Next Steps

1. **Authentication**: Add JWT-based authentication
2. **Validation**: Add input validation with decorators
3. **Testing**: Set up Jest for unit and integration tests
4. **Logging**: Implement structured logging
5. **Caching**: Add Redis for performance optimization
6. **Migrations**: Set up TypeORM migrations for schema management
7. **Deployment**: Containerize and deploy to production

## 🤝 Contributing

When adding new features:

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make changes following the architecture pattern
3. Test locally: `npm run dev`
4. Build successfully: `npm run build`
5. Commit with clear messages: `git commit -m "feat: add new feature"`
6. Push and create a pull request

## 📝 License

ISC

## 👥 Author

LingoLab Team

---

**Need help?** Check the [Swagger documentation](http://localhost:3000/docs) for detailed API information.
