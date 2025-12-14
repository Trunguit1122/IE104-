"""
Speech-to-Text Service Module (Whisper ASR)
============================================
Service for transcribing audio files to text using OpenAI's Whisper model.

Best Practices Applied:
- Singleton pattern for model loading (load once, use many)
- Async file handling for better performance
- Proper audio format validation
- Automatic audio preprocessing (resampling, mono conversion)
- Memory-efficient temp file cleanup
- Comprehensive error handling
- Configurable model size (tiny, base, small, medium, large)
"""

import os
import tempfile
import logging
from pathlib import Path
from typing import Optional, Tuple, Literal
from contextlib import contextmanager

import whisper
import torch
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ======================== CONFIG ========================
WHISPER_MODEL_SIZE: Literal["tiny", "base", "small", "medium", "large"] = "base"
SUPPORTED_AUDIO_FORMATS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"}
MAX_AUDIO_DURATION_SECONDS = 300  # 5 minutes max
SAMPLE_RATE = 16000  # Whisper expects 16kHz audio

# ======================== SINGLETON MODEL LOADER ========================
class WhisperModelManager:
    """
    Singleton manager for Whisper model.
    Ensures model is loaded only once and reused across requests.
    """
    _instance: Optional["WhisperModelManager"] = None
    _model: Optional[whisper.Whisper] = None
    _model_size: str = WHISPER_MODEL_SIZE
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def model(self) -> whisper.Whisper:
        if self._model is None:
            self._load_model()
        return self._model
    
    def _load_model(self) -> None:
        """Load Whisper model with optimal device selection."""
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🎤 Loading Whisper model '{self._model_size}' on {device}...")
        
        try:
            self._model = whisper.load_model(self._model_size, device=device)
            logger.info(f"✅ Whisper model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load Whisper model: {e}")
            raise RuntimeError(f"Failed to load Whisper model: {e}")
    
    def change_model_size(self, size: str) -> None:
        """Change model size and reload."""
        if size not in ["tiny", "base", "small", "medium", "large"]:
            raise ValueError(f"Invalid model size: {size}")
        
        if size != self._model_size:
            self._model_size = size
            self._model = None  # Force reload
            logger.info(f"🔄 Model size changed to '{size}'. Will reload on next use.")
    
    @property
    def device(self) -> str:
        return "cuda" if torch.cuda.is_available() else "cpu"
    
    @property
    def model_size(self) -> str:
        return self._model_size


# Global instance
whisper_manager = WhisperModelManager()


# ======================== AUDIO VALIDATION ========================
class AudioValidationError(Exception):
    """Custom exception for audio validation errors."""
    pass


def validate_audio_file(file_path: str) -> None:
    """
    Validate audio file before processing.
    
    Args:
        file_path: Path to the audio file
        
    Raises:
        AudioValidationError: If validation fails
    """
    path = Path(file_path)
    
    # Check if file exists
    if not path.exists():
        raise AudioValidationError(f"Audio file not found: {file_path}")
    
    # Check file extension
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_AUDIO_FORMATS:
        raise AudioValidationError(
            f"Unsupported audio format: {suffix}. "
            f"Supported formats: {', '.join(SUPPORTED_AUDIO_FORMATS)}"
        )
    
    # Check file size (max 25MB)
    max_size_bytes = 25 * 1024 * 1024
    file_size = path.stat().st_size
    if file_size > max_size_bytes:
        raise AudioValidationError(
            f"Audio file too large: {file_size / 1024 / 1024:.1f}MB. "
            f"Maximum size: 25MB"
        )
    
    # Check if file is not empty
    if file_size == 0:
        raise AudioValidationError("Audio file is empty")


def get_audio_duration(file_path: str) -> float:
    """
    Get duration of audio file in seconds.
    
    Args:
        file_path: Path to the audio file
        
    Returns:
        Duration in seconds
    """
    try:
        audio = whisper.load_audio(file_path)
        duration = len(audio) / SAMPLE_RATE
        return duration
    except Exception as e:
        logger.warning(f"Could not determine audio duration: {e}")
        return 0.0


# ======================== TEMP FILE MANAGEMENT ========================
@contextmanager
def temp_audio_file(content: bytes, suffix: str = ".wav"):
    """
    Context manager for handling temporary audio files.
    Ensures proper cleanup after use.
    
    Args:
        content: Audio file content as bytes
        suffix: File extension
        
    Yields:
        Path to temporary file
    """
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        yield temp_path
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_path}: {e}")


# ======================== TRANSCRIPTION ========================
class TranscriptionResult:
    """Data class for transcription results."""
    
    def __init__(
        self,
        text: str,
        language: str,
        duration: float,
        segments: list = None,
        confidence: float = None
    ):
        self.text = text
        self.language = language
        self.duration = duration
        self.segments = segments or []
        self.confidence = confidence
    
    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "language": self.language,
            "duration_seconds": round(self.duration, 2),
            "word_count": len(self.text.split()),
            "segments": [
                {
                    "start": seg.get("start"),
                    "end": seg.get("end"),
                    "text": seg.get("text", "").strip()
                }
                for seg in self.segments
            ] if self.segments else [],
            "confidence": self.confidence
        }


def transcribe_audio(
    file_path: str,
    language: str = "en",
    task: Literal["transcribe", "translate"] = "transcribe",
    include_segments: bool = False
) -> TranscriptionResult:
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        file_path: Path to the audio file
        language: Language code (e.g., 'en', 'vi')
        task: 'transcribe' or 'translate' (translate to English)
        include_segments: Whether to include word-level segments
        
    Returns:
        TranscriptionResult object
    """
    # Validate audio file
    validate_audio_file(file_path)
    
    # Check duration
    duration = get_audio_duration(file_path)
    if duration > MAX_AUDIO_DURATION_SECONDS:
        raise AudioValidationError(
            f"Audio too long: {duration:.1f}s. "
            f"Maximum duration: {MAX_AUDIO_DURATION_SECONDS}s"
        )
    
    logger.info(f"🎙️ Transcribing audio ({duration:.1f}s)...")
    
    # Get model
    model = whisper_manager.model
    
    # Transcribe
    try:
        result = model.transcribe(
            file_path,
            language=language,
            task=task,
            verbose=False,
            fp16=torch.cuda.is_available(),  # Use FP16 on GPU
        )
        
        text = result.get("text", "").strip()
        detected_language = result.get("language", language)
        segments = result.get("segments", []) if include_segments else []
        
        # Calculate average confidence from segments
        confidence = None
        if segments:
            probs = [seg.get("no_speech_prob", 0) for seg in segments]
            if probs:
                confidence = 1.0 - (sum(probs) / len(probs))
        
        logger.info(f"✅ Transcription complete: {len(text.split())} words")
        
        return TranscriptionResult(
            text=text,
            language=detected_language,
            duration=duration,
            segments=segments,
            confidence=confidence
        )
        
    except Exception as e:
        logger.error(f"❌ Transcription failed: {e}")
        raise RuntimeError(f"Transcription failed: {e}")


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: str = "en",
    task: Literal["transcribe", "translate"] = "transcribe",
    include_segments: bool = False
) -> TranscriptionResult:
    """
    Async version: Transcribe audio from bytes.
    
    Args:
        audio_bytes: Audio file content as bytes
        filename: Original filename (for extension)
        language: Language code
        task: 'transcribe' or 'translate'
        include_segments: Whether to include segments
        
    Returns:
        TranscriptionResult object
    """
    # Get file extension from filename
    suffix = Path(filename).suffix.lower() or ".wav"
    
    # Validate extension
    if suffix not in SUPPORTED_AUDIO_FORMATS:
        raise AudioValidationError(
            f"Unsupported audio format: {suffix}. "
            f"Supported: {', '.join(SUPPORTED_AUDIO_FORMATS)}"
        )
    
    # Use temp file for processing
    with temp_audio_file(audio_bytes, suffix=suffix) as temp_path:
        return transcribe_audio(
            temp_path,
            language=language,
            task=task,
            include_segments=include_segments
        )


# ======================== UTILITY FUNCTIONS ========================
def get_whisper_info() -> dict:
    """Get information about current Whisper configuration."""
    return {
        "model_size": whisper_manager.model_size,
        "device": whisper_manager.device,
        "supported_formats": list(SUPPORTED_AUDIO_FORMATS),
        "max_duration_seconds": MAX_AUDIO_DURATION_SECONDS,
        "max_file_size_mb": 25,
        "model_loaded": whisper_manager._model is not None
    }


def preload_model() -> None:
    """Preload Whisper model to avoid cold start latency."""
    _ = whisper_manager.model


# ======================== CLI TESTING ========================
if __name__ == "__main__":
    import sys
    
    print("="*50)
    print("Whisper Speech-to-Text Service Test")
    print("="*50)
    
    # Print info
    info = get_whisper_info()
    print(f"\n📊 Configuration:")
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    # Preload model
    print("\n🔄 Preloading model...")
    preload_model()
    
    # Test with sample audio if provided
    if len(sys.argv) > 1:
        audio_path = sys.argv[1]
        print(f"\n🎤 Testing with: {audio_path}")
        
        try:
            result = transcribe_audio(audio_path, include_segments=True)
            print(f"\n📝 Transcription Result:")
            print(f"   Text: {result.text}")
            print(f"   Language: {result.language}")
            print(f"   Duration: {result.duration:.2f}s")
            print(f"   Word count: {len(result.text.split())}")
            if result.confidence:
                print(f"   Confidence: {result.confidence:.2%}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\n💡 To test: python speech_service.py <audio_file>")
    
    print("\n✅ Service ready!")
