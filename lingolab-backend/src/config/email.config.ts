/**
 * Email Configuration
 * Supports multiple SMTP providers: Mailtrap, Gmail, SendGrid, etc.
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export const EMAIL_CONFIG: EmailConfig = {
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  from: {
    name: process.env.SMTP_FROM_NAME || "LingoLab",
    email: process.env.SMTP_FROM_EMAIL || "noreply@lingolab.com",
  },
};

/**
 * Email Templates Configuration
 */
export const EMAIL_TEMPLATES = {
  verification: {
    subject: "Verify your LingoLab account",
  },
  resetPassword: {
    subject: "Reset your LingoLab password",
  },
  teacherEvaluation: {
    subject: "Your practice has been evaluated by teacher",
  },
  scoringComplete: {
    subject: "Your practice has been scored",
  },
};

/**
 * Frontend URLs for email links
 */
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const EMAIL_LINKS = {
  verifyEmail: (token: string) => `${FRONTEND_URL}/verify-email?token=${token}`,
  resetPassword: (token: string) => `${FRONTEND_URL}/reset-password?token=${token}`,
  viewAttempt: (attemptId: string) => `${FRONTEND_URL}/practice/history/${attemptId}`,
  dashboard: () => `${FRONTEND_URL}/dashboard`,
};






