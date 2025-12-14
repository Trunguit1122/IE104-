// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Route paths
export const ROUTES = {
  // Public routes
  HOME: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",

  // Teacher routes
  TEACHER: {
    DASHBOARD: "/teacher",
    CREATE_TASK: "/teacher/create-task",
    COURSES: "/teacher/courses",
    COURSE_DETAIL: "/teacher/courses/:id",
    STUDENTS: "/teacher/students",
    STUDENT_DETAIL: "/teacher/students/:studentId",
    ADD_STUDENT: "/teacher/students/add",
    CLASSES: "/teacher/classes",
    REPORTS: "/teacher/reports",
    PROFILE: "/teacher/profile",
    SETTINGS: "/teacher/settings",
  },

  // Student routes
  STUDENT: {
    DASHBOARD: "/student",
    COURSES: "/student/courses",
    COURSE_DETAIL: "/student/courses/:id",
    ASSIGNMENTS: "/student/assignments",
    WRITING_SUBMISSION: "/student/submit/writing/:assignmentId",
    SPEAKING_SUBMISSION: "/student/submit/speaking/:assignmentId",
    PROGRESS: "/student/progress",
    PROFILE: "/student/profile",
    REPORT_DETAIL: "/student/report/:submissionId",
    SETTINGS: "/student/settings",
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "lingolab_token",
  USER: "lingolab_user",
  THEME: "lingolab_theme",
} as const;

// User roles
export const USER_ROLES = {
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

// Test accounts for development
export const TEST_ACCOUNTS = {
  TEACHER: {
    username: "teacher",
    email: "teacher@test.com",
    password: "teacher123",
  },
  STUDENT: {
    username: "student",
    email: "student@test.com",
    password: "student123",
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
