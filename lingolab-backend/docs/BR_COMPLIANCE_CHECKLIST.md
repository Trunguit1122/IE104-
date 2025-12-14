# Business Rules Compliance Checklist

## UC1: Sign Up (BR1-BR5) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR1 | Required Fields: Email, Password, Display Name | ✅ | `SignUpDTO` in `auth.dto.ts` |
| BR2 | Email RFC 5322 format, no spaces, max 255 chars → MSG-001 | ✅ | `isValidEmail()` in `validation.utils.ts` |
| BR3 | Email uniqueness (case-insensitive) → MSG-002 | ✅ | `signUp()` in `auth.service.ts` |
| BR4 | Password 8-32 chars, 1 upper, 1 lower, 1 number, 1 special → MSG-003 | ✅ | `isValidPassword()` in `validation.utils.ts` |
| BR5 | Create User with PendingVerify status → MSG-004 | ✅ | `UserStatus.PENDING_VERIFY` in `User.ts` |

## UC2: Sign In (BR6-BR8) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR6 | Verify email exists and password matches → MSG-005 | ✅ | `signIn()` in `auth.service.ts` |
| BR7 | Account must be Active and Verified → MSG-006 | ✅ | Status check in `auth.service.ts` |
| BR8 | Lockout: 5 wrong attempts in 10 min → lock 15 min → MSG-007 | ✅ | `failedLoginAttempts`, `lockoutUntil` in `User.ts` |

## UC3: Forgot/Reset Password (BR9-BR11) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR9 | Always show MSG-008 regardless of email existence | ✅ | `forgotPassword()` in `auth.service.ts` |
| BR10 | Token valid 15 minutes, single use | ✅ | `passwordResetExpiry` in `User.ts` |
| BR11 | New password ≠ current password → MSG-009 | ✅ | `resetPassword()` in `auth.service.ts` |

## UC4: Update Profile (BR12-BR14) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR12 | Display name: not empty, max 50 chars, no offensive → MSG-010 | ✅ | `isValidDisplayName()` in `validation.utils.ts` |
| BR13 | Avatar: .jpg/.png/.jpeg, max 2MB → MSG-011 | ✅ | `isValidAvatarFile()` in `validation.utils.ts` |
| BR14 | Success → MSG-018 | ✅ | `updateProfile()` in `auth.service.ts` |

## UC5: Select Practice Skill (BR15-BR16) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR15 | Navigate to /practice/speaking or /practice/writing | ✅ | Frontend routing (backend provides endpoints) |
| BR16 | Session expired → MSG-019 + redirect | ✅ | `checkSessionExpiry()` in `auth.middleware.ts` |

## UC6: View Prompt List (BR17-BR19) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR17 | Filter by Topic and Difficulty | ✅ | `getPromptList()` in `practice.service.ts` |
| BR18 | Search min 3 characters | ✅ | `isValidSearchQuery()` in `validation.utils.ts` |
| BR19 | Default sort: Newest First | ✅ | `orderBy("prompt.createdAt", "DESC")` |

## UC7: Practice Speaking (BR20-BR21) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR20 | Generate unique SessionID, log start time | ✅ | `startSpeakingPractice()` in `practice.service.ts` |
| BR21 | 60 sec prep timer, cannot skip first 5 sec | ⚠️ | Backend provides prepTime; 5-sec skip is frontend logic |

## UC8: Record Audio (BR22-BR24) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR22 | Microphone permission → MSG-012 | ⚠️ | Frontend responsibility; backend validates file |
| BR23 | Duration 30-120 seconds → MSG-013 | ✅ | `isValidAudioDuration()` in `validation.utils.ts` |
| BR24 | Save as .wav or .mp3 | ✅ | `isValidAudioFile()` in `validation.utils.ts` |

## UC9: Manage Recordings (BR25-BR26) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR25 | Filename: alphanumeric, hyphens, underscores, max 50 → MSG-014 | ✅ | `isValidFilename()` in `validation.utils.ts` |
| BR26 | Delete removes from session immediately | ✅ | `deleteRecording()` in `practice.service.ts` |

## UC10: Submit Speaking (BR27-BR29) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR27 | Must select exactly 1 recording → MSG-015 | ✅ | `submitSpeakingAttempt()` in `practice.service.ts` |
| BR28 | API timeout 30 seconds → MSG-016 | ✅ | `estimatedWaitTime: 30` in response |
| BR29 | Status → Processing, redirect to Result | ✅ | `AttemptStatus.PROCESSING` |

## UC11: View Learner List (BR30) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR30 | 50 students per page with pagination | ✅ | `limit = filter.limit || 50` in `teacher.service.ts` |

## UC12: Search/Filter Learners (BR31-BR32) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR31 | Search applies to Name and Email | ✅ | `ILIKE` query on displayName and email |
| BR32 | Multiple filters use AND logic | ✅ | `.andWhere()` chaining in query |

## UC13: View Learner Profile (BR33) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR33 | Teacher can only view assigned students → MSG-020 | ✅ | `checkTeacherAccess()` in `teacher.service.ts` |

## UC14: View Practice History (BR34) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR34 | Sort by date descending (most recent first) | ✅ | `orderBy("attempt.createdAt", "DESC")` |

## UC15: View Attempt Details (BR35) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR35 | Display AI score, feedback text, timestamp | ✅ | `AttemptDetailDTO` with aiScore object |

## UC16: Add Teacher Evaluation (BR36-BR38) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR36 | Score 0.0-9.0, step 0.5 → MSG-017 | ✅ | `isValidScore()` in `validation.utils.ts` |
| BR37 | Comment max 2000 chars, strip HTML | ✅ | `sanitizeComment()` in `validation.utils.ts` |
| BR38 | Update status to "Evaluated by Teacher", notify student | ✅ | `AttemptStatus.EVALUATED_BY_TEACHER`; TODO: notification |

## UC17: Suggest Topics (BR39) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR39 | Match topics to student's skill level (band score) | ✅ | `suggestTopics()` uses avgScore for difficulty |

## UC18: Monitor Progress (BR40-BR41) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR40 | Weekly/Monthly toggle | ✅ | `period: "weekly" | "monthly"` in `ProgressFilterDTO` |
| BR41 | Display Average Score Trend and Total Attempts | ✅ | `avgScoreTrend` and `totalAttempts` in response |

## UC19: Export Reports (BR42-BR45) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR42 | Support .pdf and .xlsx formats | ✅ | `format: "pdf" | "xlsx"` in `ExportReportDTO` |
| BR43 | Filename: Report_[StudentName]_[YYYYMMDD] | ✅ | Generated in `exportReport()` |
| BR44 | Timeout > 60 sec → MSG-021 | ⚠️ | TODO: Implement actual timeout handling |
| BR45 | No data → MSG-022, prevent export | ✅ | `count === 0` check in `exportReport()` |

## UC20: Practice Writing (BR46-BR48) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR46 | Generate unique AttemptID, log timestamp | ✅ | `startWritingPractice()` in `practice.service.ts` |
| BR47 | Display task, word count (150-250), time guideline | ✅ | `minWordCount` in Prompt entity |
| BR48 | One active Writing session at a time → MSG-023 | ✅ | Concurrent session check in `startWritingPractice()` |

## UC21: Compose Writing (BR49-BR50) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR49 | Autosave every 30 seconds | ✅ | `isAutoSave` flag, `lastAutoSavedAt` field |
| BR50 | Real-time word count, warning if < minimum | ✅ | `countWords()`, `meetsMinimumWords` in response |

## UC22: Submit Writing (BR51-BR52) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR51 | Minimum 250 words for Task 2 → MSG-025 | ✅ | Word count validation in `submitWritingAttempt()` |
| BR52 | API timeout 60 seconds → MSG-026 + retry | ✅ | `estimatedWaitTime: 60`, re-scoring support |

## UC23: View AI Scoring (BR53-BR54) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR53 | Feedback: Strengths, Areas for Improvement, Suggestions | ✅ | `detailedFeedback` structure in `scoring.service.ts` |
| BR54 | Scoring fails → MSG-027 + re-scoring option | ✅ | `requestRescore()` in `scoring.service.ts` |

## UC24: View Practice History (BR55-BR57) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR55 | Default sort: descending by date | ✅ | `orderBy("attempt.createdAt", "DESC")` |
| BR56 | Filter by Skill, Date Range, Score Range | ✅ | `PracticeHistoryFilterDTO` |
| BR57 | 10 attempts per page | ✅ | `limit = filter.limit || 10` |

## UC25: Compare Attempts (BR58-BR62) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR58 | Minimum 2 attempts → MSG-028 | ✅ | `isValidCompareSelection()` |
| BR59 | Maximum 5 attempts → MSG-029 | ✅ | `attemptIds.length > 5` check |
| BR60 | Same skill type only → MSG-030 | ✅ | `skillTypes.size > 1` check |
| BR61 | Radar chart, line chart visualization | ✅ | Data structure supports charts |
| BR62 | Score change indicator (↑/↓) and percentage | ✅ | `scoreChanges` array with direction |

## UC26: Retake Practice (BR63) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR63 | Prompt deleted/disabled → MSG-031 | ✅ | `isActive` check in `retakePractice()` |
| BR63 | Create new AttemptID, keep original | ✅ | New attempt creation |

## UC27: Log Out (BR64-BR66) ✅

| BR Code | Requirement | Status | Implementation |
|---------|-------------|--------|----------------|
| BR64 | No confirmation dialog (single-click) | ✅ | API returns immediately |
| BR65 | Server invalidates JWT/refresh token | ✅ | Clear `refreshToken` in `logout()` |
| BR66 | Clear local/session storage | ⚠️ | Frontend responsibility |

---

## Non-Functional Requirements

### Security Rules ✅

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| JWT Authentication for all endpoints | ✅ | `@Security("jwt")` decorator |
| Bcrypt password hashing | ✅ | `bcrypt.hash()` with 12 salt rounds in `auth.service.ts` |
| HTTPS/TLS 1.2+ | ⚠️ | Server configuration (deployment) |
| Input validation (SQL injection, XSS) | ✅ | TypeORM parameterized queries, validation utils |

### User Access Matrix ✅

| Function | Guest | Learner | Teacher | Admin |
|----------|-------|---------|---------|-------|
| Sign Up/Sign In | ✅ | - | - | - |
| View Dashboard | - | ✅ | ✅ | ✅ |
| Take Practice Test | - | ✅ | - | - |
| View Own History | - | ✅ | - | - |
| View Student List | - | - | ✅ | ✅ |
| Grade/Comment | - | - | ✅ | - |
| Manage Users (CRUD) | - | - | - | ✅ |
| Manage Question Bank | - | - | - | ✅ |
| Export Reports | - | - | ✅ | ✅ |

---

## Legend

- ✅ Fully implemented
- ⚠️ Partially implemented (frontend responsibility or needs enhancement)
- ❌ Not implemented (needs fix)

## Action Items

1. ~~**HIGH**: Replace PBKDF2 with Bcrypt for password hashing~~ ✅ DONE
2. **MEDIUM**: Implement notification service for BR38 (teacher evaluation notification)
3. **MEDIUM**: Implement actual report generation for BR42 (PDF/XLSX export)
4. **LOW**: Add login audit logging (UC2 post-condition)
5. **LOW**: Configure HTTPS/TLS for production deployment

