# LingoLab - IELTS Practice Platform

Nền tảng luyện thi IELTS với AI Scoring cho kỹ năng Speaking và Writing.

## 📁 Cấu trúc dự án

```
kcpm/
├── lingolab-backend/    # Backend API (Node.js + Express + TypeORM)
├── LingoLab-FE/         # Frontend (React + Vite + TailwindCSS)
└── modelIELTS/          # AI Scoring Model (Python + FastAPI)
```

## 🚀 Hướng dẫn chạy

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **Docker** (cho PostgreSQL và AI Model)
- **Python** >= 3.10 (nếu chạy AI Model không dùng Docker)

---

### Cách 1: Chạy nhanh (Khuyến nghị) ⚡

Chạy **tất cả services** bằng 1 lệnh duy nhất:

```bash
cd lingolab-backend
npm install
npm run dev:full
```

Lệnh này sẽ tự động:
1. ✅ Khởi động PostgreSQL (Docker)
2. ✅ Chạy database migrations
3. ✅ Seed dữ liệu mẫu (nếu database trống)
4. ✅ Khởi động AI Model (Docker)
5. ✅ Khởi động Backend API

Sau đó mở terminal khác để chạy Frontend:

```bash
cd LingoLab-FE
npm install
npm run dev
```

---

### Cách 2: Chạy từng service riêng

#### 1. PostgreSQL Database

```bash
docker run -d \
  --name lingolab_postgres_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lingolab_db \
  -p 54321:5432 \
  postgres:15-alpine
```

#### 2. Backend API

```bash
cd lingolab-backend
npm install
cp .env.example .env          # Tạo file .env
npm run migration:run         # Chạy migrations
npm run seed                  # Seed dữ liệu mẫu
npm run dev                   # Khởi động server
```

#### 3. AI Scoring Model

```bash
cd modelIELTS
docker-compose up -d --build
```

#### 4. Frontend

```bash
cd LingoLab-FE
npm install
npm run dev
```

---

## 🌐 Truy cập

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3001/api |
| **API Docs (Swagger)** | http://localhost:3001/docs |
| **AI Model API** | http://localhost:8000 |
| **AI Model Docs** | http://localhost:8000/docs |

---

## 👤 Tài khoản demo

Tất cả tài khoản đều có mật khẩu: **`Password123!`**

| Role | Email |
|------|-------|
| Admin | admin@lingolab.com |
| Teacher | teacher.john@lingolab.com |
| Teacher | teacher1@lingolab.com |
| Learner | learner.alice@example.com |
| Learner | student1@lingolab.com |

---

## 📝 Scripts hữu ích

### Backend (`lingolab-backend/`)

```bash
npm run dev           # Chạy development server
npm run dev:full      # Chạy full stack (DB + AI + Backend)
npm run build         # Build production
npm run seed          # Seed database
npm run migration:run # Chạy migrations
npm run swagger       # Generate Swagger docs
```

### Frontend (`LingoLab-FE/`)

```bash
npm run dev           # Chạy development server
npm run build         # Build production
npm run preview       # Preview production build
```

### AI Model (`modelIELTS/`)

```bash
docker-compose up -d          # Khởi động với Docker
docker-compose down           # Dừng container
docker-compose logs -f        # Xem logs
```

---

## 🛑 Dừng tất cả services

```bash
# Dừng Docker containers
docker stop lingolab_postgres_dev ielts-scoring-api

# Hoặc Ctrl+C để dừng Backend/Frontend
```

---

## 📚 Tài liệu thêm

- [Backend API Reference](lingolab-backend/ENDPOINT_REFERENCE.md)
- [Quick Start Guide](lingolab-backend/QUICK_START.md)
- [Environment Variables](lingolab-backend/docs/ENV_VARIABLES.md)
- [AI Model README](modelIELTS/README.md)

---

## 👥 Team

LingoLab Team - IELTS Practice Platform with AI Scoring
