"""
IELTS Scoring API - Main Application
=====================================
API for scoring IELTS Writing and Speaking

Endpoints:
- POST /api/writing/score - Score IELTS Writing Task 2
- POST /api/speaking/score-text - Score Speaking from transcript
- POST /api/speaking/score-audio - Score Speaking from audio file (Whisper ASR)

Run:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ======================== CONFIG ========================
# Lấy đường dẫn gốc từ biến môi trường (mặc định /models cho Docker, hoặc "." cho local)
BASE_MODEL_DIR = os.getenv("MODEL_DIR", ".")

# Xây dựng đường dẫn tuyệt đối
WRITING_MODEL_DIR = os.path.join(BASE_MODEL_DIR, "ielts-writing-v3-classification")  # Classification model (12 classes)
SPEAKING_MODEL_DIR = os.path.join(BASE_MODEL_DIR, "speaking-cefr-roberta")  # New model trained on ICNALE + CEFR-Explorer
ENABLE_WHISPER = True  # Set to False to disable Whisper (saves memory)

# Writing model band classes (for classification)
WRITING_BAND_CLASSES = [3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]
WRITING_IDX_TO_BAND = {i: band for i, band in enumerate(WRITING_BAND_CLASSES)}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Speaking constants
CEFR_LABELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
ID2LABEL = {i: lbl for i, lbl in enumerate(CEFR_LABELS)}
CEFR_TO_IELTS = {
    "A1": 2.5, "A2": 3.5, "B1": 5.0,
    "B2": 6.5, "C1": 7.5, "C2": 8.5
}


# ======================== MODEL MANAGERS (Best Practice: Lazy Loading) ========================
class ModelManager:
    """Singleton model manager for lazy loading and caching models."""
    
    _writing_model = None
    _writing_tokenizer = None
    _speaking_model = None
    _speaking_tokenizer = None
    _whisper_service = None
    _speaking_available = None  # None = not checked, True/False = result
    
    @classmethod
    def get_writing_model(cls):
        if cls._writing_model is None:
            logger.info("📚 Loading Writing Model...")
            cls._writing_tokenizer = AutoTokenizer.from_pretrained(WRITING_MODEL_DIR)
            cls._writing_model = AutoModelForSequenceClassification.from_pretrained(
                WRITING_MODEL_DIR
            ).to(device)
            cls._writing_model.eval()
            logger.info("✅ Writing Model loaded!")
        return cls._writing_model, cls._writing_tokenizer
    
    @classmethod
    def get_speaking_model(cls):
        if cls._speaking_available is None:
            # Check if model exists
            cls._speaking_available = os.path.exists(SPEAKING_MODEL_DIR)
        
        if not cls._speaking_available:
            raise FileNotFoundError(
                f"Speaking model not found at '{SPEAKING_MODEL_DIR}'. "
                f"Train it first using: python train_speaking_level.py"
            )
        
        if cls._speaking_model is None:
            logger.info("📚 Loading Speaking Model...")
            cls._speaking_tokenizer = AutoTokenizer.from_pretrained(SPEAKING_MODEL_DIR)
            cls._speaking_model = AutoModelForSequenceClassification.from_pretrained(
                SPEAKING_MODEL_DIR
            ).to(device)
            cls._speaking_model.eval()
            logger.info("✅ Speaking Model loaded!")
        return cls._speaking_model, cls._speaking_tokenizer
    
    @classmethod
    def is_speaking_available(cls):
        if cls._speaking_available is None:
            cls._speaking_available = os.path.exists(SPEAKING_MODEL_DIR)
        return cls._speaking_available
    
    @classmethod
    def get_whisper_service(cls):
        if cls._whisper_service is None and ENABLE_WHISPER:
            try:
                from services.speech_service import whisper_manager, preload_model
                logger.info("🎤 Loading Whisper Model...")
                preload_model()
                cls._whisper_service = whisper_manager
                logger.info("✅ Whisper Model loaded!")
            except ImportError as e:
                logger.warning(f"⚠️ Whisper not available: {e}")
                cls._whisper_service = None
        return cls._whisper_service


# ======================== LIFESPAN (Best Practice: Startup/Shutdown) ========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Preload models on startup for faster first request.
    """
    logger.info("🚀 Starting IELTS Scoring API...")
    logger.info(f"📊 Device: {device}")
    
    # Preload models on startup
    ModelManager.get_writing_model()
    
    # Speaking model (optional - may not exist)
    if ModelManager.is_speaking_available():
        ModelManager.get_speaking_model()
    else:
        logger.warning("⚠️ Speaking model not found. Train it using: python train_speaking_level.py")
    
    if ENABLE_WHISPER:
        ModelManager.get_whisper_service()
    
    logger.info("✅ API ready! (Some models may be unavailable)")
    
    yield  # Server is running
    
    # Cleanup on shutdown
    logger.info("👋 Shutting down IELTS Scoring API...")


# ======================== FASTAPI APP ========================
app = FastAPI(
    title="IELTS Scoring API",
    description="""
    🎯 **IELTS Scoring API** - AI-powered scoring for Writing and Speaking

    ## Features
    - ✍️ **Writing Scoring**: Score IELTS Task 2 essays (Band 0-9)
    - 🎤 **Speaking Scoring**: Score speaking from text or audio
    - 🎙️ **Speech-to-Text**: Whisper-powered transcription

    ## Models
    - Writing: Fine-tuned RoBERTa on IELTS essays
    - Speaking: Fine-tuned DistilRoBERTa for CEFR classification
    - ASR: OpenAI Whisper (base model)
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================== REQUEST/RESPONSE MODELS ========================
class WritingRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Essay prompt/question (optional)")
    essay: str = Field(..., min_length=50, description="Essay text to score")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "prompt": "Some people believe technology has made our lives more complicated. To what extent do you agree?",
                "essay": "In today's rapidly evolving world, technology has become an integral part of our daily lives. While some argue that it has simplified many aspects of life, others believe it has added unnecessary complexity. This essay will discuss both perspectives before presenting my own view..."
            }]
        }
    }


class WritingResponse(BaseModel):
    overall_band: float = Field(..., ge=3.5, le=9, description="IELTS band score (3.5-9.0)")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence in prediction")
    top_predictions: list = Field(..., description="Top 3 predictions with probabilities")
    feedback: dict = Field(..., description="Feedback for 4 criteria")


class SpeakingTextRequest(BaseModel):
    answer_text: str = Field(..., min_length=10, description="Speaking answer transcript")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "answer_text": "Well, I think technology has changed our lives in many ways. For example, smartphones allow us to communicate with people around the world instantly. Also, we can access information very quickly through the internet."
            }]
        }
    }


class SpeakingTextResponse(BaseModel):
    cefr_level: str = Field(..., description="CEFR level (A1-C2)")
    approx_ielts_band: float = Field(..., description="Approximate IELTS band")
    feedback: dict = Field(..., description="Feedback for 4 criteria")


class SpeakingAudioResponse(BaseModel):
    transcript: str = Field(..., description="Transcribed text from audio")
    transcript_info: dict = Field(..., description="Transcription metadata")
    cefr_level: str = Field(..., description="CEFR level (A1-C2)")
    approx_ielts_band: float = Field(..., description="Approximate IELTS band")
    feedback: dict = Field(..., description="Feedback for 4 criteria")


class TranscribeResponse(BaseModel):
    text: str = Field(..., description="Transcribed text")
    language: str = Field(..., description="Detected language")
    duration_seconds: float = Field(..., description="Audio duration")
    word_count: int = Field(..., description="Number of words")


class ErrorResponse(BaseModel):
    error: str
    detail: str


# ======================== PREDICTION FUNCTIONS ========================
def predict_writing_band(essay: str) -> dict:
    """
    Predict IELTS Writing band score using RoBERTa Classification model.
    
    Model trained on IELTS Writing Task 2 essays dataset.
    Performance: 37.7% exact, 70.6% within ±0.5, 87.4% within ±1.0
    
    Returns:
        dict with 'band', 'confidence', and 'top_predictions'
    """
    model, tokenizer = ModelManager.get_writing_model()
    
    enc = tokenizer(
        essay,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding="max_length",
    ).to(device)

    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits.detach().cpu().numpy()[0]
        
        # Apply softmax for probabilities
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        # Get predicted class
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])
        
        # Get top 3 predictions
        top_indices = np.argsort(probs)[::-1][:3]
        top_predictions = [
            {"band": WRITING_IDX_TO_BAND[idx], "probability": float(probs[idx])}
            for idx in top_indices
        ]
    
    return {
        "band": WRITING_IDX_TO_BAND[pred_idx],
        "confidence": confidence,
        "top_predictions": top_predictions
    }


def predict_cefr_and_band(text: str) -> tuple[str, float]:
    """Predict CEFR level (A1-C2) and approximate IELTS Speaking band"""
    model, tokenizer = ModelManager.get_speaking_model()
    
    enc = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding="max_length",
    ).to(device)

    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits.detach().cpu().numpy()
        pred_id = int(np.argmax(logits, axis=-1)[0])

    cefr = ID2LABEL[pred_id]
    band = CEFR_TO_IELTS.get(cefr, 0.0)
    return cefr, band


# ======================== FEEDBACK BUILDERS ========================
def build_writing_feedback(band: float) -> dict:
    """Generate rule-based feedback for Writing based on band score"""
    if band < 5.0:
        return {
            "task_response": "Bài viết chưa trả lời đầy đủ yêu cầu đề bài. Hãy tập trung hiểu rõ câu hỏi và đưa ra các ý chính liên quan.",
            "coherence_cohesion": "Cấu trúc bài cần cải thiện. Sử dụng các đoạn văn rõ ràng với câu chủ đề và từ nối.",
            "vocabulary": "Vốn từ vựng còn hạn chế. Cần học thêm từ vựng theo chủ đề và các cụm từ cố định (collocations).",
            "grammar": "Nhiều lỗi ngữ pháp ảnh hưởng đến ý nghĩa. Cần luyện tập các cấu trúc câu cơ bản và các thì phổ biến."
        }
    elif band < 5.5:
        return {
            "task_response": "Bài viết đã đề cập đến yêu cầu đề nhưng chưa đầy đủ. Hãy mở rộng ý tưởng với các ví dụ cụ thể và chi tiết hơn.",
            "coherence_cohesion": "Cấu trúc bài cần cải thiện. Mỗi đoạn văn cần có câu chủ đề rõ ràng và các câu hỗ trợ. Sử dụng đa dạng hơn các từ nối như 'furthermore', 'however', 'consequently'.",
            "vocabulary": "Vốn từ cơ bản, có xu hướng lặp lại. Hãy học thêm synonyms và các cụm từ học thuật như 'it is widely believed that', 'there is a growing concern about'.",
            "grammar": "Lỗi ngữ pháp xuất hiện khá thường xuyên. Cần chú ý đến subject-verb agreement, article usage, và các thì động từ."
        }
    elif band < 6.5:
        return {
            "task_response": "Bạn đã trả lời được yêu cầu đề bài nhưng một số điểm có thể phát triển thêm với ví dụ cụ thể hơn.",
            "coherence_cohesion": "Bài viết có tổ chức hợp lý nhưng có thể cải thiện cách chia đoạn. Sử dụng đa dạng hơn các từ nối và tránh lặp lại 'firstly, secondly, thirdly'.",
            "vocabulary": "Vốn từ đủ dùng cho bài viết. Hãy thử dùng từ ngữ phức tạp hơn như collocations và idiomatic expressions.",
            "grammar": "Ngữ pháp khá tốt với một số lỗi nhỏ. Cần luyện thêm các cấu trúc câu phức tạp như relative clauses, conditionals, và passive voice."
        }
    elif band < 7.5:
        return {
            "task_response": "Bài viết phát triển tốt với quan điểm rõ ràng và các ý tưởng mở rộng, liên quan. Để đạt band cao hơn, cần có phân tích sâu sắc hơn.",
            "coherence_cohesion": "Tổ chức logic với việc sử dụng hiệu quả các phương tiện liên kết. Có thể cải thiện bằng cách sử dụng referencing pronouns và lexical cohesion.",
            "vocabulary": "Vốn từ phong phú và đa dạng. Tiếp tục mở rộng academic vocabulary và less common lexical items.",
            "grammar": "Sử dụng đa dạng cấu trúc ngữ pháp với độ chính xác cao. Có thể thử thêm inversions và cleft sentences."
        }
    else:
        return {
            "task_response": "Bài viết xuất sắc với phân tích sâu sắc và lập luận chặt chẽ. Ý tưởng được phát triển đầy đủ và có tính thuyết phục.",
            "coherence_cohesion": "Tổ chức hoàn hảo với sự chuyển tiếp mượt mà giữa các ý. Sử dụng thành thạo các phương tiện liên kết.",
            "vocabulary": "Vốn từ phong phú, chính xác và tự nhiên. Sử dụng thành thạo idioms, collocations và academic vocabulary.",
            "grammar": "Sử dụng đa dạng và linh hoạt các cấu trúc ngữ pháp phức tạp với độ chính xác gần như hoàn hảo."
        }


def build_speaking_feedback(cefr: str, band: float) -> dict:
    """Generate rule-based feedback for Speaking based on CEFR level and band"""
    if band < 5.0:
        return {
            "fluency_coherence": "Tốc độ nói còn chậm với nhiều lần dừng. Hãy luyện nói liên tục hơn về các chủ đề quen thuộc.",
            "vocabulary": "Vốn từ còn hạn chế. Cần học thêm các cụm diễn đạt hàng ngày và từ vựng theo chủ đề.",
            "grammar": "Còn nhiều lỗi ngữ pháp cơ bản. Tập trung luyện các thì hiện tại, quá khứ và tương lai đơn.",
            "pronunciation": "Phát âm có thể gây khó hiểu cho người nghe. Luyện tập phát âm từng âm và trọng âm từ."
        }
    elif band < 6.5:
        return {
            "fluency_coherence": "Bạn có thể duy trì bài nói về chủ đề quen thuộc với một chút do dự. Sử dụng thêm các từ nối.",
            "vocabulary": "Vốn từ tốt cho các chủ đề quen thuộc. Mở rộng thêm các cụm diễn đạt và collocations.",
            "grammar": "Kiểm soát tốt các cấu trúc đơn giản. Luyện thêm câu phức và câu điều kiện.",
            "pronunciation": "Phát âm khá rõ ràng. Cần cải thiện ngữ điệu và cách nối âm."
        }
    else:
        return {
            "fluency_coherence": "Bạn nói trôi chảy, chỉ thỉnh thoảng do dự. Sử dụng tuyệt vời các từ nối.",
            "vocabulary": "Vốn từ phong phú với việc sử dụng tốt thành ngữ và collocations.",
            "grammar": "Kiểm soát nhất quán các cấu trúc phức tạp, chỉ thỉnh thoảng có lỗi nhỏ.",
            "pronunciation": "Phát âm rõ ràng, tự nhiên với việc kiểm soát tốt trọng âm và ngữ điệu."
        }


# ======================== EXCEPTION HANDLERS ========================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )


# ======================== API ENDPOINTS ========================

# ---------- Health & Info ----------
@app.get("/", tags=["Health"])
def root():
    """API root - health check and endpoint info"""
    return {
        "message": "🎯 IELTS Scoring API is running!",
        "version": "2.0.0",
        "endpoints": {
            "writing": "POST /api/writing/score",
            "speaking_text": "POST /api/speaking/score-text",
            "speaking_audio": "POST /api/speaking/score-audio",
            "transcribe": "POST /api/transcribe",
            "docs": "GET /docs"
        }
    }


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check with model status"""
    whisper_status = False
    if ENABLE_WHISPER:
        try:
            from services.speech_service import get_whisper_info
            whisper_info = get_whisper_info()
            whisper_status = True
        except:
            whisper_info = {"error": "Whisper not available"}
    else:
        whisper_info = {"enabled": False}
    
    return {
        "status": "healthy",
        "device": str(device),
        "models": {
            "writing": True,
            "speaking": True,
            "whisper": whisper_status
        },
        "whisper_info": whisper_info
    }


# ---------- Writing Endpoints ----------
@app.post(
    "/api/writing/score",
    response_model=WritingResponse,
    tags=["Writing"],
    summary="Score IELTS Writing Task 2",
    responses={400: {"model": ErrorResponse}}
)
def score_writing(req: WritingRequest):
    """
    Score an IELTS Writing Task 2 essay.
    
    - **prompt**: (optional) The essay question
    - **essay**: The essay text (min 50 characters)
    
    Returns:
    - **overall_band**: Band score from 3.5 to 9.0
    - **confidence**: Model confidence in prediction
    - **feedback**: Feedback for Task Response, Coherence, Vocabulary, Grammar
    
    Model Performance:
    - Exact match: 37.7%
    - Within ±0.5: 70.6%
    - Within ±1.0: 87.4%
    """
    try:
        result = predict_writing_band(req.essay)
        band = result["band"]
        feedback = build_writing_feedback(band)
        return {
            "overall_band": band,
            "confidence": result["confidence"],
            "top_predictions": result["top_predictions"],
            "feedback": feedback
        }
    except Exception as e:
        logger.error(f"Writing scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Speaking Endpoints ----------
@app.post(
    "/api/speaking/score-text",
    response_model=SpeakingTextResponse,
    tags=["Speaking"],
    summary="Score Speaking from transcript"
)
def score_speaking_text(req: SpeakingTextRequest):
    """
    Score IELTS Speaking from text transcript.
    
    - **answer_text**: The speaking answer transcript
    
    Returns:
    - **cefr_level**: CEFR level (A1-C2)
    - **approx_ielts_band**: Approximate IELTS band
    - **feedback**: Feedback for Fluency, Vocabulary, Grammar, Pronunciation
    """
    try:
        cefr, band = predict_cefr_and_band(req.answer_text)
        feedback = build_speaking_feedback(cefr, band)
        return {
            "cefr_level": cefr,
            "approx_ielts_band": band,
            "feedback": feedback
        }
    except Exception as e:
        logger.error(f"Speaking scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/api/speaking/score-audio",
    response_model=SpeakingAudioResponse,
    tags=["Speaking"],
    summary="Score Speaking from audio file",
    responses={
        400: {"model": ErrorResponse},
        503: {"description": "Whisper not available"}
    }
)
async def score_speaking_audio(
    audio: UploadFile = File(..., description="Audio file (mp3, wav, m4a, etc.)"),
    language: str = Query("en", description="Audio language code")
):
    """
    Score IELTS Speaking from audio file using Whisper ASR.
    
    1. Transcribes audio to text using Whisper
    2. Scores the transcript using CEFR model
    3. Returns transcript, CEFR level, IELTS band, and feedback
    
    **Supported formats**: mp3, wav, m4a, flac, ogg, webm, mp4  
    **Max file size**: 25MB  
    **Max duration**: 5 minutes
    """
    if not ENABLE_WHISPER:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-text is disabled. Set ENABLE_WHISPER=True to enable."
        )
    
    try:
        from services.speech_service import (
            transcribe_audio_bytes,
            AudioValidationError
        )
        
        # Read audio file
        audio_bytes = await audio.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Transcribe
        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=audio.filename or "audio.wav",
            language=language,
            include_segments=False
        )
        
        transcript = result.text
        
        if not transcript or len(transcript.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Could not extract meaningful text from audio. Please ensure clear speech."
            )
        
        # Score the transcript
        cefr, band = predict_cefr_and_band(transcript)
        feedback = build_speaking_feedback(cefr, band)
        
        return {
            "transcript": transcript,
            "transcript_info": {
                "language": result.language,
                "duration_seconds": result.duration,
                "word_count": len(transcript.split()),
                "confidence": result.confidence
            },
            "cefr_level": cefr,
            "approx_ielts_band": band,
            "feedback": feedback
        }
        
    except AudioValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio scoring error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {e}")


# ---------- Transcription Endpoint ----------
@app.post(
    "/api/transcribe",
    response_model=TranscribeResponse,
    tags=["Speech-to-Text"],
    summary="Transcribe audio to text",
    responses={
        400: {"model": ErrorResponse},
        503: {"description": "Whisper not available"}
    }
)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Query("en", description="Audio language code (e.g., 'en', 'vi')")
):
    """
    Transcribe audio file to text using Whisper ASR.
    
    **Supported formats**: mp3, wav, m4a, flac, ogg, webm, mp4  
    **Max file size**: 25MB  
    **Max duration**: 5 minutes
    """
    if not ENABLE_WHISPER:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-text is disabled"
        )
    
    try:
        from services.speech_service import (
            transcribe_audio_bytes,
            AudioValidationError
        )
        
        audio_bytes = await audio.read()
        
        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=audio.filename or "audio.wav",
            language=language
        )
        
        return {
            "text": result.text,
            "language": result.language,
            "duration_seconds": result.duration,
            "word_count": len(result.text.split())
        }
        
    except AudioValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================== RUN SERVER ========================
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 IELTS Scoring API Server")
    print("="*60)
    print(f"📊 Device: {device}")
    print(f"🎤 Whisper: {'Enabled' if ENABLE_WHISPER else 'Disabled'}")
    print("\n📖 API Docs: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
