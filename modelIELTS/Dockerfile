# IELTS Scoring API - Docker Image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies + gdown để tải model từ Google Drive
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gdown

# Copy application code
COPY app.py .
COPY services/ ./services/

# Copy entrypoint script và cấp quyền thực thi
COPY entrypoint.sh .
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Health check - kiểm tra file config model tồn tại
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD python -c "import os; exit(0 if os.path.exists('/models/ielts-writing-v3-classification/config.json') else 1)"

# Sử dụng entrypoint.sh để tải model trước khi chạy app
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
