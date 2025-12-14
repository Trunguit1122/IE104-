import { AI_SCORING_CONFIG, cefrToIeltsBand } from "../config/ai-scoring.config";
import { SkillType } from "../entities/Prompt";

/**
 * AI Scoring Service
 * Integrates with modelIELTS API (https://github.com/Trunguit1122/modelIELTS)
 * 
 * Provides:
 * - Writing scoring using RoBERTa model
 * - Speaking scoring using RoBERTa model  
 * - Speech-to-text using Whisper
 */

// ============ Response Types (matching modelIELTS app.py) ============

/**
 * Writing API Response
 * POST /api/writing/score
 */
export interface WritingScoringResponse {
  overall_band: number;           // 3.5 - 9.0
  confidence: number;             // 0 - 1
  top_predictions: Array<{ band: number; probability: number }>;
  feedback: {
    task_response: string;
    coherence_cohesion: string;
    vocabulary: string;
    grammar: string;
  };
}

/**
 * Speaking Text API Response
 * POST /api/speaking/score-text
 */
export interface SpeakingTextScoringResponse {
  cefr_level: string;             // A1, A2, B1, B2, C1, C2
  approx_ielts_band: number;      // Approximate IELTS band
  feedback: {
    fluency_coherence: string;
    vocabulary: string;
    grammar: string;
    pronunciation: string;
  };
}

/**
 * Speaking Audio API Response
 * POST /api/speaking/score-audio
 */
export interface SpeakingAudioScoringResponse {
  transcript: string;
  transcript_info: {
    language: string;
    duration_seconds: number;
    word_count: number;
    confidence?: number;
  };
  cefr_level: string;
  approx_ielts_band: number;
  feedback: {
    fluency_coherence: string;
    vocabulary: string;
    grammar: string;
    pronunciation: string;
  };
}

/**
 * Transcription API Response
 * POST /api/transcribe
 */
export interface TranscriptionResponse {
  text: string;
  language: string;
  duration_seconds: number;
  word_count: number;
}

/**
 * Health Check Response
 * GET /health
 */
export interface HealthCheckResponse {
  status: string;
  device: string;
  models: {
    writing: boolean;
    speaking: boolean;
    whisper: boolean;
  };
  whisper_info?: any;
}

/**
 * AI Scoring Result following IELTS band descriptors
 * 
 * Speaking: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation
 * Writing: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range
 */
export interface AIScoringResult {
  success: boolean;
  skillType: SkillType;
  
  // Overall band score (0-9, step 0.5) - BR36
  overallBand: number;
  
  // AI confidence score (0-1)
  confidence: number;
  
  // Speaking sub-scores (IELTS Speaking Band Descriptors)
  fluencyCoherence?: number;      // Fluency & Coherence
  pronunciation?: number;          // Pronunciation
  
  // Writing sub-scores (IELTS Writing Band Descriptors)
  taskAchievement?: number;        // Task Achievement/Response
  coherenceCohesion?: number;      // Coherence & Cohesion
  
  // Shared sub-scores (both Speaking & Writing)
  lexicalResource?: number;        // Lexical Resource
  grammaticalRange?: number;       // Grammatical Range & Accuracy
  
  // Feedback (BR53: Strengths, Areas for Improvement, Suggestions)
  feedback: string;
  detailedFeedback: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
  
  // Transcript for speaking (from Whisper)
  transcript?: string;
  
  // Raw response for debugging
  rawResponse?: any;
  error?: string;
}

// ============ AI Scoring Service ============

export class AIScoringService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_SCORING_CONFIG.baseUrl;
  }

  /**
   * Check if AI Scoring service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${AI_SCORING_CONFIG.endpoints.health}`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error("AI Scoring service health check failed:", error);
      return false;
    }
  }

  /**
   * Get detailed health info
   */
  async getHealthInfo(): Promise<HealthCheckResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}${AI_SCORING_CONFIG.endpoints.health}`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return (await response.json()) as HealthCheckResponse;
      }
      return null;
    } catch (error) {
      console.error("AI Scoring service health check failed:", error);
      return null;
    }
  }

  /**
   * Score IELTS Writing (BR52: 60 second timeout)
   * POST /api/writing/score
   */
  async scoreWriting(essay: string, prompt?: string): Promise<AIScoringResult> {
    try {
      // Validate minimum length
      if (essay.length < AI_SCORING_CONFIG.writing.minCharacters) {
        return {
          success: false,
          skillType: SkillType.WRITING,
          overallBand: 0,
          confidence: 0,
          feedback: "Essay is too short. Please write at least 50 characters.",
          detailedFeedback: {
            strengths: [],
            areasForImprovement: ["Write at least 150-250 words"],
            suggestions: ["Develop your ideas with examples and explanations"],
          },
          error: "Essay too short",
        };
      }

      const response = await fetch(`${this.baseUrl}${AI_SCORING_CONFIG.endpoints.writingScore}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          essay,
          prompt: prompt || "",
        }),
        signal: AbortSignal.timeout(AI_SCORING_CONFIG.timeout.writing), // BR52: 60 seconds
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as WritingScoringResponse;

      // Map API response to IELTS Writing Band Descriptors (BR53)
      return {
        success: true,
        skillType: SkillType.WRITING,
        overallBand: this.roundToHalf(data.overall_band),
        confidence: data.confidence,
        // Writing sub-scores (estimated from overall band)
        taskAchievement: this.estimateSubScore(data.overall_band, data.feedback.task_response),
        coherenceCohesion: this.estimateSubScore(data.overall_band, data.feedback.coherence_cohesion),
        lexicalResource: this.estimateSubScore(data.overall_band, data.feedback.vocabulary),
        grammaticalRange: this.estimateSubScore(data.overall_band, data.feedback.grammar),
        feedback: this.generateWritingFeedback(data),
        detailedFeedback: this.extractWritingDetailedFeedback(data),
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("Writing scoring failed:", error);
      return {
        success: false,
        skillType: SkillType.WRITING,
        overallBand: 0,
        confidence: 0,
        feedback: "Scoring service unavailable. Please try again later.",
        detailedFeedback: {
          strengths: [],
          areasForImprovement: [],
          suggestions: ["Please try again in a few moments"],
        },
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Score IELTS Speaking from text transcript (BR28: 30 second timeout)
   * POST /api/speaking/score-text
   */
  async scoreSpeakingText(answerText: string): Promise<AIScoringResult> {
    try {
      const response = await fetch(`${this.baseUrl}${AI_SCORING_CONFIG.endpoints.speakingScoreText}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer_text: answerText,
        }),
        signal: AbortSignal.timeout(AI_SCORING_CONFIG.timeout.speaking), // BR28: 30 seconds
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as SpeakingTextScoringResponse;

      // Map to IELTS Speaking Band Descriptors
      const ieltsband = data.approx_ielts_band;
      
      return {
        success: true,
        skillType: SkillType.SPEAKING,
        overallBand: this.roundToHalf(ieltsband),
        confidence: 0.75, // Default confidence for text-based scoring
        // Speaking sub-scores (estimated)
        fluencyCoherence: this.estimateSubScore(ieltsband, data.feedback.fluency_coherence),
        pronunciation: this.estimateSubScore(ieltsband, data.feedback.pronunciation),
        lexicalResource: this.estimateSubScore(ieltsband, data.feedback.vocabulary),
        grammaticalRange: this.estimateSubScore(ieltsband, data.feedback.grammar),
        feedback: this.generateSpeakingFeedback(data.cefr_level, ieltsband, data.feedback),
        detailedFeedback: this.extractSpeakingDetailedFeedback(data.feedback, data.cefr_level),
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("Speaking text scoring failed:", error);
      return {
        success: false,
        skillType: SkillType.SPEAKING,
        overallBand: 0,
        confidence: 0,
        feedback: "Scoring service unavailable. Please try again later.",
        detailedFeedback: {
          strengths: [],
          areasForImprovement: [],
          suggestions: ["Please try again in a few moments"],
        },
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Score IELTS Speaking from audio file
   * POST /api/speaking/score-audio
   */
  async scoreSpeakingAudio(
    audioBuffer: Buffer,
    fileName: string,
    language: string = "en"
  ): Promise<AIScoringResult> {
    try {
      const formData = new FormData();
      // Use Blob with proper MIME type based on file extension
      const ext = fileName.split('.').pop()?.toLowerCase() || 'webm';
      const mimeType = ext === 'webm' ? 'audio/webm' : ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/webm';
      formData.append("audio", new Blob([audioBuffer], { type: mimeType }), fileName);

      // language is a query parameter, not form field
      const url = `${this.baseUrl}${AI_SCORING_CONFIG.endpoints.speakingScoreAudio}?language=${encodeURIComponent(language)}`;
      
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(AI_SCORING_CONFIG.timeout.speaking + AI_SCORING_CONFIG.timeout.transcribe),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("AI Scoring API error response:", errorBody);
        
        // Parse error detail from API response
        let errorDetail = "Unknown error";
        try {
          const errorJson = JSON.parse(errorBody);
          errorDetail = errorJson.detail || errorJson.error || errorBody;
        } catch {
          errorDetail = errorBody;
        }
        
        // Handle specific error cases with user-friendly messages
        if (errorDetail.includes("Could not extract meaningful text")) {
          return {
            success: false,
            skillType: SkillType.SPEAKING,
            overallBand: 0,
            confidence: 0,
            feedback: "Không thể nhận diện được nội dung từ bản ghi âm. Vui lòng nói rõ ràng và đảm bảo thu âm có chất lượng tốt.",
            detailedFeedback: {
              strengths: [],
              areasForImprovement: ["Audio không rõ ràng hoặc quá ngắn"],
              suggestions: [
                "Hãy nói to và rõ ràng hơn",
                "Đảm bảo môi trường yên tĩnh khi thu âm",
                "Kiểm tra microphone hoạt động tốt",
                "Nói ít nhất 10-15 giây để có đủ nội dung chấm điểm"
              ],
            },
            error: errorDetail,
          };
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as SpeakingAudioScoringResponse;
      const ieltsband = data.approx_ielts_band;

      // Map to IELTS Speaking Band Descriptors
      return {
        success: true,
        skillType: SkillType.SPEAKING,
        overallBand: this.roundToHalf(ieltsband),
        confidence: data.transcript_info.confidence || 0.75,
        // Speaking sub-scores (estimated)
        fluencyCoherence: this.estimateSubScore(ieltsband, data.feedback.fluency_coherence),
        pronunciation: this.estimateSubScore(ieltsband, data.feedback.pronunciation),
        lexicalResource: this.estimateSubScore(ieltsband, data.feedback.vocabulary),
        grammaticalRange: this.estimateSubScore(ieltsband, data.feedback.grammar),
        feedback: this.generateSpeakingFeedback(data.cefr_level, ieltsband, data.feedback),
        detailedFeedback: this.extractSpeakingDetailedFeedback(data.feedback, data.cefr_level),
        transcript: data.transcript,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("Speaking audio scoring failed:", error);
      return {
        success: false,
        skillType: SkillType.SPEAKING,
        overallBand: 0,
        confidence: 0,
        feedback: "Audio scoring service unavailable. Please try again later.",
        detailedFeedback: {
          strengths: [],
          areasForImprovement: [],
          suggestions: ["Please try again in a few moments"],
        },
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Transcribe audio to text using Whisper
   * POST /api/transcribe
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    fileName: string,
    language: string = "en"
  ): Promise<TranscriptionResponse | null> {
    try {
      const formData = new FormData();
      formData.append("audio", new Blob([audioBuffer]), fileName);
      formData.append("language", language);

      const response = await fetch(`${this.baseUrl}${AI_SCORING_CONFIG.endpoints.transcribe}`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(AI_SCORING_CONFIG.timeout.transcribe),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as TranscriptionResponse;
    } catch (error) {
      console.error("Transcription failed:", error);
      return null;
    }
  }

  // ============ Helper Methods ============

  private roundToHalf(num: number): number {
    return Math.round(num * 2) / 2;
  }

  /**
   * Estimate sub-score based on overall band and feedback text
   * Adds slight variation around the overall band
   */
  private estimateSubScore(overallBand: number, feedbackText: string): number {
    // Analyze feedback to adjust score slightly
    const positiveWords = ["excellent", "good", "well", "effective", "clear", "natural", "fluent", "rich"];
    const negativeWords = ["limited", "basic", "simple", "errors", "repetitive", "poor", "weak", "issues"];
    
    let adjustment = 0;
    const lowerFeedback = feedbackText.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowerFeedback.includes(word)) adjustment += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (lowerFeedback.includes(word)) adjustment -= 0.1;
    });
    
    // Clamp adjustment to ±0.5
    adjustment = Math.max(-0.5, Math.min(0.5, adjustment));
    
    return this.roundToHalf(overallBand + adjustment);
  }

  /**
   * Generate overall feedback text for Writing
   */
  private generateWritingFeedback(data: WritingScoringResponse): string {
    const band = data.overall_band;
    let summary = `**Overall Band Score: ${band}** (Confidence: ${Math.round(data.confidence * 100)}%)\n\n`;
    
    summary += `**Task Response:** ${data.feedback.task_response}\n\n`;
    summary += `**Coherence & Cohesion:** ${data.feedback.coherence_cohesion}\n\n`;
    summary += `**Lexical Resource:** ${data.feedback.vocabulary}\n\n`;
    summary += `**Grammatical Range:** ${data.feedback.grammar}`;
    
    return summary;
  }

  /**
   * Generate overall feedback text for Speaking
   */
  private generateSpeakingFeedback(
    cefrLevel: string, 
    ieltsband: number, 
    feedback: { fluency_coherence: string; vocabulary: string; grammar: string; pronunciation: string }
  ): string {
    let summary = `**Overall Band Score: ${ieltsband}** (CEFR: ${cefrLevel})\n\n`;
    
    summary += `**Fluency & Coherence:** ${feedback.fluency_coherence}\n\n`;
    summary += `**Lexical Resource:** ${feedback.vocabulary}\n\n`;
    summary += `**Grammatical Range & Accuracy:** ${feedback.grammar}\n\n`;
    summary += `**Pronunciation:** ${feedback.pronunciation}`;
    
    return summary;
  }

  /**
   * Extract detailed feedback for Writing (BR53)
   */
  private extractWritingDetailedFeedback(data: WritingScoringResponse): {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  } {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const suggestions: string[] = [];
    
    const band = data.overall_band;
    
    // Generate based on band score
    if (band >= 7.0) {
      strengths.push("Well-developed arguments with clear position");
      strengths.push("Effective use of cohesive devices");
      strengths.push("Wide range of vocabulary with natural usage");
      strengths.push("Good control of complex grammatical structures");
    } else if (band >= 6.0) {
      strengths.push("Clear overall progression of ideas");
      strengths.push("Adequate range of vocabulary for the task");
      areasForImprovement.push("Develop ideas more fully with specific examples");
      areasForImprovement.push("Use more varied sentence structures");
      suggestions.push("Practice using less common vocabulary items");
      suggestions.push("Work on complex sentence formation");
    } else if (band >= 5.0) {
      strengths.push("Attempts to organize ideas logically");
      areasForImprovement.push("Paragraphing needs improvement");
      areasForImprovement.push("Limited vocabulary range");
      areasForImprovement.push("Frequent grammatical errors");
      suggestions.push("Study paragraph structure and topic sentences");
      suggestions.push("Build vocabulary through extensive reading");
      suggestions.push("Practice basic grammar structures");
    } else {
      areasForImprovement.push("Ideas need clearer organization");
      areasForImprovement.push("Very limited vocabulary");
      areasForImprovement.push("Many grammatical errors affect understanding");
      suggestions.push("Focus on understanding task requirements");
      suggestions.push("Learn essential vocabulary for common topics");
      suggestions.push("Study basic sentence patterns");
    }
    
    // Add specific feedback from API
    if (data.feedback.task_response.includes("tốt") || data.feedback.task_response.includes("đầy đủ")) {
      strengths.push("Good task response");
    }
    if (data.feedback.vocabulary.includes("phong phú") || data.feedback.vocabulary.includes("đa dạng")) {
      strengths.push("Rich vocabulary usage");
    }
    
    return { strengths, areasForImprovement, suggestions };
  }

  /**
   * Extract detailed feedback for Speaking (BR53)
   */
  private extractSpeakingDetailedFeedback(
    feedback: { fluency_coherence: string; vocabulary: string; grammar: string; pronunciation: string },
    cefrLevel: string
  ): {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  } {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const suggestions: string[] = [];
    
    // Map CEFR to typical characteristics
    const cefrMap: Record<string, { level: string; strengths: string[]; improvements: string[]; tips: string[] }> = {
      C2: {
        level: "Proficient",
        strengths: ["Native-like fluency", "Sophisticated vocabulary", "Near-perfect grammar"],
        improvements: [],
        tips: ["Maintain exposure to authentic materials"],
      },
      C1: {
        level: "Advanced",
        strengths: ["Fluent and spontaneous speech", "Wide vocabulary range", "Good grammatical control"],
        improvements: ["Minor errors in complex structures"],
        tips: ["Focus on idiomatic expressions", "Practice academic discourse"],
      },
      B2: {
        level: "Upper Intermediate",
        strengths: ["Can maintain conversation on various topics", "Good vocabulary for familiar topics"],
        improvements: ["Hesitation on complex topics", "Some grammatical errors"],
        tips: ["Expand vocabulary for abstract topics", "Practice complex sentence structures"],
      },
      B1: {
        level: "Intermediate",
        strengths: ["Can handle everyday situations", "Basic vocabulary is solid"],
        improvements: ["Limited vocabulary range", "Noticeable grammatical errors", "Some hesitation"],
        tips: ["Practice speaking on unfamiliar topics", "Learn collocations and phrasal verbs"],
      },
      A2: {
        level: "Elementary",
        strengths: ["Can communicate basic needs"],
        improvements: ["Very limited vocabulary", "Frequent grammatical errors", "Slow speech"],
        tips: ["Build vocabulary systematically", "Practice basic sentence patterns daily"],
      },
      A1: {
        level: "Beginner",
        strengths: ["Can produce simple phrases"],
        improvements: ["Very basic vocabulary only", "Many fundamental errors"],
        tips: ["Focus on high-frequency words", "Practice pronunciation of basic sounds"],
      },
    };
    
    const info = cefrMap[cefrLevel] || cefrMap.B1;
    
    strengths.push(...info.strengths);
    areasForImprovement.push(...info.improvements);
    suggestions.push(...info.tips);
    
    // Add from API feedback
    if (feedback.fluency_coherence.includes("trôi chảy") || feedback.fluency_coherence.includes("tốt")) {
      if (!strengths.includes("Good fluency and coherence")) {
        strengths.push("Good fluency and coherence");
      }
    }
    
    if (feedback.pronunciation.includes("rõ ràng") || feedback.pronunciation.includes("tự nhiên")) {
      if (!strengths.includes("Clear pronunciation")) {
        strengths.push("Clear pronunciation");
      }
    }
    
    return { strengths, areasForImprovement, suggestions };
  }
}

// Export singleton instance
export const aiScoringService = new AIScoringService();
