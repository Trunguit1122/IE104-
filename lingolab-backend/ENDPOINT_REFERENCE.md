# 📚 LingoLab Backend - Complete Endpoint Reference

## 🎯 Base URL
`http://localhost:3000`

---

## ✅ Tested & Working Endpoints (24)

### 🏥 Server Health

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| GET | `/` | No | ✅ 200 | Root endpoint |
| GET | `/health` | No | ✅ 200 | Health check |

---

### 🔐 Authentication

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| POST | `/api/auth/signup` | No | ✅ 201 | Register new user |
| POST | `/api/auth/signin` | No | ✅ 200 | Login (returns JWT) |
| GET | `/api/auth/me` | Yes | ✅ 200 | Get current user |
| POST | `/api/auth/logout` | Yes | 🔶 Not tested | Logout user |
| POST | `/api/auth/refresh` | Yes | 🔶 Not tested | Refresh token |
| POST | `/api/auth/forgot-password` | No | 🔶 Not tested | Request password reset |
| POST | `/api/auth/reset-password` | No | 🔶 Not tested | Reset password |
| PUT | `/api/auth/change-password` | Yes | 🔶 Not tested | Change password |
| POST | `/api/auth/verify-email` | No | 🔶 Not tested | Verify email |

**Request Body (signup):**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "displayName": "John Doe",
  "role": "learner"
}
```

**Request Body (signin):**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (signin):**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "learner",
    "uiLanguage": "en"
  }
}
```

---

### 👥 User Management (Admin)

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/users` | Yes | Admin | ✅ 200 | Get all users |
| GET | `/api/users/:id` | Yes | Admin | ✅ 200 | Get user by ID |
| GET | `/api/users/role/learners` | Yes | Admin | ✅ 200 | Get all learners |
| GET | `/api/users/role/teachers` | Yes | Admin | ✅ 200 | Get all teachers |
| GET | `/api/users/by-email/:email` | Yes | Admin | 🔶 Not tested | Get user by email |
| PUT | `/api/users/:id` | Yes | Admin | 🔶 Not tested | Update user |
| DELETE | `/api/users/:id` | Yes | Admin | 🔶 Not tested | Delete user |
| PUT | `/api/users/:id/lock` | Yes | Admin | 🔶 Not tested | Lock user account |
| PUT | `/api/users/:id/unlock` | Yes | Admin | 🔶 Not tested | Unlock user account |

---

### 📚 Topics

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/topics` | No | - | ✅ 200 | Get all topics (10 topics) |
| GET | `/api/topics/:id` | No | - | ✅ 200 | Get topic by ID |
| POST | `/api/topics` | Yes | Teacher/Admin | ❌ 401 | Create topic |
| PUT | `/api/topics/:id` | Yes | Teacher/Admin | 🔶 Not tested | Update topic |
| DELETE | `/api/topics/:id` | Yes | Admin | 🔶 Not tested | Delete topic |

**Response (GET topics):**
```json
[
  {
    "id": "uuid",
    "name": "Education",
    "description": "Topics related to learning...",
    "icon": "🎓",
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 💬 Prompts

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/prompts` | No | - | ✅ 200 | Get prompts (paginated) |
| GET | `/api/prompts?page=1&limit=10` | No | - | ✅ 200 | Pagination |
| GET | `/api/prompts?skillType=speaking` | No | - | ✅ 200 | Filter by skill |
| GET | `/api/prompts?difficulty=easy` | No | - | ✅ 200 | Filter by difficulty |
| GET | `/api/prompts/:id` | No | - | ✅ 200 | Get prompt by ID |
| POST | `/api/prompts` | Yes | Teacher/Admin | 🔶 Not tested | Create prompt |
| PUT | `/api/prompts/:id` | Yes | Teacher/Admin | 🔶 Not tested | Update prompt |
| DELETE | `/api/prompts/:id` | Yes | Admin | 🔶 Not tested | Delete prompt |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `skillType` - Filter: `speaking` or `writing`
- `difficulty` - Filter: `easy`, `medium`, or `hard`
- `topicId` - Filter by topic UUID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Describe your favorite...",
      "skillType": "speaking",
      "difficulty": "easy",
      "topic": {
        "id": "uuid",
        "name": "Education"
      },
      "preparationTime": 60,
      "responseTime": 120
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 17,
    "pages": 2,
    "currentPage": 1,
    "hasMore": true
  }
}
```

---

### 🎯 Practice

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/practice/prompts` | Yes | Learner | ✅ 200 | Get practice prompts |
| GET | `/api/practice/history` | Yes | Learner | ✅ 200 | Get practice history |
| POST | `/api/practice/speaking/start` | Yes | Learner | �� Not tested | Start speaking practice |
| POST | `/api/practice/writing/start` | Yes | Learner | 🔶 Not tested | Start writing practice |
| GET | `/api/practice/writing/active` | Yes | Learner | 🔶 Not tested | Get active writing session |
| PUT | `/api/practice/writing/:attemptId/content` | Yes | Learner | 🔶 Not tested | Update writing content |
| POST | `/api/practice/speaking/submit` | Yes | Learner | 🔶 Not tested | Submit speaking attempt |
| POST | `/api/practice/writing/submit` | Yes | Learner | 🔶 Not tested | Submit writing attempt |
| DELETE | `/api/practice/session/:attemptId` | Yes | Learner | 🔶 Not tested | Delete practice session |
| POST | `/api/practice/compare` | Yes | Learner | 🔶 Not tested | Compare attempts |
| POST | `/api/practice/retake` | Yes | Learner | 🔶 Not tested | Retake prompt |

---

### 📝 Attempts

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/attempts` | Yes | Any | ✅ 200 | Get all attempts |
| GET | `/api/attempts/:id` | Yes | Any | 🔶 Not tested | Get attempt by ID |
| GET | `/api/attempts/learner/:learnerId` | Yes | Any | ✅ 200 | Get learner's attempts |
| GET | `/api/attempts/learner/:learnerId/count` | Yes | Any | 🔶 Not tested | Count learner attempts |
| POST | `/api/attempts` | Yes | Learner | 🔶 Not tested | Create attempt |
| PUT | `/api/attempts/:id` | Yes | Learner | 🔶 Not tested | Update attempt |
| PUT | `/api/attempts/:id/submit` | Yes | Learner | 🔶 Not tested | Submit attempt |
| DELETE | `/api/attempts/:id` | Yes | Learner | 🔶 Not tested | Delete attempt |

---

### 📊 Scores

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/scores` | Yes | Any | ✅ 200 | Get all scores |
| GET | `/api/scores/:id` | Yes | Any | 🔶 Not tested | Get score by ID |
| GET | `/api/scores/attempt/:attemptId` | Yes | Any | 🔶 Not tested | Get attempt scores |
| GET | `/api/scores/stats/average-band` | Yes | Any | ✅ 200 | Get average band |
| GET | `/api/scores/stats/distribution` | Yes | Any | ✅ 200 | Get score distribution |
| POST | `/api/scores` | Yes | Teacher/System | 🔶 Not tested | Create score |
| PUT | `/api/scores/:id` | Yes | Teacher/Admin | 🔶 Not tested | Update score |
| DELETE | `/api/scores/:id` | Yes | Admin | 🔶 Not tested | Delete score |

**Response (stats/average-band):**
```json
{
  "averageBand": 6.5,
  "totalScores": 42,
  "bySkillType": {
    "speaking": 6.3,
    "writing": 6.7
  }
}
```

---

### 💬 Feedback

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/feedback` | Yes | Any | ✅ 200 | Get all feedback |
| GET | `/api/feedback/:id` | Yes | Any | 🔶 Not tested | Get feedback by ID |
| GET | `/api/feedback/attempt/:attemptId` | Yes | Any | 🔶 Not tested | Get attempt feedback |
| POST | `/api/feedback` | Yes | Teacher | 🔶 Not tested | Create feedback |
| PUT | `/api/feedback/:id` | Yes | Teacher | 🔶 Not tested | Update feedback |
| DELETE | `/api/feedback/:id` | Yes | Teacher/Admin | �� Not tested | Delete feedback |

---

### 🏫 Classes

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/classes` | Yes | Admin | 🔶 Not tested | Get all classes |
| GET | `/api/classes/:id` | Yes | Any | 🔶 Not tested | Get class by ID |
| POST | `/api/classes` | Yes | Teacher | 🔶 Not tested | Create class (use teacher endpoint) |
| PUT | `/api/classes/:id` | Yes | Teacher | 🔶 Not tested | Update class |
| DELETE | `/api/classes/:id` | Yes | Teacher/Admin | 🔶 Not tested | Delete class |
| POST | `/api/classes/:id/enroll` | Yes | Learner | 🔶 Not tested | Enroll in class |
| POST | `/api/classes/enroll-by-code/:learnerId` | Yes | Learner | 🔶 Not tested | Enroll by code |
| POST | `/api/classes/:id/remove-learner` | Yes | Teacher | 🔶 Not tested | Remove learner |

---

### 📋 Learner Profiles

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/learner-profiles` | Yes | Any | ✅ 200 | Get all profiles |
| GET | `/api/learner-profiles/:id` | Yes | Any | 🔶 Not tested | Get profile by ID |
| GET | `/api/learner-profiles/user/:userId` | Yes | Any | ✅ 200 | Get user's profile |
| POST | `/api/learner-profiles` | Yes | Learner | 🔶 Not tested | Create profile |
| PUT | `/api/learner-profiles/:id` | Yes | Learner | 🔶 Not tested | Update profile |
| DELETE | `/api/learner-profiles/:id` | Yes | Admin | 🔶 Not tested | Delete profile |

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "targetBand": 7.0,
    "currentBand": 5.5,
    "nativeLanguage": "Vietnamese",
    "learningGoals": "Achieve IELTS 7.0...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 👨‍🏫 Teacher Endpoints

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/teacher/classes` | Yes | Teacher | ✅ 200 | Get teacher's classes |
| POST | `/api/teacher/classes` | Yes | Teacher | ✅ 201 | Create new class |
| GET | `/api/teacher/learners` | Yes | Teacher | ❌ 500 | Get all learners |
| GET | `/api/teacher/learners/:learnerId` | Yes | Teacher | 🔶 Not tested | Get learner details |
| GET | `/api/teacher/learners/:learnerId/history` | Yes | Teacher | 🔶 Not tested | Get learner history |
| GET | `/api/teacher/learners/:learnerId/progress` | Yes | Teacher | 🔶 Not tested | Get learner progress |
| GET | `/api/teacher/attempts/:attemptId` | Yes | Teacher | 🔶 Not tested | Get attempt details |
| POST | `/api/teacher/attempts/:attemptId/evaluate` | Yes | Teacher | 🔶 Not tested | Evaluate attempt |
| POST | `/api/teacher/learners/:learnerId/export` | Yes | Teacher | 🔶 Not tested | Export learner report |

**Request Body (create class):**
```json
{
  "name": "IELTS Intensive Preparation",
  "teacherId": "teacher-uuid",
  "description": "3-month intensive course",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

---

### 🤖 AI Scoring

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| POST | `/api/scoring/request` | Yes | System | 🔶 Not tested | Request AI scoring |
| GET | `/api/scoring/status/:attemptId` | Yes | Any | 🔶 Not tested | Get scoring status |
| POST | `/api/scoring/manual` | Yes | Teacher | 🔶 Not tested | Manual scoring |

---

### 📈 Scoring Jobs

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| GET | `/api/scoring-jobs` | Yes | Admin | 🔶 Not tested | Get all jobs |
| GET | `/api/scoring-jobs/:id` | Yes | Admin | 🔶 Not tested | Get job by ID |
| GET | `/api/scoring-jobs/attempt/:attemptId` | Yes | Any | 🔶 Not tested | Get attempt job |
| POST | `/api/scoring-jobs` | Yes | System | �� Not tested | Create job |
| PUT | `/api/scoring-jobs/:id/status/:status` | Yes | System | 🔶 Not tested | Update job status |
| PATCH | `/api/scoring-jobs/:id/retry` | Yes | Admin | 🔶 Not tested | Retry failed job |
| DELETE | `/api/scoring-jobs/:id` | Yes | Admin | 🔶 Not tested | Delete job |

---

### 📁 Attempt Media (Uploads)

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| POST | `/api/attempt-media` | Yes | Learner | 🔶 Not tested | Upload media |
| GET | `/api/attempt-media/:id` | Yes | Any | 🔶 Not tested | Get media by ID |
| GET | `/api/attempt-media/attempt/:attemptId` | Yes | Any | 🔶 Not tested | Get attempt media |
| DELETE | `/api/attempt-media/:id` | Yes | Learner/Admin | 🔶 Not tested | Delete media |

---

### 📤 Upload

| Method | Endpoint | Auth | Role | Status | Description |
|--------|----------|------|------|--------|-------------|
| POST | `/api/upload/avatar` | Yes | Any | 🔶 Not tested | Upload avatar |
| POST | `/api/upload/audio` | Yes | Learner | 🔶 Not tested | Upload audio |
| POST | `/api/upload/video` | Yes | Learner | 🔶 Not tested | Upload video |
| POST | `/api/upload/document` | Yes | Any | 🔶 Not tested | Upload document |
| POST | `/api/upload/recording/:attemptId` | Yes | Learner | 🔶 Not tested | Upload recording |

---

## 📊 Summary

| Status | Count | Description |
|--------|-------|-------------|
| ✅ | 24 | Tested & Working |
| ❌ | 2 | Tested & Failed |
| �� | ~70 | Not Tested Yet |
| **Total** | **~96** | **Total Endpoints** |

---

## 🔑 Authentication

All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Common Response Formats

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "status": 400,
  "code": "ERROR_CODE"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation Failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "details": {
    "field": {
      "message": "Field is required"
    }
  }
}
```

---

Last updated: $(date)
