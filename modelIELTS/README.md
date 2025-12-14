# 🎯 IELTS Scoring API

API chấm điểm IELTS Writing và Speaking sử dụng AI (Transformer models).

---

## 🚀 Hướng dẫn chạy

### Yêu cầu
- [Docker](https://docs.docker.com/get-docker/) đã cài đặt
- Kết nối Internet (để tải model lần đầu)

### Bước 1: Clone repo

```bash
git clone <repo-url>
cd modelAI
```

### Bước 2: Chạy với Docker

```bash
docker compose up --build
```

### Bước 3: Đợi tải model

⏳ **Lần đầu tiên** sẽ mất 2-5 phút để tải model từ Google Drive (~500MB)

Khi thấy log như này là đã sẵn sàng:
```
✅ Model ielts-writing-v3-classification already exists
✅ Model speaking-cefr-roberta already exists
🚀 Starting IELTS Scoring API...
✅ API ready!
```

### Bước 4: Truy cập API

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📖 Sử dụng API

### 1. Chấm điểm Writing

**Endpoint**: `POST /api/writing/score`

```bash
curl -X POST http://localhost:8000/api/writing/score \
  -H "Content-Type: application/json" \
  -d '{
    "essay": "Technology has revolutionized modern education in numerous ways. Students now have access to vast online resources that were previously unavailable. This has democratized learning opportunities across different socioeconomic backgrounds. However, there are concerns about screen time and the potential for distraction. In conclusion, while technology offers significant benefits to education, it must be implemented thoughtfully to maximize its advantages."
  }'
```

**Response**:
```json
{
  "overall_band": 6.5,
  "confidence": 0.82,
  "top_predictions": [...],
  "feedback": {
    "task_response": "...",
    "coherence_cohesion": "...",
    "vocabulary": "...",
    "grammar": "..."
  }
}
```

### 2. Chấm điểm Speaking (từ text)

**Endpoint**: `POST /api/speaking/score-text`

```bash
curl -X POST http://localhost:8000/api/speaking/score-text \
  -H "Content-Type: application/json" \
  -d '{
    "answer_text": "Well, I think technology is very important in our daily life. For example, we use smartphones to communicate with friends and family. Also, the internet helps us find information quickly."
  }'
```

**Response**:
```json
{
  "cefr_level": "B1",
  "approx_ielts_band": 5.0,
  "feedback": {
    "fluency_coherence": "...",
    "vocabulary": "...",
    "grammar": "...",
    "pronunciation": "..."
  }
}
```

### 3. Chấm điểm Speaking (từ audio)

**Endpoint**: `POST /api/speaking/score-audio`

```bash
curl -X POST http://localhost:8000/api/speaking/score-audio \
  -F "audio=@your_audio.mp3" \
  -F "language=en"
```

---

## 🛠️ Các lệnh Docker hữu ích

```bash
# Chạy ở background
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng container
docker compose down

# Xóa volume (xóa cache model, lần sau phải tải lại)
docker compose down -v

# Build lại image
docker compose up --build
```

---

## ❓ Troubleshooting

### Container chạy nhưng không thấy API?
- Đợi 2-5 phút để model tải xong
- Kiểm tra logs: `docker compose logs -f`

### Lỗi tải model từ Google Drive?
- Kiểm tra kết nối internet
- Thử lại: `docker compose down && docker compose up --build`

### Lỗi "out of memory"?
- Container cần ít nhất 2GB RAM
- Kiểm tra Docker đã được cấp đủ RAM chưa

---

## 📁 Cấu trúc project

```
modelAI/
├── app.py              # Main API (FastAPI)
├── services/           # Speech service (Whisper ASR)
├── Dockerfile          # Docker image config
├── docker-compose.yml  # Docker Compose config  
├── entrypoint.sh       # Script tự động tải model
└── requirements.txt    # Python dependencies
```

---

## 📝 License

MIT
