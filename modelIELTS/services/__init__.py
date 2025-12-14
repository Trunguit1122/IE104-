"""
IELTS Scoring Services
======================
This package provides scoring services for IELTS Writing and Speaking.
"""

# Writing service - always available
from .writing_service import predict_writing_band, build_writing_feedback, score_writing

# Speaking service - lazy loaded (model may not exist)
try:
    from .speaking_service import predict_cefr_and_band, build_speaking_feedback, score_speaking
    SPEAKING_AVAILABLE = True
except FileNotFoundError:
    SPEAKING_AVAILABLE = False
    predict_cefr_and_band = None
    build_speaking_feedback = None
    score_speaking = None

# Speech-to-text (optional, requires whisper)
try:
    from .speech_service import (
        transcribe_audio,
        transcribe_audio_bytes,
        get_whisper_info,
        preload_model,
        AudioValidationError,
        TranscriptionResult,
        whisper_manager
    )
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    transcribe_audio = None
    transcribe_audio_bytes = None
    get_whisper_info = None
    preload_model = None
    AudioValidationError = None
    TranscriptionResult = None
    whisper_manager = None

__all__ = [
    # Writing
    "predict_writing_band",
    "build_writing_feedback", 
    "score_writing",
    # Speaking
    "predict_cefr_and_band",
    "build_speaking_feedback",
    "score_speaking",
    "SPEAKING_AVAILABLE",
    # Speech-to-text
    "transcribe_audio",
    "transcribe_audio_bytes",
    "get_whisper_info",
    "preload_model",
    "AudioValidationError",
    "TranscriptionResult",
    "whisper_manager",
    "WHISPER_AVAILABLE",
]
