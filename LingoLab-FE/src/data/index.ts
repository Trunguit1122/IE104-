// Mock data for development and testing
// This file provides sample data for UI components

export type TaskType = "WRITING" | "SPEAKING" | "READING";
export type SubmissionStatus = "NOT_STARTED" | "PENDING" | "SUBMITTED" | "GRADED";

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Class {
  id: string;
  name: string;
  studentIds: string[];
}

export interface Assignment {
  id: string;
  title: string;
  type: TaskType;
  classId: string;
  dueDate: string;
  description?: string;
}

export interface AIFeedback {
  score: number;
  feedback: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  aiFeedback?: AIFeedback;
}

// Mock Students
export const mockStudents: Student[] = [
  {
    id: "s1",
    name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    avatar: undefined,
  },
  {
    id: "s2",
    name: "Tran Thi B",
    email: "tranthib@example.com",
    avatar: undefined,
  },
  {
    id: "s3",
    name: "Le Van C",
    email: "levanc@example.com",
    avatar: undefined,
  },
];

// Mock Classes
export const mockClasses: Class[] = [
  {
    id: "c1",
    name: "IELTS Writing Advanced",
    studentIds: ["s1", "s2"],
  },
  {
    id: "c2",
    name: "IELTS Speaking Intermediate",
    studentIds: ["s1", "s3"],
  },
];

// Mock Assignments
export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    title: "Writing Task 2 - Environment",
    type: "WRITING",
    classId: "c1",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Write an essay about environmental issues.",
  },
  {
    id: "a2",
    title: "Speaking Part 2 - Describe a Place",
    type: "SPEAKING",
    classId: "c2",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Describe a place you have visited.",
  },
  {
    id: "a3",
    title: "Writing Task 1 - Graph Description",
    type: "WRITING",
    classId: "c1",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Describe the given graph.",
  },
];

// Mock Submissions
export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    studentId: "s1",
    assignmentId: "a1",
    status: "GRADED",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiFeedback: {
      score: 7.0,
      feedback: "Good essay structure with clear arguments.",
      strengths: ["Clear thesis statement", "Good vocabulary range"],
      weaknesses: ["Minor grammar errors"],
    },
  },
  {
    id: "sub2",
    studentId: "s1",
    assignmentId: "a2",
    status: "SUBMITTED",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sub3",
    studentId: "s2",
    assignmentId: "a1",
    status: "GRADED",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    aiFeedback: {
      score: 6.5,
      feedback: "Good attempt but needs more examples.",
      strengths: ["Good introduction"],
      weaknesses: ["Lack of supporting examples", "Conclusion too short"],
    },
  },
];
