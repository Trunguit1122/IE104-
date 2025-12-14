/**
 * AI Scoring Service Configuration
 * Integration with modelIELTS API (https://github.com/Trunguit1122/modelIELTS)
 * 
 * The AI service provides:
 * - Writing Scoring: RoBERTa model (Band 3.5-9.0)
 * - Speaking Scoring: RoBERTa model (CEFR A1-C2 → IELTS Band)
 * - Speech-to-Text: OpenAI Whisper
 */

export const AI_SCORING_CONFIG = {
  // Base URL of the AI Scoring API
  baseUrl: process.env.AI_SCORING_API_URL || "http://localhost:8000",
  
  // API Endpoints
  endpoints: {
    health: "/health",
    writingScore: "/api/writing/score",
    speakingScoreText: "/api/speaking/score-text",
    speakingScoreAudio: "/api/speaking/score-audio",
    transcribe: "/api/transcribe",
  },
  
  // Timeout settings (in milliseconds)
  timeout: {
    writing: 60000,    // 60 seconds for writing scoring (BR52)
    speaking: 30000,   // 30 seconds for speaking scoring (BR28)
    transcribe: 120000, // 2 minutes for audio transcription
  },
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  
  // Audio constraints
  audio: {
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    maxDuration: 300, // 5 minutes in seconds
    supportedFormats: ["mp3", "wav", "flac", "m4a", "webm", "mp4", "ogg"],
  },
  
  // Writing constraints
  writing: {
    minCharacters: 50,
  },
};

/**
 * CEFR to IELTS Band mapping (from modelIELTS)
 */
export const CEFR_TO_IELTS: Record<string, number> = {
  A1: 2.5,
  A2: 3.5,
  B1: 5.0,
  B2: 6.0,
  C1: 7.5,
  C2: 8.5,
};

/**
 * Get IELTS band from CEFR level
 */
export function cefrToIeltsBand(cefrLevel: string): number {
  return CEFR_TO_IELTS[cefrLevel.toUpperCase()] || 5.0;
}

