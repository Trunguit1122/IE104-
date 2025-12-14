#!/bin/bash

# 🔍 Script test scoring flow
# Usage: ./test-scoring-api.sh <attemptId> [token]

ATTEMPT_ID=$1
TOKEN=$2
BASE_URL="http://localhost:3000/api"

if [ -z "$ATTEMPT_ID" ]; then
    echo "❌ Usage: ./test-scoring-api.sh <attemptId> [token]"
    echo "Example: ./test-scoring-api.sh abc-123-def your-jwt-token"
    exit 1
fi

echo "🔍 Testing Scoring Flow for attemptId: $ATTEMPT_ID"
echo "================================================"

# Step 1: Check attempt status
echo ""
echo "📌 Step 1: Check Attempt Status"
echo "GET $BASE_URL/attempts/$ATTEMPT_ID"
if [ -n "$TOKEN" ]; then
    curl -s -X GET "$BASE_URL/attempts/$ATTEMPT_ID" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
else
    curl -s -X GET "$BASE_URL/attempts/$ATTEMPT_ID" | jq '.'
fi

# Step 2: Get scoring job by attemptId
echo ""
echo "📌 Step 2: Get Scoring Job"
echo "GET $BASE_URL/scoring-jobs/attempt/$ATTEMPT_ID"
if [ -n "$TOKEN" ]; then
    SCORING_JOB=$(curl -s -X GET "$BASE_URL/scoring-jobs/attempt/$ATTEMPT_ID" \
        -H "Authorization: Bearer $TOKEN")
else
    SCORING_JOB=$(curl -s -X GET "$BASE_URL/scoring-jobs/attempt/$ATTEMPT_ID")
fi

echo "$SCORING_JOB" | jq '.'

# Extract jobId
JOB_ID=$(echo "$SCORING_JOB" | jq -r '.id // empty')

if [ -z "$JOB_ID" ]; then
    echo "❌ No scoring job found for this attempt!"
    exit 1
fi

echo ""
echo "✅ Found scoring job: $JOB_ID"
echo "   Status: $(echo "$SCORING_JOB" | jq -r '.status')"
echo "   Created: $(echo "$SCORING_JOB" | jq -r '.createdAt')"
echo "   Error: $(echo "$SCORING_JOB" | jq -r '.errorMessage // "none"')"

# Step 3: Check if job is stuck in QUEUED
STATUS=$(echo "$SCORING_JOB" | jq -r '.status')
if [ "$STATUS" = "queued" ]; then
    echo ""
    echo "⚠️  Job is QUEUED - Manually triggering..."
    echo "POST $BASE_URL/scoring/trigger-job/$JOB_ID"
    
    TRIGGER_RESULT=$(curl -s -X POST "$BASE_URL/scoring/trigger-job/$JOB_ID")
    echo "$TRIGGER_RESULT" | jq '.'
    
    if [ "$(echo "$TRIGGER_RESULT" | jq -r '.success')" = "true" ]; then
        echo "✅ Job triggered successfully!"
    else
        echo "❌ Failed to trigger job: $(echo "$TRIGGER_RESULT" | jq -r '.message')"
    fi
fi

# Step 4: Check scoring result
echo ""
echo "📌 Step 3: Check Scoring Result"
echo "GET $BASE_URL/scoring/result/$ATTEMPT_ID"
if [ -n "$TOKEN" ]; then
    curl -s -X GET "$BASE_URL/scoring/result/$ATTEMPT_ID" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
else
    curl -s -X GET "$BASE_URL/scoring/result/$ATTEMPT_ID" | jq '.'
fi

echo ""
echo "================================================"
echo "✅ Test completed!"

