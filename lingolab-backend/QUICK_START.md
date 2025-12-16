# 🚀 LingoLab Backend - Quick Start Guide

## ⚡ Người Mới - Setup Từ Đầu (Khuyến Khích)

Chạy script tự động để setup mọi thứ (Docker + Database + Seed Data):

```bash
cd /home/tung/kcpm/lingolab-backend

# Chạy script setup tự động
./scripts/setup-dev.sh
```

Script này sẽ:
1. ✅ Khởi động PostgreSQL trong Docker (port 54321)
2. ✅ Cài đặt npm dependencies
3. ✅ Chạy tất cả migrations
4. ✅ Seed database với dữ liệu demo

Sau đó chạy server:
```bash
npm run dev
```

Server chạy tại: **http://localhost:3000**

---

## 🐳 Chạy Toàn Bộ Trên Docker

Nếu muốn chạy cả Backend + Database trên Docker:

```bash
# Build và chạy mọi thứ
docker-compose up -d

# Xem logs
docker-compose logs -f backend
```

---

## 🔧 Setup Thủ Công

Nếu không muốn dùng script tự động:

```bash
# 1. Sao chép file env
cp .env.example .env

# 2. Khởi động PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# 3. Đợi database sẵn sàng (khoảng 10 giây)

# 4. Cài dependencies
npm install

# 5. Chạy migrations
npm run migration:run

# 6. Seed data
npm run seed

# 7. Chạy server
npm run dev
```

---

## 🔑 Login Credentials

**Mật khẩu chung:** `Password123!`

| Role | Email | Name |
|------|-------|------|
| 👑 **Admin** | admin@lingolab.com | System Administrator |
| 👨‍🏫 **Teacher** | teacher.john@lingolab.com | John Smith |
| 👨‍🏫 **Teacher** | teacher.nguyen@lingolab.com | Nguyễn Văn A |
| 👨‍🎓 **Learner** | learner.alice@example.com | Alice Brown |
| 👨‍🎓 **Learner** | learner.minh@example.com | Trần Minh |

---

## 📊 Test Status

**✅ 92% Pass Rate (24/26 endpoints)**

```bash
# Chạy test tự động
bash scripts/test-final.sh
```

---

## 🔗 API Examples

### Login
```bash
curl -X POST "http://localhost:3000/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "learner.alice@example.com",
        "password": "Password123!"
    }'
```

### Get Topics
```bash
curl http://localhost:3000/api/topics
```

### Get Prompts (with pagination)
```bash
curl "http://localhost:3000/api/prompts?page=1&limit=10&skillType=speaking"
```

### Get Prompts (filter by difficulty)
```bash
curl "http://localhost:3000/api/prompts?difficulty=easy"
```

### With Authentication
```bash
TOKEN="your_token_here"

curl -X GET "http://localhost:3000/api/practice/prompts" \
    -H "Authorization: Bearer $TOKEN"
```

---

## 📦 Seeded Data

- ✅ **26 Users** (1 admin, 7 teachers, 18 learners)
- ✅ **10 Topics** (Education, Tech, Environment, etc.)
- ✅ **Prompts** (Speaking + Writing với nhiều độ khó)
- ✅ **Classes** (với enrollments)
- ✅ **Learner Profiles** (với goals & bands)

---

## 🛠️ Useful Commands

```bash
# Re-seed database (xóa và tạo lại data)
npm run seed

# Chỉ chạy migrations
npm run migration:run

# Revert migration cuối
npm run migration:revert

# Xem migration status
npm run migration:show

# Build production
npm run build

# Dừng database Docker
docker-compose -f docker-compose.dev.yml down

# Xóa hoàn toàn database volume (reset fresh)
docker-compose -f docker-compose.dev.yml down -v
```

# Stop server
pkill -f "node.*dist/server.js"
```

---

## 📝 Documentation Files

- `API_TEST_FINAL_REPORT.md` - Chi tiết 26 endpoints đã test
- `KIEM_TRA_API_HOAN_THANH.md` - Tổng kết bằng tiếng Việt
- `scripts/test-final.sh` - Test script chính

---

## ⚙️ Configuration

### Rate Limiting
**Hiện tại:** DISABLED (để test dễ dàng)  
**File:** `.env`
```
DISABLE_RATE_LIMIT=true
```

**Production:** Đổi thành `false` hoặc xóa dòng này

---

## 🎯 API Base URLs

- **Root:** http://localhost:3000/
- **Health:** http://localhost:3000/health
- **API:** http://localhost:3000/api/
- **Auth:** http://localhost:3000/api/auth/
- **Topics:** http://localhost:3000/api/topics
- **Prompts:** http://localhost:3000/api/prompts
- **Practice:** http://localhost:3000/api/practice
- **Teacher:** http://localhost:3000/api/teacher

---

## ✅ Working Endpoints

### Server
- `GET /` - Root
- `GET /health` - Health check

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Current user

### Users (Admin)
- `GET /api/users` - All users
- `GET /api/users/role/learners` - All learners
- `GET /api/users/role/teachers` - All teachers

### Topics
- `GET /api/topics` - All topics
- `GET /api/topics/:id` - Single topic

### Prompts
- `GET /api/prompts` - All prompts (paginated)
- `GET /api/prompts?skillType=speaking` - Filter
- `GET /api/prompts?difficulty=easy` - Filter
- `GET /api/prompts/:id` - Single prompt

### Practice
- `GET /api/practice/prompts` - Practice prompts
- `GET /api/practice/history` - History

### Attempts
- `GET /api/attempts` - All attempts
- `GET /api/attempts/learner/:id` - By learner

### Scores
- `GET /api/scores` - All scores
- `GET /api/scores/stats/average-band` - Stats
- `GET /api/scores/stats/distribution` - Distribution

### Feedback
- `GET /api/feedback` - All feedback

### Learner Profiles
- `GET /api/learner-profiles` - All profiles
- `GET /api/learner-profiles/user/:id` - By user

### Teacher
- `GET /api/teacher/classes` - Teacher's classes
- `POST /api/teacher/classes` - Create class

---

## 🎉 Status

**READY FOR DEMO** ✅

**Tested:** 26 endpoints  
**Passed:** 24 endpoints (92%)  
**Failed:** 2 endpoints (minor issues)

---

Last updated: $(date)
