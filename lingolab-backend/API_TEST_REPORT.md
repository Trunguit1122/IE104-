# LingoLab API Test Report

**Generated:** 2025-12-12 14:44:27  
**Base URL:** http://localhost:3000

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 58 |
| ❌ Failed | 19 |
| **Total** | **77** |

---

## Health Check


### GET `/health`

**Description:** Health check endpoint  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "status": "healthy",
    "timestamp": "2025-12-12T14:44:27.810Z",
    "service": "LingoLab Backend API"
}
```

</details>

---


## Authentication APIs


### POST `/api/auth/signup`

**Description:** Register new user  
**Status:** ✅ PASS (HTTP 201)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "message": "Registration successful! Please check your email to verify your account.",
    "userId": "0bb6b823-5d21-4678-a8d6-e123628135e4"
}
```

</details>

---


### POST `/api/auth/signin`

**Description:** User login  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "message": "Login successful",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZGZhYzNkZC1kYjRlLTQ2YzEtOTcwYi03MDlhOWM5NTg4YjYiLCJlbWFpbCI6ImxlYXJuZXIuYWxpY2VAZXhhbXBsZS5jb20iLCJyb2xlIjoibGVhcm5lciIsImlhdCI6MTc2NTU1MDY2OCwiZXhwIjoxNzY1NTUxNTY4LCJqdGkiOiJhY2NhY2YxYjM5ZDZmN2EzMmZmYjFmZjZiOTQzMTM2ZiJ9.SnwktXDnk7o-yEj2_FKRB5WkMGpfJ_fITqfDbOMcGWw",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZGZhYzNkZC1kYjRlLTQ2YzEtOTcwYi03MDlhOWM5NTg4YjYiLCJlbWFpbCI6ImxlYXJuZXIuYWxpY2VAZXhhbXBsZS5jb20iLCJyb2xlIjoibGVhcm5lciIsImlhdCI6MTc2NTU1MDY2OCwiZXhwIjoxNzY2MTU1NDY4LCJqdGkiOiI5M2E0MDM3MjBhMzdlYTEwNDJmNzE1ODljNjgwYjk2NyJ9.apdev0cZOupR2YalK9WMLPvq4AuYRorBGZz84ZYGPZE",
    "expiresIn": 900,
    "user": {
        "id": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
        "email": "learner.alice@example.com",
        "displayName": "Alice Brown",
        "avatarUrl": null,
        "role": "learner",
        "uiLanguage": "en"
    }
}
```

</details>

---


### GET `/api/auth/me`

**Description:** Get current authenticated user  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
    "email": "learner.alice@example.com",
    "displayName": "Alice Brown",
    "avatarUrl": null,
    "role": "learner",
    "uiLanguage": "en"
}
```

</details>

---


### GET `/api/auth/profile`

**Description:** Get user profile  
**Status:** ❌ FAIL (HTTP 404)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Route GET /api/auth/profile not found",
    "status": 404,
    "code": "ROUTE_NOT_FOUND"
}
```

</details>

---


### POST `/api/auth/refresh-token`

**Description:** Refresh access token  
**Status:** ❌ FAIL (HTTP 401)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Your session has expired. Please sign in again."
}
```

</details>

---


### POST `/api/auth/forgot-password`

**Description:** Request password reset  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "message": "If the email exists in our system, you will receive a password reset link shortly."
}
```

</details>

---


## User APIs


### GET `/api/users?limit=5`

**Description:** Get all users (paginated)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "459c4f2a-fd8e-4ddc-b549-315e99feae0e",
            "email": "admin@lingolab.com",
            "role": "admin",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.110Z"
        },
        {
            "id": "d6777fb6-1d36-439d-b7a7-4f07cebad8af",
            "email": "teacher.nguyen@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.122Z"
        },
        {
            "id": "fef0dedd-ceaf-4869-ae42-dda67693be4a",
            "email": "teacher.sarah@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.125Z"
        },
        {
            "id": "1163c1bf-ce69-4cf3-9a26-d33befd18546",
            "email": "teacher.tran@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.128Z"
        },
        {
            "id": "1561e681-cfe1-4244-b58c-c79fb932e491",
            "email": "teacher.michael@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.130Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 32,
        "pages": 7,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/users/role/learners?limit=5`

**Description:** Get all learners  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "f18f0e4a-8cea-4b05-9ca4-e6eff10893c0",
            "email": "learner.minh@example.com",
            "role": "learner",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.140Z"
        },
        {
            "id": "451414b7-32b8-4078-bdd3-5fb02192fe64",
            "email": "learner.bob@example.com",
            "role": "learner",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.143Z"
        },
        {
            "id": "f3573a65-2bec-455f-9717-04551b63af01",
            "email": "learner.lan@example.com",
            "role": "learner",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.145Z"
        },
        {
            "id": "2f80e35d-152a-4bb0-b0da-1a97bdca7db0",
            "email": "learner.charlie@example.com",
            "role": "learner",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.148Z"
        },
        {
            "id": "4e1b68a7-2b89-497d-bfbe-bfda434bb220",
            "email": "learner.hung@example.com",
            "role": "learner",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.150Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 24,
        "pages": 5,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/users/role/teachers?limit=5`

**Description:** Get all teachers  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "d6777fb6-1d36-439d-b7a7-4f07cebad8af",
            "email": "teacher.nguyen@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.122Z"
        },
        {
            "id": "fef0dedd-ceaf-4869-ae42-dda67693be4a",
            "email": "teacher.sarah@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.125Z"
        },
        {
            "id": "1163c1bf-ce69-4cf3-9a26-d33befd18546",
            "email": "teacher.tran@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.128Z"
        },
        {
            "id": "1561e681-cfe1-4244-b58c-c79fb932e491",
            "email": "teacher.michael@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.130Z"
        },
        {
            "id": "1d6aed38-6775-4482-971b-c5c882437063",
            "email": "teacher2@lingolab.com",
            "role": "teacher",
            "status": "active",
            "createdAt": "2025-12-12T02:42:28.135Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 7,
        "pages": 2,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/users/search/alice?limit=5`

**Description:** Search users by name  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[]
```

</details>

---


### GET `/api/users/by-email/learner.alice@example.com`

**Description:** Get user by email  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
    "email": "learner.alice@example.com",
    "role": "learner",
    "status": "active",
    "uiLanguage": "en",
    "createdAt": "2025-12-12T02:42:28.138Z",
    "updatedAt": "2025-12-12T14:44:28.393Z"
}
```

</details>

---


### GET `/api/users/459c4f2a-fd8e-4ddc-b549-315e99feae0e`

**Description:** Get user by ID  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "459c4f2a-fd8e-4ddc-b549-315e99feae0e",
    "email": "admin@lingolab.com",
    "role": "admin",
    "status": "active",
    "uiLanguage": "en",
    "createdAt": "2025-12-12T02:42:28.110Z",
    "updatedAt": "2025-12-12T02:42:28.110Z"
}
```

</details>

---


## Learner Profile APIs


### GET `/api/learner-profiles?limit=5`

**Description:** Get all learner profiles  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "77e04b80-edae-4a1a-abf7-cb6df1e51c70",
            "userId": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
            "firstName": null,
            "lastName": null,
            "targetBand": 7,
            "currentBand": 5,
            "nativeLanguage": "English",
            "learningGoals": "Achieve IELTS 7.0 for university admission"
        },
        {
            "id": "cfe46a7b-7a17-42d5-9f43-fae87fca5188",
            "userId": "f18f0e4a-8cea-4b05-9ca4-e6eff10893c0",
            "firstName": null,
            "lastName": null,
            "targetBand": 7,
            "currentBand": 6,
            "nativeLanguage": "Vietnamese",
            "learningGoals": "Improve speaking fluency and confidence"
        },
        {
            "id": "81b1fe9f-08a4-45b0-80d0-f3591e2fc957",
            "userId": "451414b7-32b8-4078-bdd3-5fb02192fe64",
            "firstName": null,
            "lastName": null,
            "targetBand": 7,
            "currentBand": 6,
            "nativeLanguage": "English",
            "learningGoals": "Master academic writing for IELTS"
        },
        {
            "id": "3066b798-074b-4675-904c-28675e67d1ed",
            "userId": "f3573a65-2bec-455f-9717-04551b63af01",
            "firstName": null,
            "lastName": null,
            "targetBand": 7,
            "currentBand": 6,
            "nativeLanguage": "Vietnamese",
            "learningGoals": "Practice daily to maintain English skills"
        },
        {
            "id": "79e61ccd-ef6a-43e7-98ae-f20b3f99ffe8",
            "userId": "2f80e35d-152a-4bb0-b0da-1a97bdca7db0",
            "firstName": null,
            "lastName": null,
            "targetBand": 8,
            "currentBand": 5,
            "nativeLanguage": "English",
            "learningGoals": "Prepare for IELTS exam in 3 months"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 24,
        "pages": 5,
        "cu... (truncated)
```

</details>

---


### GET `/api/learner-profiles/search/alice?limit=5`

**Description:** Search learner profiles  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[]
```

</details>

---


### GET `/api/learner-profiles/user/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0`

**Description:** Get learner profile by user ID  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "cfe46a7b-7a17-42d5-9f43-fae87fca5188",
    "userId": "f18f0e4a-8cea-4b05-9ca4-e6eff10893c0",
    "firstName": null,
    "lastName": null,
    "targetBand": 7,
    "currentBand": 6,
    "nativeLanguage": "Vietnamese",
    "learningGoals": "Improve speaking fluency and confidence"
}
```

</details>

---


### GET `/api/learner-profiles/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/average-band`

**Description:** Get learner average band score  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "averageBand": 6
}
```

</details>

---


## Topic APIs


### GET `/api/topics?limit=10`

**Description:** Get all topics  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "8dfe1ede-9d96-4923-8fa6-b755339f2377",
        "name": "Education",
        "icon": "\ud83c\udf93",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "69ee70be-615e-4412-bfe3-9c8b8c014766",
        "name": "Technology",
        "icon": "\ud83d\udcbb",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "08e965b8-5655-4b0a-9be9-32e1b0d4bbd2",
        "name": "Environment",
        "icon": "\ud83c\udf0d",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "80787df4-6636-4517-9679-7ed4dbaf1da0",
        "name": "Health",
        "icon": "\ud83c\udfe5",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "d5ed54c8-e714-4509-9a83-589e14c9aa38",
        "name": "Work",
        "icon": "\ud83d\udcbc",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "9b8bc30c-3610-4be9-b780-7092445d9882",
        "name": "Culture",
        "icon": "\ud83c\udfad",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "16556267-1a6b-4c2b-9169-aceb8dc3d407",
        "name": "Travel",
        "icon": "\u2708\ufe0f",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "4909eba2-4424-49a1-a8e8-9eb7fbeb578d",
        "name": "Family",
        "icon": "\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "937065f3-ed7e-48db-9939-6313e630d535",
        "name": "Media",
        "icon": "\ud83d\udcfa",
        "isActive": true,
        "promptCount": 0
    },
    {
        "id": "eb07d8b4-3be5-4988-8bb9-ae4b19d83ee0",
        "name": "Society",
        "icon": "\ud83c\udfd9\ufe0f",
        "isActive": true,
        "promptCount": 0
    }
]
```

</details>

---


## Prompt APIs


### GET `/api/prompts?limit=5`

**Description:** Get all prompts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "65750292-24ac-4e55-be07-5e9789d11901",
            "skillType": "speaking",
            "difficulty": "easy",
            "content": "Describe your favorite subject at school. You should say: what the subject is, why you like it, how it has helped you, and explain why you think it's important.",
            "prepTime": 60,
            "responseTime": 120,
            "createdAt": "2025-12-12T02:42:28.231Z"
        },
        {
            "id": "5a143558-919b-4cb5-8742-0d9cbed3ed90",
            "skillType": "speaking",
            "difficulty": "hard",
            "content": "Some people believe that university education should be free for all students. Others think students should pay fees. Discuss both views and give your opinion.",
            "prepTime": 45,
            "responseTime": 180,
            "createdAt": "2025-12-12T02:42:28.234Z"
        },
        {
            "id": "dd8d542e-0ebe-4b90-a183-32771dbac5ac",
            "skillType": "speaking",
            "difficulty": "easy",
            "content": "Do you use social media? How often do you use it and what for?",
            "prepTime": 30,
            "responseTime": 60,
            "createdAt": "2025-12-12T02:42:28.236Z"
        },
        {
            "id": "cdaa7c99-63a0-446d-8beb-320de087201b",
            "skillType": "speaking",
            "difficulty": "medium",
            "content": "Describe a piece of technology you find useful. You should say: what it is, how you use it, when you got it, and explain why it is useful to you.",
            "prepTime": 60,
            "responseTime": 120,
            "createdAt": "2025-12-12T02:42:28.238Z"
        },
        {
            "id": "f9c93072-3afb-4c2d-bbed-9c5d87864e96",
            "skillType": "speaking",
            "difficulty": "medium",
            "content": "What do you think are the main environmental problems in your country?",
            "prepTime": 30,
            "responseTime": 90,... (truncated)
```

</details>

---


### GET `/api/prompts/by-skill/writing?limit=5`

**Description:** Get writing prompts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "skillType": "writing",
            "difficulty": "medium",
            "content": "The chart below shows the percentage of students who passed their high school exams in different subjects in 2020 and 2023. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
            "prepTime": 60,
            "responseTime": 1200,
            "createdAt": "2025-12-12T02:42:28.253Z"
        },
        {
            "id": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "difficulty": "medium",
            "content": "The diagrams below show the changes in a town center between 1990 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
            "prepTime": 60,
            "responseTime": 1200,
            "createdAt": "2025-12-12T02:42:28.255Z"
        },
        {
            "id": "88bb69b5-9b5c-4c08-ad11-662802d0df4d",
            "skillType": "writing",
            "difficulty": "hard",
            "content": "Some people believe that the best way to improve public health is by increasing the number of sports facilities. Others think that this would have little effect on public health and other measures are required. Discuss both views and give your own opinion.",
            "prepTime": 120,
            "responseTime": 2400,
            "createdAt": "2025-12-12T02:42:28.257Z"
        },
        {
            "id": "a3bdd770-3d7b-4cca-a48c-81db4ce50585",
            "skillType": "writing",
            "difficulty": "medium",
            "content": "In many countries, children are becoming more dependent on technology for education and entertainment. What are the advantages and disadvantages of this trend?",
            "prepTime": 120,
            "responseTime": 2400,
            "createdAt": "2025-12-12T02:42:28.25... (truncated)
```

</details>

---


### GET `/api/prompts/by-skill/speaking?limit=5`

**Description:** Get speaking prompts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "65750292-24ac-4e55-be07-5e9789d11901",
            "skillType": "speaking",
            "difficulty": "easy",
            "content": "Describe your favorite subject at school. You should say: what the subject is, why you like it, how it has helped you, and explain why you think it's important.",
            "prepTime": 60,
            "responseTime": 120,
            "createdAt": "2025-12-12T02:42:28.231Z"
        },
        {
            "id": "5a143558-919b-4cb5-8742-0d9cbed3ed90",
            "skillType": "speaking",
            "difficulty": "hard",
            "content": "Some people believe that university education should be free for all students. Others think students should pay fees. Discuss both views and give your opinion.",
            "prepTime": 45,
            "responseTime": 180,
            "createdAt": "2025-12-12T02:42:28.234Z"
        },
        {
            "id": "dd8d542e-0ebe-4b90-a183-32771dbac5ac",
            "skillType": "speaking",
            "difficulty": "easy",
            "content": "Do you use social media? How often do you use it and what for?",
            "prepTime": 30,
            "responseTime": 60,
            "createdAt": "2025-12-12T02:42:28.236Z"
        },
        {
            "id": "cdaa7c99-63a0-446d-8beb-320de087201b",
            "skillType": "speaking",
            "difficulty": "medium",
            "content": "Describe a piece of technology you find useful. You should say: what it is, how you use it, when you got it, and explain why it is useful to you.",
            "prepTime": 60,
            "responseTime": 120,
            "createdAt": "2025-12-12T02:42:28.238Z"
        },
        {
            "id": "f9c93072-3afb-4c2d-bbed-9c5d87864e96",
            "skillType": "speaking",
            "difficulty": "medium",
            "content": "What do you think are the main environmental problems in your country?",
            "prepTime": 30,
            "responseTime": 90,... (truncated)
```

</details>

---


### GET `/api/prompts/by-difficulty/intermediate?limit=5`

**Description:** Get intermediate prompts  
**Status:** ❌ FAIL (HTTP 422)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Validation Failed",
    "status": 422,
    "code": "VALIDATION_ERROR",
    "details": {
        "difficulty": {
            "message": "should be one of the following; ['easy','medium','hard']",
            "value": "intermediate"
        }
    }
}
```

</details>

---


### GET `/api/prompts/search/environment?limit=5`

**Description:** Search prompts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "f9c93072-3afb-4c2d-bbed-9c5d87864e96",
        "skillType": "speaking",
        "difficulty": "medium",
        "content": "What do you think are the main environmental problems in your country?",
        "prepTime": 30,
        "responseTime": 90,
        "createdAt": "2025-12-12T02:42:28.240Z"
    },
    {
        "id": "423597ef-1b36-4645-9a8d-cf7512e3c971",
        "skillType": "speaking",
        "difficulty": "medium",
        "content": "How can individuals contribute to protecting the environment in their daily lives?",
        "prepTime": 45,
        "responseTime": 120,
        "createdAt": "2025-12-12T02:42:28.242Z"
    }
]
```

</details>

---


### GET `/api/prompts/filter?skillType=writing&limit=5`

**Description:** Filter prompts  
**Status:** ❌ FAIL (HTTP 400)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Invalid ID format",
    "status": 400,
    "code": "INVALID_UUID"
}
```

</details>

---


### GET `/api/prompts/65750292-24ac-4e55-be07-5e9789d11901`

**Description:** Get prompt by ID  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "65750292-24ac-4e55-be07-5e9789d11901",
    "createdBy": "cb9cbff6-4665-4af9-addc-46a53fc8dfe4",
    "skillType": "speaking",
    "content": "Describe your favorite subject at school. You should say: what the subject is, why you like it, how it has helped you, and explain why you think it's important.",
    "difficulty": "easy",
    "prepTime": 60,
    "responseTime": 120,
    "description": "Part 2 - Individual long turn",
    "followUpQuestions": null,
    "createdAt": "2025-12-12T02:42:28.231Z",
    "updatedAt": "2025-12-12T02:42:28.231Z",
    "attemptCount": 0
}
```

</details>

---


## Class APIs


### GET `/api/classes?limit=5`

**Description:** Get all classes  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "56b4f68a-ba7d-4c59-bc02-daec30971e95",
            "name": "IELTS Speaking Band 7+",
            "code": "SPEAK7PLUS",
            "createdAt": "2025-12-12T02:42:28.272Z"
        },
        {
            "id": "355b3d48-610d-4594-84a9-cdacc4c69482",
            "name": "IELTS Writing Fundamentals",
            "code": "WRITE101",
            "createdAt": "2025-12-12T02:42:28.278Z"
        },
        {
            "id": "d07e0f61-7e48-4705-aff6-3dfb63a1c00e",
            "name": "Luy\u1ec7n thi IELTS To\u00e0n di\u1ec7n",
            "code": "IELTS4SKILL",
            "createdAt": "2025-12-12T02:42:28.282Z"
        },
        {
            "id": "e2f24d57-6760-4c6e-9733-7d2d556fc43e",
            "name": "IELTS Express - 8 Week Program",
            "code": "EXPRESS8W",
            "createdAt": "2025-12-12T02:42:28.286Z"
        },
        {
            "id": "04f3a112-d98a-4aff-9dfb-f6e20a3827de",
            "name": "Speaking Practice Daily",
            "code": "SPEAK101",
            "createdAt": "2025-12-12T02:42:28.290Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 8,
        "pages": 2,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/classes/search/ielts?limit=5`

**Description:** Search classes  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "56b4f68a-ba7d-4c59-bc02-daec30971e95",
        "name": "IELTS Speaking Band 7+",
        "code": "SPEAK7PLUS",
        "createdAt": "2025-12-12T02:42:28.272Z"
    },
    {
        "id": "355b3d48-610d-4594-84a9-cdacc4c69482",
        "name": "IELTS Writing Fundamentals",
        "code": "WRITE101",
        "createdAt": "2025-12-12T02:42:28.278Z"
    },
    {
        "id": "d07e0f61-7e48-4705-aff6-3dfb63a1c00e",
        "name": "Luy\u1ec7n thi IELTS To\u00e0n di\u1ec7n",
        "code": "IELTS4SKILL",
        "createdAt": "2025-12-12T02:42:28.282Z"
    },
    {
        "id": "e2f24d57-6760-4c6e-9733-7d2d556fc43e",
        "name": "IELTS Express - 8 Week Program",
        "code": "EXPRESS8W",
        "createdAt": "2025-12-12T02:42:28.286Z"
    },
    {
        "id": "4210b7c7-5d7b-4b3f-a0e7-74c6bfcb8649",
        "name": "Academic Writing Mastery",
        "code": "ACAWRITE",
        "createdAt": "2025-12-12T02:42:28.295Z"
    }
]
```

</details>

---


### GET `/api/classes/filter?limit=5`

**Description:** Filter classes  
**Status:** ❌ FAIL (HTTP 400)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Invalid ID format",
    "status": 400,
    "code": "INVALID_UUID"
}
```

</details>

---


### GET `/api/classes/teacher/d6777fb6-1d36-439d-b7a7-4f07cebad8af?limit=5`

**Description:** Get classes by teacher  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "d07e0f61-7e48-4705-aff6-3dfb63a1c00e",
            "name": "Luy\u1ec7n thi IELTS To\u00e0n di\u1ec7n",
            "code": "IELTS4SKILL",
            "createdAt": "2025-12-12T02:42:28.282Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 1,
        "pages": 1,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/classes/teacher/d6777fb6-1d36-439d-b7a7-4f07cebad8af/count`

**Description:** Count classes by teacher  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 1
}
```

</details>

---


### GET `/api/classes/56b4f68a-ba7d-4c59-bc02-daec30971e95`

**Description:** Get class by ID  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "56b4f68a-ba7d-4c59-bc02-daec30971e95",
    "teacherId": "cb9cbff6-4665-4af9-addc-46a53fc8dfe4",
    "name": "IELTS Speaking Band 7+",
    "description": "Advanced speaking practice for students targeting Band 7 and above",
    "code": "SPEAK7PLUS",
    "createdAt": "2025-12-12T02:42:28.272Z",
    "updatedAt": "2025-12-12T02:42:28.272Z",
    "learnerCount": 5,
    "learners": [
        {
            "id": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
            "email": "learner.alice@example.com"
        },
        {
            "id": "451414b7-32b8-4078-bdd3-5fb02192fe64",
            "email": "learner.bob@example.com"
        },
        {
            "id": "2f80e35d-152a-4bb0-b0da-1a97bdca7db0",
            "email": "learner.charlie@example.com"
        },
        {
            "id": "19398a7b-33f6-4f11-9581-38bdc182da62",
            "email": "learner.diana@example.com"
        },
        {
            "id": "3cfe55a4-08fc-4c41-8fc2-f2662c2b6103",
            "email": "learner.emma@example.com"
        }
    ]
}
```

</details>

---


### GET `/api/classes/56b4f68a-ba7d-4c59-bc02-daec30971e95/learner-count`

**Description:** Get class learner count  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 5
}
```

</details>

---


## Attempt APIs


### GET `/api/attempts?limit=5`

**Description:** Get all attempts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.313Z",
            "submittedAt": "2025-11-25T03:12:28.313Z"
        },
        {
            "id": "64fb01bb-6ff1-4340-96b6-e3e54754b163",
            "promptId": "65750292-24ac-4e55-be07-5e9789d11901",
            "skillType": "speaking",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.321Z",
            "submittedAt": "2025-12-07T02:47:28.321Z"
        },
        {
            "id": "da0296cc-a65d-4ac0-a172-d9d824e8ba24",
            "promptId": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "skillType": "writing",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.307Z",
            "submittedAt": "2025-11-29T03:12:28.307Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 3,
        "pages": 1,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/attempts/by-status/submitted?limit=5`

**Description:** Get submitted attempts  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/attempts/by-skill/writing?limit=5`

**Description:** Get writing attempts  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/attempts/learner/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0?limit=5`

**Description:** Get attempts by learner  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "You can only view your own attempts"
}
```

</details>

---


### GET `/api/attempts/learner/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/count`

**Description:** Count attempts by learner  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/attempts/learner/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/submitted-count`

**Description:** Count submitted attempts  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/attempts/learner/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/scored-count`

**Description:** Count scored attempts  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/attempts/f30c42cc-0df7-4e56-8326-7d308cf781c6`

**Description:** Get attempt by ID  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
    "learnerId": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
    "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
    "skillType": "writing",
    "status": "scored",
    "createdAt": "2025-12-12T02:42:28.313Z",
    "startedAt": "2025-11-25T02:42:28.313Z",
    "submittedAt": "2025-11-25T03:12:28.313Z",
    "scoredAt": "2025-11-25T03:17:28.313Z",
    "media": [],
    "feedbacks": []
}
```

</details>

---


## Score APIs


### GET `/api/scores?limit=5`

**Description:** Get all scores  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/scores/by-band/7?limit=5`

**Description:** Get scores by band  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/scores/by-band-range/6/8?limit=5`

**Description:** Get scores by band range  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/scores/stats/average-band`

**Description:** Get average band statistics  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/scores/stats/distribution`

**Description:** Get score distribution  
**Status:** ❌ FAIL (HTTP 403)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Access denied"
}
```

</details>

---


### GET `/api/scores/attempt/f30c42cc-0df7-4e56-8326-7d308cf781c6`

**Description:** Get score by attempt  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "id": "70c865c5-0558-43c7-9894-dcaca9dfe7da",
    "attemptId": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
    "skillType": "writing",
    "overallBand": 8,
    "confidence": 0.831,
    "subScores": [
        {
            "label": "Task Achievement",
            "value": 7.8
        },
        {
            "label": "Coherence & Cohesion",
            "value": 7.5
        },
        {
            "label": "Lexical Resource",
            "value": 7.7
        },
        {
            "label": "Grammatical Range",
            "value": 8.3
        }
    ],
    "feedback": "Your essay demonstrates a good understanding of the topic. You have addressed the task well with clear arguments.",
    "detailedFeedback": {
        "strengths": [
            "Clear introduction and conclusion",
            "Good use of linking words",
            "Relevant examples provided"
        ],
        "suggestions": [
            "Practice writing complex sentences",
            "Read academic texts to expand vocabulary",
            "Review task response criteria"
        ],
        "areasForImprovement": [
            "Develop ideas more fully in body paragraphs",
            "Vary sentence structures more",
            "Use more academic vocabulary"
        ]
    },
    "createdAt": "2025-12-12T02:42:28.316Z"
}
```

</details>

---


## Feedback APIs


### GET `/api/feedback?limit=5`

**Description:** Get all feedback  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "9e46d5ff-020a-43a0-93a2-28eea821108e",
            "attemptId": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
            "type": "teacher_comment",
            "visibility": "teacher_and_learner",
            "createdAt": "2025-12-12T02:42:28.319Z"
        },
        {
            "id": "858bcc3c-04ef-41ca-be4e-2b83b4ea33f7",
            "attemptId": "8750b386-84df-450e-acc0-e2da14d39b8f",
            "type": "teacher_comment",
            "visibility": "teacher_and_learner",
            "createdAt": "2025-12-12T02:42:28.331Z"
        },
        {
            "id": "69c475d9-3aae-4e37-8a77-cef025ddc25e",
            "attemptId": "9bcfb884-3f93-4ccd-babc-1432cef785f4",
            "type": "teacher_comment",
            "visibility": "teacher_and_learner",
            "createdAt": "2025-12-12T02:42:28.348Z"
        },
        {
            "id": "9706d571-44b8-4b98-8457-99cc9273fea9",
            "attemptId": "39992902-0642-4c20-8ca5-5709efab09d2",
            "type": "teacher_comment",
            "visibility": "teacher_and_learner",
            "createdAt": "2025-12-12T02:42:28.354Z"
        },
        {
            "id": "e70e6786-9047-4401-bfae-acc79ba56d55",
            "attemptId": "50cfda2c-69e7-4d7b-a178-a13610cdf093",
            "type": "teacher_comment",
            "visibility": "teacher_and_learner",
            "createdAt": "2025-12-12T02:42:28.359Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 38,
        "pages": 8,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/feedback/by-type/ai_generated?limit=5`

**Description:** Get AI-generated feedback  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 0,
        "pages": 0,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/feedback/by-visibility/public?limit=5`

**Description:** Get public feedback  
**Status:** ❌ FAIL (HTTP 422)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Validation Failed",
    "status": 422,
    "code": "VALIDATION_ERROR",
    "details": {
        "visibility": {
            "message": "should be one of the following; ['private_to_teacher','teacher_and_learner']",
            "value": "public"
        }
    }
}
```

</details>

---


### GET `/api/feedback/attempt/f30c42cc-0df7-4e56-8326-7d308cf781c6`

**Description:** Get feedback by attempt  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "9e46d5ff-020a-43a0-93a2-28eea821108e",
        "attemptId": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
        "authorId": "1163c1bf-ce69-4cf3-9a26-d33befd18546",
        "type": "teacher_comment",
        "content": "Good effort on this essay! You have shown strong writing skills. Focus on coherence for your next attempt.",
        "visibility": "teacher_and_learner",
        "metadata": null,
        "createdAt": "2025-12-12T02:42:28.319Z",
        "updatedAt": "2025-12-12T02:42:28.319Z"
    }
]
```

</details>

---


### GET `/api/feedback/f30c42cc-0df7-4e56-8326-7d308cf781c6/count`

**Description:** Count feedback by attempt  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 1
}
```

</details>

---


## Scoring Job APIs


### GET `/api/scoring-jobs?limit=5`

**Description:** Get all scoring jobs  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "3f7754d5-18df-402f-a437-3c9e65de050f",
            "attemptId": "da0296cc-a65d-4ac0-a172-d9d824e8ba24",
            "status": "queued",
            "createdAt": "2025-12-12T02:42:28.310Z"
        },
        {
            "id": "ca7ef782-7327-4861-a88b-bc884343ef2b",
            "attemptId": "1dbbeee5-0e33-48e0-b6d2-17505e9081f2",
            "status": "queued",
            "createdAt": "2025-12-12T02:42:28.325Z"
        },
        {
            "id": "fc70f099-e105-4721-9a9d-772d3bdb593c",
            "attemptId": "fc37095b-aa1d-49f7-9243-460ee5cabca6",
            "status": "queued",
            "createdAt": "2025-12-12T02:42:28.426Z"
        },
        {
            "id": "c6542025-7459-4254-a3fa-3a06fc406ece",
            "attemptId": "1ac17563-d856-4a5d-a59d-ba6cc7e15bf7",
            "status": "queued",
            "createdAt": "2025-12-12T02:42:28.430Z"
        },
        {
            "id": "b0c913cc-1283-424a-8c2e-62fab2c82020",
            "attemptId": "e9d9ec4d-ff73-43a9-b0da-6c614f912ec5",
            "status": "queued",
            "createdAt": "2025-12-12T02:42:28.479Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 8,
        "pages": 2,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/scoring-jobs/by-status/completed?limit=5`

**Description:** Get completed scoring jobs  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 0,
        "pages": 0,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/scoring-jobs/pending/5`

**Description:** Get pending scoring jobs  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "3f7754d5-18df-402f-a437-3c9e65de050f",
        "attemptId": "da0296cc-a65d-4ac0-a172-d9d824e8ba24",
        "status": "queued",
        "errorMessage": null,
        "retryCount": 0,
        "createdAt": "2025-12-12T02:42:28.310Z",
        "startedAt": null,
        "completedAt": null
    },
    {
        "id": "ca7ef782-7327-4861-a88b-bc884343ef2b",
        "attemptId": "1dbbeee5-0e33-48e0-b6d2-17505e9081f2",
        "status": "queued",
        "errorMessage": null,
        "retryCount": 0,
        "createdAt": "2025-12-12T02:42:28.325Z",
        "startedAt": null,
        "completedAt": null
    },
    {
        "id": "fc70f099-e105-4721-9a9d-772d3bdb593c",
        "attemptId": "fc37095b-aa1d-49f7-9243-460ee5cabca6",
        "status": "queued",
        "errorMessage": null,
        "retryCount": 0,
        "createdAt": "2025-12-12T02:42:28.426Z",
        "startedAt": null,
        "completedAt": null
    },
    {
        "id": "c6542025-7459-4254-a3fa-3a06fc406ece",
        "attemptId": "1ac17563-d856-4a5d-a59d-ba6cc7e15bf7",
        "status": "queued",
        "errorMessage": null,
        "retryCount": 0,
        "createdAt": "2025-12-12T02:42:28.430Z",
        "startedAt": null,
        "completedAt": null
    },
    {
        "id": "b0c913cc-1283-424a-8c2e-62fab2c82020",
        "attemptId": "e9d9ec4d-ff73-43a9-b0da-6c614f912ec5",
        "status": "queued",
        "errorMessage": null,
        "retryCount": 0,
        "createdAt": "2025-12-12T02:42:28.479Z",
        "startedAt": null,
        "completedAt": null
    }
]
```

</details>

---


### GET `/api/scoring-jobs/stats/queued-count`

**Description:** Count queued jobs  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 8
}
```

</details>

---


### GET `/api/scoring-jobs/stats/failed-count`

**Description:** Count failed jobs  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 0
}
```

</details>

---


## Attempt Media APIs


### GET `/api/attempt-media?limit=5`

**Description:** Get all attempt media  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 0,
        "pages": 0,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/attempt-media/by-type/audio?limit=5`

**Description:** Get audio media  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 0,
        "pages": 0,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---


### GET `/api/attempt-media/attempt/f30c42cc-0df7-4e56-8326-7d308cf781c6`

**Description:** Get media by attempt  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[]
```

</details>

---


### GET `/api/attempt-media/f30c42cc-0df7-4e56-8326-7d308cf781c6/count`

**Description:** Count media by attempt  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "count": 0
}
```

</details>

---


## Practice APIs


### GET `/api/practice/prompts?skillType=writing&limit=5`

**Description:** Get practice prompts  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "items": [
        {
            "id": "755c39c3-2b6a-44b5-a2ab-1cdf6e20b7ee",
            "content": "In some countries, TV programs and movies are watched more than reading books. Why is this happening? Is it a positive or negative development?",
            "skillType": "writing",
            "difficulty": "medium",
            "prepTime": 120,
            "responseTime": 2400,
            "attemptCount": 0,
            "createdAt": "2025-12-12T02:42:28.264Z",
            "writingTaskType": "task_2",
            "minWordCount": 250
        },
        {
            "id": "9d6fcb1e-1e5d-4329-8659-10cfab31edd0",
            "content": "Some people think that employers should not care about the way their employees dress, because what matters is the quality of their work. To what extent do you agree or disagree?",
            "skillType": "writing",
            "difficulty": "medium",
            "prepTime": 120,
            "responseTime": 2400,
            "attemptCount": 0,
            "createdAt": "2025-12-12T02:42:28.262Z",
            "writingTaskType": "task_2",
            "minWordCount": 250
        },
        {
            "id": "88de41b6-cfab-4829-afb6-d926b4b5e9bf",
            "content": "Climate change is now an accepted threat to our planet, but there is not enough political action to control excessive consumerism and pollution. Do you agree or disagree?",
            "skillType": "writing",
            "difficulty": "hard",
            "prepTime": 120,
            "responseTime": 2400,
            "attemptCount": 0,
            "createdAt": "2025-12-12T02:42:28.260Z",
            "writingTaskType": "task_2",
            "minWordCount": 250
        },
        {
            "id": "a3bdd770-3d7b-4cca-a48c-81db4ce50585",
            "content": "In many countries, children are becoming more dependent on technology for education and entertainment. What are the advantages and disadvantages of this trend?",
            "skillType": "writing",
           ... (truncated)
```

</details>

---


### GET `/api/practice/history?limit=5`

**Description:** Get practice history  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "items": [
        {
            "attemptId": "64fb01bb-6ff1-4340-96b6-e3e54754b163",
            "promptId": "65750292-24ac-4e55-be07-5e9789d11901",
            "promptContent": "",
            "skillType": "speaking",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.321Z",
            "submittedAt": "2025-12-07T02:47:28.321Z",
            "scoredAt": null
        },
        {
            "attemptId": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "promptContent": "",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.313Z",
            "submittedAt": "2025-11-25T03:12:28.313Z",
            "scoredAt": "2025-11-25T03:17:28.313Z"
        },
        {
            "attemptId": "da0296cc-a65d-4ac0-a172-d9d824e8ba24",
            "promptId": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "promptContent": "",
            "skillType": "writing",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.307Z",
            "submittedAt": "2025-11-29T03:12:28.307Z",
            "scoredAt": null
        }
    ],
    "total": 3,
    "limit": 5,
    "offset": 0,
    "hasMore": false
}
```

</details>

---


### GET `/api/practice/writing/active`

**Description:** Get active writing session  
**Status:** ✅ PASS (HTTP 204)

<details>
<summary>Response</summary>

```json

```

</details>

---


## Teacher APIs


### GET `/api/teacher/classes?limit=5`

**Description:** Get teacher's classes  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
[
    {
        "id": "355b3d48-610d-4594-84a9-cdacc4c69482",
        "name": "IELTS Writing Fundamentals",
        "description": "Essential writing skills for IELTS Academic and General Training",
        "code": "WRITE101",
        "teacherId": "cb9cbff6-4665-4af9-addc-46a53fc8dfe4",
        "learnerCount": 5,
        "createdAt": "2025-12-12T02:42:28.278Z",
        "updatedAt": "2025-12-12T02:42:28.278Z"
    },
    {
        "id": "56b4f68a-ba7d-4c59-bc02-daec30971e95",
        "name": "IELTS Speaking Band 7+",
        "description": "Advanced speaking practice for students targeting Band 7 and above",
        "code": "SPEAK7PLUS",
        "teacherId": "cb9cbff6-4665-4af9-addc-46a53fc8dfe4",
        "learnerCount": 5,
        "createdAt": "2025-12-12T02:42:28.272Z",
        "updatedAt": "2025-12-12T02:42:28.272Z"
    }
]
```

</details>

---


### GET `/api/teacher/learners?limit=5`

**Description:** Get teacher's learners  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "items": [
        {
            "id": "579ee118-83f3-424a-8a61-b2e05553ed46",
            "email": "learner.linh@example.com",
            "displayName": "V\u0169 Th\u1ecb Linh",
            "avatarUrl": null,
            "status": "active",
            "totalAttempts": 3,
            "lastActiveAt": "2025-12-12T02:42:28.531Z",
            "createdAt": "2025-12-12T02:42:28.162Z"
        },
        {
            "id": "5c1e853e-c9a4-444c-9f98-4f70d89ee849",
            "email": "learner.nam@example.com",
            "displayName": "Ho\u00e0ng Nam",
            "avatarUrl": null,
            "status": "active",
            "totalAttempts": 6,
            "lastActiveAt": "2025-12-12T02:42:28.489Z",
            "createdAt": "2025-12-12T02:42:28.158Z"
        },
        {
            "id": "3cfe55a4-08fc-4c41-8fc2-f2662c2b6103",
            "email": "learner.emma@example.com",
            "displayName": "Emma Johnson",
            "avatarUrl": null,
            "status": "active",
            "totalAttempts": 4,
            "lastActiveAt": "2025-12-12T02:42:28.466Z",
            "createdAt": "2025-12-12T02:42:28.156Z"
        },
        {
            "id": "19398a7b-33f6-4f11-9581-38bdc182da62",
            "email": "learner.diana@example.com",
            "displayName": "Diana Martinez",
            "avatarUrl": null,
            "status": "active",
            "totalAttempts": 4,
            "lastActiveAt": "2025-12-12T02:42:28.435Z",
            "createdAt": "2025-12-12T02:42:28.152Z"
        },
        {
            "id": "4e1b68a7-2b89-497d-bfbe-bfda434bb220",
            "email": "learner.hung@example.com",
            "displayName": "L\u00ea V\u0103n H\u00f9ng",
            "avatarUrl": null,
            "status": "active",
            "totalAttempts": 5,
            "lastActiveAt": "2025-12-12T02:42:28.423Z",
            "createdAt": "2025-12-12T02:42:28.150Z"
        }
    ],
    "total": 10,
    "limit": 5,
    "offset": 0,
    "hasMore": true
}
```

</details>

---


### GET `/api/teacher/classes/56b4f68a-ba7d-4c59-bc02-daec30971e95/learners?limit=5`

**Description:** Get class learners  
**Status:** ❌ FAIL (HTTP 404)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "Route GET /api/teacher/classes/56b4f68a-ba7d-4c59-bc02-daec30971e95/learners not found",
    "status": 404,
    "code": "ROUTE_NOT_FOUND"
}
```

</details>

---


### GET `/api/teacher/learners/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0`

**Description:** Get learner details  
**Status:** ❌ FAIL (HTTP 500)

<details>
<summary>Response</summary>

```json
{
    "success": false,
    "message": "An unexpected error occurred. Please try again later.",
    "status": 500
}
```

</details>

---


### GET `/api/teacher/learners/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/history?limit=5`

**Description:** Get learner history  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "items": [
        {
            "attemptId": "e23622f1-adda-4e1f-9f18-b36835fe90b1",
            "promptContent": "",
            "skillType": "speaking",
            "status": "in_progress",
            "hasTeacherComment": false,
            "createdAt": "2025-12-12T02:42:28.339Z",
            "submittedAt": null,
            "scoredAt": null
        },
        {
            "attemptId": "728f9928-bc2c-4fb0-bc1d-a0ea580a628d",
            "promptContent": "",
            "skillType": "speaking",
            "status": "scored",
            "hasTeacherComment": false,
            "createdAt": "2025-12-12T02:42:28.336Z",
            "submittedAt": "2025-11-20T02:47:28.336Z",
            "scoredAt": "2025-11-20T02:52:28.336Z"
        },
        {
            "attemptId": "28e96c38-d701-4910-93e3-d74221525631",
            "promptContent": "",
            "skillType": "speaking",
            "status": "scored",
            "hasTeacherComment": false,
            "createdAt": "2025-12-12T02:42:28.332Z",
            "submittedAt": "2025-12-06T02:47:28.332Z",
            "scoredAt": "2025-12-06T02:52:28.332Z"
        },
        {
            "attemptId": "8750b386-84df-450e-acc0-e2da14d39b8f",
            "promptContent": "",
            "skillType": "writing",
            "status": "evaluated_by_teacher",
            "hasTeacherComment": false,
            "createdAt": "2025-12-12T02:42:28.327Z",
            "submittedAt": "2025-11-17T03:12:28.327Z",
            "scoredAt": "2025-11-17T03:17:28.327Z"
        },
        {
            "attemptId": "1dbbeee5-0e33-48e0-b6d2-17505e9081f2",
            "promptContent": "",
            "skillType": "writing",
            "status": "submitted",
            "teacherScore": 7,
            "hasTeacherComment": true,
            "createdAt": "2025-12-12T02:42:28.323Z",
            "submittedAt": "2025-12-04T03:12:28.323Z",
            "scoredAt": null
        }
    ]
}
```

</details>

---


### GET `/api/teacher/learners/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/progress`

**Description:** Get learner progress  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "learnerId": "f18f0e4a-8cea-4b05-9ca4-e6eff10893c0",
    "learnerName": "Tr\u1ea7n Minh",
    "period": "weekly",
    "totalAttempts": 3,
    "avgScoreTrend": []
}
```

</details>

---


### GET `/api/teacher/learners/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0/suggestions`

**Description:** Get learner suggestions  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "success": true,
    "suggestedDifficulty": "easy",
    "suggestions": []
}
```

</details>

---


### GET `/api/teacher/attempts/f30c42cc-0df7-4e56-8326-7d308cf781c6`

**Description:** Get attempt details for review  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "attemptId": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
    "learnerId": "4dfac3dd-db4e-46c1-970b-709a9c9588b6",
    "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
    "promptContent": "",
    "skillType": "writing",
    "status": "scored",
    "writingContent": "The question of whether universities should be free is a complex one that divides opinion. While some argue that free education is a fundamental right, others believe that students should contribute to the cost of their studies.\n\nProponents of free university education argue that it promotes equality of opportunity. When education is free, students from all economic backgrounds can pursue higher education without the burden of debt. This can lead to a more educated workforce and ultimately benefit the economy as a whole.\n\nOn the other hand, opponents argue that free education places an unsustainable burden on taxpayers. Universities require significant funding for facilities, research, and staff, and without tuition fees, this cost falls entirely on the public purse. Additionally, when students pay for their education, they may be more motivated to complete their studies and make the most of the opportunity.\n\nIn my opinion, a balanced approach is best. While some form of government support is essential to ensure access for all, students who can afford to contribute should do so. This could take the form of income-contingent loans that are repayable only after graduation and above a certain income threshold.",
    "wordCount": 192,
    "recordings": [],
    "teacherComment": null,
    "evaluatedBy": null,
    "evaluatedAt": null,
    "createdAt": "2025-12-12T02:42:28.313Z",
    "startedAt": "2025-11-25T02:42:28.313Z",
    "submittedAt": "2025-11-25T03:12:28.313Z"
}
```

</details>

---


## Admin APIs (Score & Attempt Management)


### GET `/api/scores?limit=5`

**Description:** Get all scores (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "28c43a1c-ce72-4b33-b327-7f01324a236f",
            "attemptId": "147a7b85-fa63-4026-8a8e-f55020dda324",
            "skillType": "speaking",
            "overallBand": 7.5,
            "createdAt": "2025-12-12T02:42:28.666Z"
        },
        {
            "id": "76763ad0-fb10-4489-90ce-7b6cd3410936",
            "attemptId": "d01a0f99-104c-4e5e-9415-18b90a8b90ba",
            "skillType": "writing",
            "overallBand": 6,
            "createdAt": "2025-12-12T02:42:28.660Z"
        },
        {
            "id": "b2f1b139-b62a-41f0-8da4-3fb9baf72c32",
            "attemptId": "c5374902-7087-4f44-94c4-04b45733cc7f",
            "skillType": "writing",
            "overallBand": 6,
            "createdAt": "2025-12-12T02:42:28.655Z"
        },
        {
            "id": "d7e3bf74-442e-4417-a6d7-41fc5994cefc",
            "attemptId": "893ea32c-a247-4afa-a74f-22d4a220cf5e",
            "skillType": "writing",
            "overallBand": 7,
            "createdAt": "2025-12-12T02:42:28.650Z"
        },
        {
            "id": "2ef57b55-0a77-49d8-ac0c-d49950f5af5f",
            "attemptId": "6758f770-c4c4-4abe-b859-39000b6dd8d4",
            "skillType": "writing",
            "overallBand": 5,
            "createdAt": "2025-12-12T02:42:28.645Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 62,
        "pages": 13,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/scores/stats/average-band`

**Description:** Get average band stats (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "averageBand": 6.653225806451613
}
```

</details>

---


### GET `/api/scores/stats/distribution`

**Description:** Get score distribution (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "8.0": 12,
    "6.0": 10,
    "5.0": 12,
    "6.5": 6,
    "8.5": 6,
    "5.5": 5,
    "7.0": 7,
    "7.5": 4
}
```

</details>

---


### GET `/api/attempts/by-status/submitted?limit=5`

**Description:** Get submitted attempts (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "64fb01bb-6ff1-4340-96b6-e3e54754b163",
            "promptId": "65750292-24ac-4e55-be07-5e9789d11901",
            "skillType": "speaking",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.321Z",
            "submittedAt": "2025-12-07T02:47:28.321Z"
        },
        {
            "id": "74d3ab6d-bf96-4e71-8e45-b8f074e2b8a4",
            "promptId": "5a143558-919b-4cb5-8742-0d9cbed3ed90",
            "skillType": "speaking",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.363Z",
            "submittedAt": "2025-11-27T02:47:28.363Z"
        },
        {
            "id": "fc37095b-aa1d-49f7-9243-460ee5cabca6",
            "promptId": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "skillType": "writing",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.424Z",
            "submittedAt": "2025-12-06T03:12:28.424Z"
        },
        {
            "id": "1ac17563-d856-4a5d-a59d-ba6cc7e15bf7",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.428Z",
            "submittedAt": "2025-11-26T03:12:28.428Z"
        },
        {
            "id": "b125c665-6458-43e8-bb61-1f56c8fbe4c1",
            "promptId": "5a143558-919b-4cb5-8742-0d9cbed3ed90",
            "skillType": "speaking",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.435Z",
            "submittedAt": "2025-12-10T02:47:28.435Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 18,
        "pages": 4,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/attempts/by-skill/writing?limit=5`

**Description:** Get writing attempts (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "f30c42cc-0df7-4e56-8326-7d308cf781c6",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.313Z",
            "submittedAt": "2025-11-25T03:12:28.313Z"
        },
        {
            "id": "8750b386-84df-450e-acc0-e2da14d39b8f",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "evaluated_by_teacher",
            "createdAt": "2025-12-12T02:42:28.327Z",
            "submittedAt": "2025-11-17T03:12:28.327Z"
        },
        {
            "id": "4d835f09-3497-49a7-a8ac-29cb84477b6f",
            "promptId": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.341Z",
            "submittedAt": "2025-11-21T03:12:28.341Z"
        },
        {
            "id": "9bcfb884-3f93-4ccd-babc-1432cef785f4",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.345Z",
            "submittedAt": "2025-11-20T03:12:28.344Z"
        },
        {
            "id": "39992902-0642-4c20-8ca5-5709efab09d2",
            "promptId": "88bb69b5-9b5c-4c08-ad11-662802d0df4d",
            "skillType": "writing",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.350Z",
            "submittedAt": "2025-11-29T03:12:28.350Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 59,
        "pages": 12,
        "currentPage": 1,
        "hasMore": true
    }
}
```

</details>

---


### GET `/api/attempts/learner/f18f0e4a-8cea-4b05-9ca4-e6eff10893c0?limit=5`

**Description:** Get learner attempts (admin)  
**Status:** ✅ PASS (HTTP 200)

<details>
<summary>Response</summary>

```json
{
    "data": [
        {
            "id": "8750b386-84df-450e-acc0-e2da14d39b8f",
            "promptId": "10945113-8c5b-49fa-9cbe-248004dfad5a",
            "skillType": "writing",
            "status": "evaluated_by_teacher",
            "createdAt": "2025-12-12T02:42:28.327Z",
            "submittedAt": "2025-11-17T03:12:28.327Z"
        },
        {
            "id": "28e96c38-d701-4910-93e3-d74221525631",
            "promptId": "65750292-24ac-4e55-be07-5e9789d11901",
            "skillType": "speaking",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.332Z",
            "submittedAt": "2025-12-06T02:47:28.332Z"
        },
        {
            "id": "728f9928-bc2c-4fb0-bc1d-a0ea580a628d",
            "promptId": "5a143558-919b-4cb5-8742-0d9cbed3ed90",
            "skillType": "speaking",
            "status": "scored",
            "createdAt": "2025-12-12T02:42:28.336Z",
            "submittedAt": "2025-11-20T02:47:28.336Z"
        },
        {
            "id": "e23622f1-adda-4e1f-9f18-b36835fe90b1",
            "promptId": "dd8d542e-0ebe-4b90-a183-32771dbac5ac",
            "skillType": "speaking",
            "status": "in_progress",
            "createdAt": "2025-12-12T02:42:28.339Z",
            "submittedAt": null
        },
        {
            "id": "1dbbeee5-0e33-48e0-b6d2-17505e9081f2",
            "promptId": "08dd5869-21fa-42a1-b372-8b7ecd93df20",
            "skillType": "writing",
            "status": "submitted",
            "createdAt": "2025-12-12T02:42:28.323Z",
            "submittedAt": "2025-12-04T03:12:28.323Z"
        }
    ],
    "pagination": {
        "limit": 5,
        "offset": 0,
        "total": 5,
        "pages": 1,
        "currentPage": 1,
        "hasMore": false
    }
}
```

</details>

---

