# Environment Variables

Complete list of environment variables for LingoLab Backend.

## Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=54321
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lingolab_db

# Server
PORT=3000
NODE_ENV=development

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRY=900      # 15 minutes in seconds
JWT_REFRESH_EXPIRY=604800  # 7 days in seconds
```

## Email Configuration (SMTP)

```env
# For Mailtrap (Development)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_SECURE=false
SMTP_FROM_NAME=LingoLab
SMTP_FROM_EMAIL=noreply@lingolab.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

## Storage Configuration

```env
# Storage type: "local" or "s3"
STORAGE_TYPE=local
UPLOAD_PATH=uploads
UPLOAD_BASE_URL=/uploads

# For S3/MinIO (if STORAGE_TYPE=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=lingolab-uploads
S3_ENDPOINT=http://localhost:9000  # For MinIO
```

## AI Scoring Service

```env
AI_SCORING_URL=http://localhost:5000
```

## Security Settings

```env
# CORS
CORS_ORIGIN=http://localhost:5173

# TypeORM
TYPEORM_LOGGING=false
```

## Rate Limiting (Built-in, no env needed)

Default limits:
- General API: 100 requests/minute
- Authentication: 10 requests/minute
- Login: 5 requests/minute
- Password Reset: 3 requests/15 minutes
- File Upload: 20 requests/hour
- AI Scoring: 10 requests/5 minutes
- Export: 5 requests/hour

## Example .env File

```env
# ===========================================
# DATABASE
# ===========================================
DB_HOST=localhost
DB_PORT=54321
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lingolab_db

# ===========================================
# SERVER
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# JWT SECURITY
# ===========================================
JWT_SECRET=change-this-in-production-use-long-random-string
JWT_REFRESH_SECRET=another-long-random-string-for-refresh

# ===========================================
# EMAIL (Mailtrap for development)
# ===========================================
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=LingoLab
SMTP_FROM_EMAIL=noreply@lingolab.com
FRONTEND_URL=http://localhost:5173

# ===========================================
# STORAGE
# ===========================================
STORAGE_TYPE=local
UPLOAD_PATH=uploads

# ===========================================
# AI SCORING
# ===========================================
AI_SCORING_URL=http://localhost:5000

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:5173
```






