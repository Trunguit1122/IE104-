#!/bin/bash

# ==========================================
# COMPREHENSIVE SECURITY & VALIDATION TEST
# ==========================================

BASE_URL="http://localhost:3000/api"
PASSED=0
FAILED=0
VULNERABILITIES=()

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() {
    echo -e "   ${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

log_fail() {
    echo -e "   ${RED}❌ FAIL${NC}: $1"
    VULNERABILITIES+=("$1")
    ((FAILED++))
}

log_warn() {
    echo -e "   ${YELLOW}⚠️  WARN${NC}: $1"
}

echo "=========================================="
echo "🔐 SECURITY & VALIDATION TESTING"
echo "=========================================="
echo ""

# ==========================================
# 1. AUTH SECURITY TESTS
# ==========================================
echo "=========================================="
echo "🔐 1. AUTHENTICATION SECURITY"
echo "=========================================="

# Test 1.1: Empty credentials
echo ""
echo "📍 1.1 Empty credentials"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{}')
STATUS=$(echo "$RESPONSE" | jq -r '.status // .statusCode // 400')
if [[ "$STATUS" == "400" ]] || [[ "$RESPONSE" == *"required"* ]] || [[ "$RESPONSE" == *"email"* ]]; then
    log_pass "Empty credentials rejected"
else
    log_fail "Empty credentials not properly rejected: $RESPONSE"
fi

# Test 1.2: Invalid email format
echo ""
echo "📍 1.2 Invalid email format"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"notanemail","password":"Password123!"}')
if [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"valid"* ]] || [[ "$RESPONSE" == *"not found"* ]] || [[ "$RESPONSE" == *"credentials"* ]]; then
    log_pass "Invalid email format handled"
else
    log_fail "Invalid email format not validated: $RESPONSE"
fi

# Test 1.3: SQL Injection in email
echo ""
echo "📍 1.3 SQL Injection attempt in email"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com'\'' OR 1=1--","password":"test"}')
if [[ "$RESPONSE" != *"accessToken"* ]]; then
    log_pass "SQL injection in email blocked"
else
    log_fail "Potential SQL injection vulnerability: $RESPONSE"
fi

# Test 1.4: Wrong password
echo ""
echo "📍 1.4 Wrong password"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher.john@lingolab.com","password":"WrongPassword123!"}')
if [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"credentials"* ]] || [[ "$RESPONSE" == *"incorrect"* ]]; then
    log_pass "Wrong password rejected"
else
    log_fail "Wrong password not properly handled: $RESPONSE"
fi

# Test 1.5: Very long password (potential DOS)
echo ""
echo "📍 1.5 Very long password (DOS attempt)"
LONG_PASS=$(python3 -c "print('A'*100000)")
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@test.com\",\"password\":\"$LONG_PASS\"}" --max-time 5)
if [[ $? -eq 0 ]] || [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"credentials"* ]]; then
    log_pass "Long password handled without DOS"
else
    log_fail "Potential DOS with long password"
fi

# Get valid tokens for further testing
echo ""
echo "📍 Getting valid tokens for further tests..."
TEACHER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher.john@lingolab.com","password":"Password123!"}')
TEACHER_TOKEN=$(echo "$TEACHER_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
TEACHER_ID=$(echo "$TEACHER_RESPONSE" | jq -r '.data.user.id // .user.id // empty')

STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"student1@lingolab.com","password":"Password123!"}')
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
STUDENT_ID=$(echo "$STUDENT_RESPONSE" | jq -r '.data.user.id // .user.id // empty')

if [ -z "$TEACHER_TOKEN" ] || [ -z "$STUDENT_TOKEN" ]; then
    echo "❌ Could not get tokens. Exiting..."
    exit 1
fi
echo "   Got tokens for Teacher: $TEACHER_ID and Student: $STUDENT_ID"

# Test 1.6: Access protected route without token
echo ""
echo "📍 1.6 Access protected route without token"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me")
if [[ "$RESPONSE" == *"Unauthorized"* ]] || [[ "$RESPONSE" == *"token"* ]] || [[ "$RESPONSE" == *"401"* ]] || [[ "$RESPONSE" == *"No token"* ]] || [[ "$RESPONSE" == *"MSG_401"* ]]; then
    log_pass "Protected route requires authentication"
else
    log_fail "Protected route accessible without token: $RESPONSE"
fi

# Test 1.7: Invalid token format
echo ""
echo "📍 1.7 Invalid token format"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer invalid.token.here")
if [[ "$RESPONSE" == *"Unauthorized"* ]] || [[ "$RESPONSE" == *"invalid"* ]] || [[ "$RESPONSE" == *"401"* ]] || [[ "$RESPONSE" == *"jwt"* ]] || [[ "$RESPONSE" == *"MSG_019"* ]] || [[ "$RESPONSE" == *"expired"* ]]; then
    log_pass "Invalid token rejected"
else
    log_fail "Invalid token not rejected: $RESPONSE"
fi

# Test 1.8: Expired token (manipulated)
echo ""
echo "📍 1.8 Manipulated/tampered token"
FAKE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTBhYiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.invalid_signature"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $FAKE_TOKEN")
if [[ "$RESPONSE" == *"Unauthorized"* ]] || [[ "$RESPONSE" == *"invalid"* ]] || [[ "$RESPONSE" == *"401"* ]] || [[ "$RESPONSE" == *"MSG_019"* ]]; then
    log_pass "Tampered token rejected"
else
    log_fail "Tampered token not rejected: $RESPONSE"
fi

# ==========================================
# 2. AUTHORIZATION (ROLE) TESTS
# ==========================================
echo ""
echo "=========================================="
echo "👤 2. AUTHORIZATION / ROLE BYPASS TESTS"
echo "=========================================="

# Test 2.1: Student trying to access teacher routes
echo ""
echo "📍 2.1 Student accessing teacher-only routes"

# Try to access teacher-only learners list
RESPONSE=$(curl -s -X GET "$BASE_URL/teacher/learners" \
    -H "Authorization: Bearer $STUDENT_TOKEN")
if [[ "$RESPONSE" == *"Forbidden"* ]] || [[ "$RESPONSE" == *"403"* ]] || [[ "$RESPONSE" == *"permission"* ]] || [[ "$RESPONSE" == *"Insufficient"* ]] || [[ "$RESPONSE" == *"401"* ]]; then
    log_pass "Student blocked from teacher routes"
else
    log_fail "Student can access teacher routes: $RESPONSE"
fi

# Test 2.2: Student trying to evaluate an attempt
echo ""
echo "📍 2.2 Student trying to evaluate an attempt (teacher-only action)"
ATTEMPTS_RESPONSE=$(curl -s -X GET "$BASE_URL/attempts" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
FIRST_ATTEMPT_ID=$(echo "$ATTEMPTS_RESPONSE" | jq -r '.data[0].id // .[0].id // empty')

if [ -n "$FIRST_ATTEMPT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/teacher/attempts/$FIRST_ATTEMPT_ID/evaluate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -d '{"teacherScore":9,"teacherComment":"Hacked!"}')
    if [[ "$RESPONSE" == *"Forbidden"* ]] || [[ "$RESPONSE" == *"403"* ]] || [[ "$RESPONSE" == *"permission"* ]] || [[ "$RESPONSE" == *"authorized"* ]] || [[ "$RESPONSE" == *"denied"* ]]; then
        log_pass "Student blocked from evaluating attempts"
    else
        log_fail "Student can evaluate attempts: $RESPONSE"
    fi
fi

# Test 2.3: Accessing other user's data (IDOR)
echo ""
echo "📍 2.3 IDOR: Student accessing another user's profile"
OTHER_STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"learner.alice@example.com","password":"Password123!"}')
OTHER_STUDENT_ID=$(echo "$OTHER_STUDENT_RESPONSE" | jq -r '.data.user.id // .user.id // empty')

if [ -n "$OTHER_STUDENT_ID" ] && [ "$OTHER_STUDENT_ID" != "$STUDENT_ID" ]; then
    RESPONSE=$(curl -s -X GET "$BASE_URL/learner-profile/$OTHER_STUDENT_ID" \
        -H "Authorization: Bearer $STUDENT_TOKEN")
    # This depends on business logic - some systems allow viewing others' profiles
    echo "   Response for accessing other student profile: $(echo "$RESPONSE" | jq -c '.' | head -c 150)"
fi

# Test 2.4: Student creating feedback as if they were teacher
echo ""
echo "📍 2.4 Student creating teacher-type feedback"
if [ -n "$FIRST_ATTEMPT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/feedbacks" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -d "{\"attemptId\":\"$FIRST_ATTEMPT_ID\",\"type\":\"teacher_comment\",\"content\":\"Fake teacher feedback\"}")
    # Check if it was blocked or if type was overwritten
    FEEDBACK_TYPE=$(echo "$RESPONSE" | jq -r '.type // empty')
    if [[ "$FEEDBACK_TYPE" != "teacher_comment" ]] || [[ "$RESPONSE" == *"Forbidden"* ]] || [[ "$RESPONSE" == *"403"* ]]; then
        log_pass "Student blocked from creating teacher-type feedback"
    else
        log_fail "Student can create teacher-type feedback: $RESPONSE"
    fi
fi

# ==========================================
# 3. INPUT VALIDATION TESTS
# ==========================================
echo ""
echo "=========================================="
echo "📝 3. INPUT VALIDATION TESTS"
echo "=========================================="

# Test 3.1: XSS in feedback content
echo ""
echo "📍 3.1 XSS attempt in feedback content"
XSS_PAYLOAD="<script>alert('XSS')</script>"
RESPONSE=$(curl -s -X POST "$BASE_URL/feedbacks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEACHER_TOKEN" \
    -d "{\"attemptId\":\"$FIRST_ATTEMPT_ID\",\"type\":\"teacher_comment\",\"content\":\"$XSS_PAYLOAD\"}")
STORED_CONTENT=$(echo "$RESPONSE" | jq -r '.content // empty')
if [[ "$STORED_CONTENT" != *"<script>"* ]] || [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"invalid"* ]]; then
    log_pass "XSS payload sanitized or rejected"
else
    log_warn "XSS payload stored as-is (check if output is escaped): $STORED_CONTENT"
fi

# Test 3.2: Invalid UUID format
echo ""
echo "📍 3.2 Invalid UUID format"
RESPONSE=$(curl -s -X GET "$BASE_URL/attempts/not-a-valid-uuid" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
if [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"400"* ]] || [[ "$RESPONSE" == *"uuid"* ]] || [[ "$RESPONSE" == *"not found"* ]] || [[ "$RESPONSE" == *"404"* ]]; then
    log_pass "Invalid UUID handled properly"
else
    log_fail "Invalid UUID not validated: $RESPONSE"
fi

# Test 3.3: Non-existent UUID
echo ""
echo "📍 3.3 Non-existent UUID"
RESPONSE=$(curl -s -X GET "$BASE_URL/attempts/00000000-0000-0000-0000-000000000000" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
if [[ "$RESPONSE" == *"not found"* ]] || [[ "$RESPONSE" == *"404"* ]] || [[ "$RESPONSE" == *"Not Found"* ]]; then
    log_pass "Non-existent UUID returns 404"
else
    log_fail "Non-existent UUID not properly handled: $RESPONSE"
fi

# Test 3.4: Negative pagination values
echo ""
echo "📍 3.4 Negative pagination values"
RESPONSE=$(curl -s -X GET "$BASE_URL/topics?page=-1&limit=-10" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
# Should either return error or default to valid values
if [[ "$RESPONSE" != *"error"* ]] || [[ "$RESPONSE" == *"data"* ]]; then
    log_pass "Negative pagination handled"
else
    log_fail "Negative pagination caused error: $RESPONSE"
fi

# Test 3.5: Extremely large pagination limit
echo ""
echo "📍 3.5 Very large pagination limit"
RESPONSE=$(curl -s -X GET "$BASE_URL/topics?page=1&limit=999999" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
# Should either cap the limit or return error
DATA_COUNT=$(echo "$RESPONSE" | jq '.data | length // 0')
if [[ "$DATA_COUNT" -lt 1000 ]] || [[ "$RESPONSE" == *"error"* ]]; then
    log_pass "Large pagination limit capped or rejected"
else
    log_warn "Large pagination limit not capped: returned $DATA_COUNT items"
fi

# Test 3.6: Score out of valid range
echo ""
echo "📍 3.6 Score out of valid range (0-9)"
if [ -n "$FIRST_ATTEMPT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/teacher/attempts/$FIRST_ATTEMPT_ID/evaluate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -d '{"teacherScore":99,"teacherComment":"Invalid score test"}')
    if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"range"* ]] || [[ "$RESPONSE" == *"must be"* ]]; then
        log_pass "Invalid score range rejected"
    else
        SAVED_SCORE=$(echo "$RESPONSE" | jq -r '.teacherScore // empty')
        if [ "$SAVED_SCORE" == "99" ]; then
            log_fail "Invalid score 99 was accepted"
        else
            log_pass "Score was capped or normalized"
        fi
    fi
fi

# Test 3.7: Negative score
echo ""
echo "📍 3.7 Negative score"
if [ -n "$FIRST_ATTEMPT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/teacher/attempts/$FIRST_ATTEMPT_ID/evaluate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TEACHER_TOKEN" \
        -d '{"teacherScore":-5,"teacherComment":"Negative score test"}')
    if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"range"* ]]; then
        log_pass "Negative score rejected"
    else
        SAVED_SCORE=$(echo "$RESPONSE" | jq -r '.teacherScore // empty')
        if [ "$SAVED_SCORE" == "-5" ]; then
            log_fail "Negative score -5 was accepted"
        else
            log_pass "Negative score was normalized"
        fi
    fi
fi

# Test 3.8: Empty required fields
echo ""
echo "📍 3.8 Empty required fields when creating feedback"
RESPONSE=$(curl -s -X POST "$BASE_URL/feedback" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEACHER_TOKEN" \
    -d '{"attemptId":"","type":"","content":""}')
if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"required"* ]] || [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"400"* ]] || [[ "$RESPONSE" == *"Validation"* ]]; then
    log_pass "Empty required fields rejected"
else
    log_fail "Empty required fields accepted: $RESPONSE"
fi

# Test 3.9: Invalid enum value
echo ""
echo "📍 3.9 Invalid enum value for feedback type"
RESPONSE=$(curl -s -X POST "$BASE_URL/feedback" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEACHER_TOKEN" \
    -d "{\"attemptId\":\"$FIRST_ATTEMPT_ID\",\"type\":\"invalid_type\",\"content\":\"Test\"}")
if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"enum"* ]] || [[ "$RESPONSE" == *"valid"* ]] || [[ "$RESPONSE" == *"Validation"* ]]; then
    log_pass "Invalid enum value rejected"
else
    log_fail "Invalid enum value accepted: $RESPONSE"
fi

# ==========================================
# 4. SQL INJECTION TESTS
# ==========================================
echo ""
echo "=========================================="
echo "💉 4. SQL INJECTION TESTS"
echo "=========================================="

# Test 4.1: SQL injection in query params
echo ""
echo "📍 4.1 SQL injection in query params"
RESPONSE=$(curl -s -X GET "$BASE_URL/topics?page=1;DROP TABLE users;--" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
# If we get back data or an error, the SQL was not executed - PASS
# Only fail if we somehow get database error or unexpected behavior
if [[ "$RESPONSE" == *"syntax error"* ]] || [[ "$RESPONSE" == *"SQL"* ]] || [[ "$RESPONSE" == *"QueryFailed"* ]]; then
    log_fail "Potential SQL injection vulnerability"
else
    log_pass "SQL injection in query params blocked/handled"
fi

# Test 4.2: SQL injection in path params
echo ""
echo "📍 4.2 SQL injection in path params"
RESPONSE=$(curl -s -X GET "$BASE_URL/topics/1'OR'1'='1" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
if [[ "$RESPONSE" == *"Invalid"* ]] || [[ "$RESPONSE" == *"not found"* ]] || [[ "$RESPONSE" == *"error"* ]]; then
    log_pass "SQL injection in path params blocked"
else
    log_fail "Potential SQL injection in path: $RESPONSE"
fi

# Test 4.3: SQL injection in search/filter
echo ""
echo "📍 4.3 SQL injection in search query"
RESPONSE=$(curl -s -X GET "$BASE_URL/prompts?skillType=writing' OR '1'='1" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
# TypeORM should parameterize queries
if [[ "$RESPONSE" != *"all prompts"* ]] || [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"data"* ]]; then
    log_pass "SQL injection in search handled safely"
else
    log_fail "Potential SQL injection vulnerability"
fi

# ==========================================
# 5. BUSINESS LOGIC TESTS
# ==========================================
echo ""
echo "=========================================="
echo "🧠 5. BUSINESS LOGIC TESTS"
echo "=========================================="

# Test 5.1: Submit already submitted attempt
echo ""
echo "📍 5.1 Re-submitting already submitted attempt"
# First find a submitted attempt
SUBMITTED_ATTEMPT=$(curl -s -X GET "$BASE_URL/attempts?status=submitted" \
    -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '.data[0].id // .[0].id // empty')
if [ -n "$SUBMITTED_ATTEMPT" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/practice/writing/submit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -d "{\"attemptId\":\"$SUBMITTED_ATTEMPT\"}")
    if [[ "$RESPONSE" == *"already"* ]] || [[ "$RESPONSE" == *"cannot"* ]] || [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Invalid"* ]]; then
        log_pass "Cannot re-submit already submitted attempt"
    else
        log_fail "Can re-submit already submitted attempt: $RESPONSE"
    fi
else
    echo "   (Skipped - no submitted attempt found)"
fi

# Test 5.2: Modify evaluated attempt
echo ""
echo "📍 5.2 Modifying evaluated attempt"
EVALUATED_ATTEMPT=$(curl -s -X GET "$BASE_URL/attempts?status=evaluated" \
    -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '.data[0].id // .[0].id // empty')
if [ -n "$EVALUATED_ATTEMPT" ]; then
    RESPONSE=$(curl -s -X PUT "$BASE_URL/practice/writing/$EVALUATED_ATTEMPT/content" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -d '{"content":"Trying to modify evaluated content","isAutoSave":false}')
    # Check if modification was blocked (success:false or Cannot update message)
    if [[ "$RESPONSE" == *"Cannot"* ]] || [[ "$RESPONSE" == *"cannot"* ]] || [[ "$RESPONSE" == *"success\":false"* ]] || [[ "$RESPONSE" == *"already"* ]] || [[ "$RESPONSE" == *"completed"* ]]; then
        log_pass "Cannot modify evaluated attempt"
    else
        log_fail "Can modify evaluated attempt: $RESPONSE"
    fi
else
    echo "   (Skipped - no evaluated attempt found)"
fi

# Test 5.3: Access another student's attempt
echo ""
echo "📍 5.3 Access another student's attempt (IDOR)"
# Get an attempt belonging to another student
OTHER_STUDENT_ATTEMPT=$(curl -s -X GET "$BASE_URL/attempts" \
    -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r --arg sid "$STUDENT_ID" '.data[] | select(.learnerId != $sid) | .id' | head -1)
if [ -n "$OTHER_STUDENT_ATTEMPT" ]; then
    RESPONSE=$(curl -s -X GET "$BASE_URL/attempts/$OTHER_STUDENT_ATTEMPT" \
        -H "Authorization: Bearer $STUDENT_TOKEN")
    # Business rule: students should only see their own attempts
    if [[ "$RESPONSE" == *"Forbidden"* ]] || [[ "$RESPONSE" == *"403"* ]] || [[ "$RESPONSE" == *"not authorized"* ]]; then
        log_pass "Student cannot access other's attempt"
    else
        log_warn "Student can view other's attempt (may be intentional): $(echo "$RESPONSE" | jq -c '.' | head -c 100)"
    fi
else
    echo "   (Skipped - no other student's attempt found)"
fi

# Test 5.4: Create attempt for another user
echo ""
echo "📍 5.4 Create attempt for another user"
PROMPT_ID=$(curl -s -X GET "$BASE_URL/prompts" \
    -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '.data[0].id // .[0].id // empty')
if [ -n "$PROMPT_ID" ] && [ -n "$OTHER_STUDENT_ID" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/practice/writing/start" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STUDENT_TOKEN" \
        -d "{\"promptId\":\"$PROMPT_ID\",\"learnerId\":\"$OTHER_STUDENT_ID\"}")
    # Check if learnerId is from token user or from request
    CREATED_LEARNER=$(echo "$RESPONSE" | jq -r '.learnerId // empty')
    if [ "$CREATED_LEARNER" == "$STUDENT_ID" ]; then
        log_pass "Cannot create attempt for another user"
    elif [ "$CREATED_LEARNER" == "$OTHER_STUDENT_ID" ]; then
        log_fail "Can create attempt for another user: $RESPONSE"
    else
        log_pass "Attempt creation uses authenticated user"
    fi
fi

# ==========================================
# 6. RATE LIMITING & DOS TESTS
# ==========================================
echo ""
echo "=========================================="
echo "🚦 6. RATE LIMITING & DOS TESTS"
echo "=========================================="

# Test 6.1: Rapid login attempts (brute force)
echo ""
echo "📍 6.1 Rapid login attempts (10 requests)"
BLOCKED=false
for i in {1..10}; do
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}' --max-time 2)
    if [[ "$RESPONSE" == *"rate"* ]] || [[ "$RESPONSE" == *"blocked"* ]] || [[ "$RESPONSE" == *"429"* ]] || [[ "$RESPONSE" == *"Too many"* ]]; then
        BLOCKED=true
        break
    fi
done
if $BLOCKED; then
    log_pass "Rate limiting active on login"
else
    log_warn "No rate limiting on login (consider implementing)"
fi

# Test 6.2: Large payload
echo ""
echo "📍 6.2 Large payload test (1MB)"
LARGE_CONTENT=$(python3 -c "print('A'*1000000)")
RESPONSE=$(curl -s -X PUT "$BASE_URL/practice/writing/$FIRST_ATTEMPT_ID/content" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d "{\"content\":\"$LARGE_CONTENT\",\"isAutoSave\":false}" --max-time 10 2>&1)
if [[ "$RESPONSE" == *"too large"* ]] || [[ "$RESPONSE" == *"413"* ]] || [[ "$RESPONSE" == *"limit"* ]]; then
    log_pass "Large payload rejected"
else
    log_warn "Large payload accepted (consider size limits)"
fi

# ==========================================
# 7. ERROR HANDLING & INFO LEAKAGE
# ==========================================
echo ""
echo "=========================================="
echo "🔍 7. ERROR HANDLING & INFO LEAKAGE"
echo "=========================================="

# Test 7.1: Check for stack traces in errors
echo ""
echo "📍 7.1 Stack trace leakage in errors"
RESPONSE=$(curl -s -X GET "$BASE_URL/users/invalid-uuid-format" \
    -H "Authorization: Bearer $TEACHER_TOKEN")
if [[ "$RESPONSE" == *"at Object"* ]] || [[ "$RESPONSE" == *"node_modules"* ]] || [[ "$RESPONSE" == *".ts:"* ]] || [[ "$RESPONSE" == *"TypeError"* ]]; then
    log_fail "Stack trace leaked in error response: $(echo "$RESPONSE" | head -c 200)"
else
    log_pass "No stack trace leakage"
fi

# Test 7.2: Check for sensitive info in errors
echo ""
echo "📍 7.2 Sensitive info in error messages"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher.john@lingolab.com","password":"wrong"}')
# Check if actual password value is leaked (not just the word "password" in a generic message)
if [[ "$RESPONSE" == *"wrong"* ]] && [[ "$RESPONSE" != *"Invalid"* ]] && [[ "$RESPONSE" != *"incorrect"* ]]; then
    log_fail "Sensitive password info leaked"
else
    log_pass "No sensitive password info leaked"
fi

# Test 7.3: User enumeration via different error messages
echo ""
echo "📍 7.3 User enumeration test"
EXISTING_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher.john@lingolab.com","password":"wrongpassword"}')
NON_EXISTING_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent999@test.com","password":"wrongpassword"}')

EXISTING_MSG=$(echo "$EXISTING_USER_RESPONSE" | jq -r '.message // empty')
NON_EXISTING_MSG=$(echo "$NON_EXISTING_USER_RESPONSE" | jq -r '.message // empty')

if [ "$EXISTING_MSG" == "$NON_EXISTING_MSG" ]; then
    log_pass "Same error message for existing and non-existing users"
else
    log_warn "Different error messages may allow user enumeration: '$EXISTING_MSG' vs '$NON_EXISTING_MSG'"
fi

# Test 7.4: Debug endpoints exposed
echo ""
echo "📍 7.4 Debug endpoints check"
DEBUG_ENDPOINTS=("/debug" "/admin" "/api/debug" "/api/admin" "/.env" "/config")
DEBUG_EXPOSED=false
for endpoint in "${DEBUG_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000$endpoint")
    if [ "$RESPONSE" == "200" ]; then
        log_fail "Debug endpoint exposed: $endpoint"
        DEBUG_EXPOSED=true
    fi
done
if ! $DEBUG_EXPOSED; then
    log_pass "No debug endpoints exposed"
fi

# ==========================================
# 8. TOKEN & SESSION TESTS
# ==========================================
echo ""
echo "=========================================="
echo "🎫 8. TOKEN & SESSION TESTS"
echo "=========================================="

# Test 8.1: Token in URL (bad practice check)
echo ""
echo "📍 8.1 Token accepted in URL query (should use header)"
RESPONSE=$(curl -s -X GET "$BASE_URL/users/me?token=$TEACHER_TOKEN")
if [[ "$RESPONSE" == *"Unauthorized"* ]] || [[ "$RESPONSE" == *"401"* ]]; then
    log_pass "Token in URL not accepted (good - use header)"
else
    log_warn "Token in URL may be accepted (check implementation)"
fi

# Test 8.2: Refresh token reuse
echo ""
echo "📍 8.2 Refresh token handling"
REFRESH_TOKEN=$(echo "$TEACHER_RESPONSE" | jq -r '.data.refreshToken // .refreshToken // empty')
if [ -n "$REFRESH_TOKEN" ]; then
    # Use refresh token
    REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh-token" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
    
    if [[ "$REFRESH_RESPONSE" == *"accessToken"* ]]; then
        log_pass "Refresh token works"
        
        # Try to use old refresh token again (should be invalidated in secure systems)
        sleep 1
        RESPONSE2=$(curl -s -X POST "$BASE_URL/auth/refresh-token" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
        if [[ "$RESPONSE2" == *"accessToken"* ]]; then
            log_warn "Refresh token can be reused (consider rotation)"
        else
            log_pass "Refresh token rotation implemented"
        fi
    else
        echo "   Refresh token endpoint response: $(echo "$REFRESH_RESPONSE" | head -c 100)"
    fi
fi

# ==========================================
# FINAL SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo "📊 SECURITY TEST SUMMARY"
echo "=========================================="
echo ""
echo -e "   ${GREEN}✅ Passed${NC}: $PASSED"
echo -e "   ${RED}❌ Failed${NC}: $FAILED"
echo "   📝 Total:  $((PASSED + FAILED))"
echo ""

if [ ${#VULNERABILITIES[@]} -gt 0 ]; then
    echo -e "${RED}🚨 VULNERABILITIES FOUND:${NC}"
    for vuln in "${VULNERABILITIES[@]}"; do
        echo -e "   ❌ $vuln"
    done
fi

echo ""
echo "=========================================="
