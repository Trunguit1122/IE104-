// User types
export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common entity types (extend as needed)
export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
}

// Skill and practice types
export type SkillType = 'speaking' | 'writing';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'in_progress' | 'submitted' | 'scored' | 'evaluated_by_teacher' | 'failed';

export interface Topic {
  id: string;
  name: string;
  description?: string;
}

export interface Prompt {
  id: string;
  title?: string;
  content: string;
  description?: string;
  skillType: SkillType;
  difficulty?: Difficulty;
  wordLimit?: number;
  prepTime?: number;
  responseTime?: number;
  topic?: Topic;
  topicId?: string;
  createdAt?: string;
}

export interface Attempt {
  id: string;
  learnerId?: string;
  promptId: string;
  skillType: SkillType;
  status: AttemptStatus;
  textContent?: string;
  writingContent?: string;
  startedAt?: string;
  submittedAt?: string;
  scoredAt?: string;
  createdAt?: string;
  prompt?: Prompt;
  score?: Score;
}

export interface Score {
  id: string;
  attemptId: string;
  skillType: SkillType;
  overallBand: number;
  confidence?: number;
  fluencyCoherence?: number;
  pronunciation?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  feedback?: string;
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
  createdAt?: string;
}

export type FeedbackType = 'ai_feedback' | 'ai' | 'teacher_comment' | 'teacher';

export interface Feedback {
  id: string;
  attemptId: string;
  authorId?: string;
  type: FeedbackType;
  content: string;
  createdAt?: string;
}

export interface AverageBandStats {
  overall: number;
  speaking: number;
  writing: number;
  count: number;
  bySkillType?: {
    speaking: number;
    writing: number;
  };
}
