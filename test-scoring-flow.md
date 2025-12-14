# 🔍 Debug Scoring Flow - Step by Step

## Bước 1: Check Backend Running
```bash
curl http://localhost:3000/api/health
# Hoặc check port backend của bạn
```

## Bước 2: Submit một bài (Frontend)
1. Mở browser console (F12)
2. Submit một bài audio hoặc essay
3. Copy log từ console

**Expected logs:**
```
🎤 Uploading audio file: ...
📤 Upload response: ...
✅ Media ID: ...
📝 Submitting with mediaId: ...
✅ Submit successful: { attemptId, scoringJobId, ... }
🤖 Backend is processing AI scoring in background...
🧭 Navigating to scoring page...
```

## Bước 3: Check Backend Console
Khi submit, backend phải log:
```
🎤 [PracticeService] submitSpeakingAttempt called
   learnerId: ...
   attemptId: ...
   selectedRecordingId: ...
🤖 [PracticeService] Triggering AI scoring in background for jobId: ...
🚀 [PracticeService] Starting scoring job: ...
✅ [PracticeService] Scoring completed successfully
```

## Bước 4: Check Scoring Job Status (Postman/curl)

### Get job by attemptId:
```bash
curl -X GET "http://localhost:3000/api/scoring-jobs/attempt/{attemptId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get all pending jobs:
```bash
curl -X GET "http://localhost:3000/api/scoring-jobs/pending/10"
```

### Get queued jobs count:
```bash
curl -X GET "http://localhost:3000/api/scoring-jobs/stats/queued-count"
```

## Bước 5: Check Attempt Status

```bash
curl -X GET "http://localhost:3000/api/attempts/{attemptId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected status progression:**
1. `IN_PROGRESS` - đang làm bài
2. `PROCESSING` - đã submit, đang chờ chấm
3. `SCORED` - AI đã chấm xong
4. `FAILED` - lỗi

## Bước 6: Check Score Result

```bash
curl -X GET "http://localhost:3000/api/scoring/result/{attemptId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Common Issues

### Issue 1: Backend không log gì
- Check backend có chạy không: `ps aux | grep node`
- Check port: `netstat -tlnp | grep 3000`
- Restart backend: `cd lingolab-backend && npm run dev`

### Issue 2: Job stuck ở QUEUED
- Backend không trigger scoring
- Check import ScoringService có lỗi không
- Check console có error không

### Issue 3: Job status = FAILED
- Check backend log xem error message
- Có thể AI service down hoặc file không tồn tại
- Check errorMessage field trong scoring_jobs table

### Issue 4: Frontend cứ loading mãi
- Attempt status không đổi sang SCORED
- ScoringProgressPage poll mỗi 3s
- Check API `/api/attempts/{attemptId}` có trả về status mới không

## 📊 Database Check

```sql
-- Check scoring jobs
SELECT id, attempt_id, status, error_message, retry_count, created_at, started_at, completed_at 
FROM scoring_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check attempts
SELECT id, learner_id, skill_type, status, submitted_at, scored_at 
FROM attempts 
WHERE id = 'YOUR_ATTEMPT_ID';

-- Check scores
SELECT * FROM scores WHERE attempt_id = 'YOUR_ATTEMPT_ID';
```

## 🎯 Test Plan

1. ✅ Backend running và log ra console
2. ✅ Submit bài → Check frontend console có attemptId & scoringJobId
3. ✅ Check backend console có log trigger scoring
4. ✅ Check database: scoring_jobs table có record mới
5. ✅ Đợi 10-30s → Check status đổi từ QUEUED → PROCESSING → COMPLETED
6. ✅ Check attempts table: status đổi thành SCORED
7. ✅ Check scores table: có record mới với overallBand
8. ✅ Frontend ScoringProgressPage tự động navigate to report

---

**Paste kết quả từng bước vào đây để tôi debug!**

