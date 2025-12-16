/**
 * Validation utilities following SRS Business Rules
 */

/**
 * BR2: Email Format Validation (RFC 5322)
 * - Standard email format
 * - No spaces
 * - Max length: 255 characters
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 255) {
    return false;
  }
  
  // RFC 5322 compliant regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Check for spaces
  if (email.includes(" ")) {
    return false;
  }
  
  return emailRegex.test(email);
}

/**
 * BR4: Password Complexity Validation
 * - 8-32 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8 || password.length > 32) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * BR12: Display Name Validation
 * - Cannot be empty
 * - Max length: 50 characters
 * - Must not contain offensive words
 */
const OFFENSIVE_WORDS = [
  "fuck", "shit", "ass", "bitch", "damn", "hell", "dick", "cock", "pussy", "cunt",
  // Vietnamese offensive words
  "địt", "đéo", "đụ", "lồn", "buồi", "cặc"
];

export function isValidDisplayName(displayName: string): boolean {
  if (!displayName || displayName.trim().length === 0) {
    return false;
  }
  
  if (displayName.length > 50) {
    return false;
  }
  
  const lowerName = displayName.toLowerCase();
  for (const word of OFFENSIVE_WORDS) {
    if (lowerName.includes(word)) {
      return false;
    }
  }
  
  return true;
}

/**
 * BR13: Avatar File Validation
 * - File type: .jpg, .png, .jpeg
 * - Max size: 2 MB
 */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

export function isValidAvatarFile(mimeType: string, fileSize: number): boolean {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
    return false;
  }
  
  if (fileSize > MAX_AVATAR_SIZE) {
    return false;
  }
  
  return true;
}

/**
 * BR18: Search Constraint
 * - Minimum 3 characters
 */
export function isValidSearchQuery(query: string): boolean {
  return !!query && query.trim().length >= 3;
}

/**
 * BR23: Audio Duration Validation
 * - Min: 30 seconds
 * - Max: 120 seconds (2 minutes)
 */
export function isValidAudioDuration(durationSeconds: number): boolean {
  return durationSeconds >= 30 && durationSeconds <= 120;
}

/**
 * BR24: Audio File Format Validation
 * Supports: MP3, WAV, WebM, OGG, M4A, AAC, FLAC, MP4, MOV, AVI
 */
const ALLOWED_AUDIO_TYPES = [
  // Audio formats
  "audio/wav",
  "audio/x-wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/webm",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  // Video formats (audio extraction)
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/ogg",
];

export function isValidAudioFile(mimeType: string): boolean {
  return ALLOWED_AUDIO_TYPES.includes(mimeType.toLowerCase());
}

/**
 * BR25: Filename Validation
 * - Alphanumeric, hyphens, underscores only
 * - Max 50 characters
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || filename.length > 50) {
    return false;
  }
  
  const filenameRegex = /^[a-zA-Z0-9_-]+$/;
  return filenameRegex.test(filename);
}

/**
 * BR36: Score Validation
 * - Number between 0.0 and 9.0
 * - Step of 0.5
 */
export function isValidScore(score: number): boolean {
  if (score < 0 || score > 9) {
    return false;
  }
  
  // Check if it's a valid step (0.5 increments)
  const remainder = (score * 10) % 5;
  return remainder === 0;
}

/**
 * BR37: Comment Constraint
 * - Max length: 2000 characters
 * - HTML tags stripped
 */
export function sanitizeComment(comment: string): string {
  if (!comment) {
    return "";
  }
  
  // Strip HTML tags
  const stripped = comment.replace(/<[^>]*>/g, "");
  
  // Trim to max length
  return stripped.substring(0, 2000);
}

export function isValidComment(comment: string): boolean {
  return comment.length <= 2000;
}

/**
 * BR51: Writing Word Count Validation
 * - Task 2: Minimum 250 words
 */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  
  // Split by whitespace and filter empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

export function isValidWritingWordCount(text: string, minWords: number = 250): boolean {
  return countWords(text) >= minWords;
}

/**
 * BR58-BR60: Compare Attempts Validation
 */
export function isValidCompareSelection(attemptIds: string[]): {
  valid: boolean;
  error?: string;
} {
  if (attemptIds.length < 2) {
    return { valid: false, error: "MSG_028" };
  }
  
  if (attemptIds.length > 5) {
    return { valid: false, error: "MSG_029" };
  }
  
  return { valid: true };
}

/**
 * Generate random token for verification/reset
 */
export function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate verification token with expiry
 * BR10: Valid for 15 minutes
 */
export function generateVerificationToken(): { token: string; expiry: Date } {
  const token = generateToken(64);
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return { token, expiry };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiry: Date | null | undefined): boolean {
  if (!expiry) {
    return true;
  }
  return new Date() > new Date(expiry);
}

