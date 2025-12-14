import * as nodemailer from "nodemailer";
import { EMAIL_CONFIG, EMAIL_TEMPLATES, EMAIL_LINKS } from "../config/email.config";

/**
 * Email Service
 * Handles all email sending functionality for LingoLab
 * 
 * Supports:
 * - Email verification (BR5)
 * - Password reset (BR9-11)
 * - Teacher evaluation notification (BR38)
 * - Scoring completion notification
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass);
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: {
          user: EMAIL_CONFIG.auth.user,
          pass: EMAIL_CONFIG.auth.pass,
        },
      });
    } else {
      // Create a test transporter that logs to console
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      console.warn("⚠️  Email service not configured. Emails will be logged to console.");
    }
  }

  /**
   * Send an email
   */
  private async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      if (!this.isConfigured) {
        // Log email content in development - include the actual link for easy testing
        console.log("\n" + "=".repeat(60));
        console.log("📧 EMAIL (Development Mode - Not actually sent)");
        console.log("=".repeat(60));
        console.log("To:", options.to);
        console.log("Subject:", options.subject);
        console.log("-".repeat(60));
        
        // Extract and display any links from the HTML
        const linkRegex = /href="([^"]+)"/g;
        const links: string[] = [];
        let match;
        while ((match = linkRegex.exec(options.html)) !== null) {
          if (match[1].startsWith('http')) {
            links.push(match[1]);
          }
        }
        
        if (links.length > 0) {
          console.log("🔗 ACTION LINKS:");
          links.forEach((link, index) => {
            console.log(`   ${index + 1}. ${link}`);
          });
        }
        console.log("=".repeat(60) + "\n");
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error("Email sending failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Send verification email (BR5)
   */
  async sendVerificationEmail(
    email: string,
    displayName: string,
    verificationToken: string
  ): Promise<EmailResult> {
    const verifyLink = EMAIL_LINKS.verifyEmail(verificationToken);
    
    const html = this.getVerificationEmailTemplate(displayName, verifyLink);

    return this.sendEmail({
      to: email,
      subject: EMAIL_TEMPLATES.verification.subject,
      html,
    });
  }

  /**
   * Send password reset email (BR9-11)
   */
  async sendPasswordResetEmail(
    email: string,
    displayName: string,
    resetToken: string
  ): Promise<EmailResult> {
    const resetLink = EMAIL_LINKS.resetPassword(resetToken);
    
    const html = this.getPasswordResetEmailTemplate(displayName, resetLink);

    return this.sendEmail({
      to: email,
      subject: EMAIL_TEMPLATES.resetPassword.subject,
      html,
    });
  }

  /**
   * Send teacher evaluation notification (BR38)
   */
  async sendTeacherEvaluationNotification(
    learnerEmail: string,
    learnerName: string,
    teacherName: string,
    attemptId: string,
    score?: number,
    comment?: string
  ): Promise<EmailResult> {
    const viewLink = EMAIL_LINKS.viewAttempt(attemptId);
    
    const html = this.getTeacherEvaluationTemplate(
      learnerName,
      teacherName,
      viewLink,
      score,
      comment
    );

    return this.sendEmail({
      to: learnerEmail,
      subject: EMAIL_TEMPLATES.teacherEvaluation.subject,
      html,
    });
  }

  /**
   * Send scoring completion notification
   */
  async sendScoringCompleteNotification(
    learnerEmail: string,
    learnerName: string,
    attemptId: string,
    skillType: string,
    overallScore: number
  ): Promise<EmailResult> {
    const viewLink = EMAIL_LINKS.viewAttempt(attemptId);
    
    const html = this.getScoringCompleteTemplate(
      learnerName,
      skillType,
      overallScore,
      viewLink
    );

    return this.sendEmail({
      to: learnerEmail,
      subject: EMAIL_TEMPLATES.scoringComplete.subject,
      html,
    });
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log("📧 Email service running in development mode (no SMTP configured)");
      return true;
    }

    try {
      await this.transporter.verify();
      console.log("✅ Email service connected successfully");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }

  // ============ Email Templates ============

  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LingoLab</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .score-display {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .link-text {
      word-break: break-all;
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <h1>🎓 LingoLab</h1>
        <p>IELTS Practice Platform</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} LingoLab. All rights reserved.</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getVerificationEmailTemplate(displayName: string, verifyLink: string): string {
    const content = `
      <h2>Welcome to LingoLab, ${displayName}! 👋</h2>
      <p>Thank you for signing up. Please verify your email address to activate your account and start practicing IELTS.</p>
      
      <div style="text-align: center;">
        <a href="${verifyLink}" class="button">✅ Verify Email Address</a>
      </div>
      
      <div class="info-box">
        <strong>⏰ Note:</strong> This verification link will expire in <strong>15 minutes</strong>.
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link-text">${verifyLink}</p>
      
      <p>If you didn't create an account with LingoLab, please ignore this email.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getPasswordResetEmailTemplate(displayName: string, resetLink: string): string {
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${displayName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">🔐 Reset Password</a>
      </div>
      
      <div class="info-box">
        <strong>⏰ Note:</strong> This reset link will expire in <strong>15 minutes</strong> and can only be used once.
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link-text">${resetLink}</p>
      
      <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getTeacherEvaluationTemplate(
    learnerName: string,
    teacherName: string,
    viewLink: string,
    score?: number,
    comment?: string
  ): string {
    let scoreSection = "";
    if (score !== undefined) {
      scoreSection = `
        <div class="score-display">
          Band ${score.toFixed(1)}
        </div>
      `;
    }

    let commentSection = "";
    if (comment) {
      commentSection = `
        <div class="info-box">
          <strong>📝 Teacher's Comment:</strong>
          <p style="margin: 10px 0 0; white-space: pre-wrap;">${comment}</p>
        </div>
      `;
    }

    const content = `
      <h2>Your Practice Has Been Evaluated! 🎉</h2>
      <p>Hi ${learnerName},</p>
      <p>Great news! <strong>${teacherName}</strong> has reviewed and evaluated your practice attempt.</p>
      
      ${scoreSection}
      ${commentSection}
      
      <div style="text-align: center;">
        <a href="${viewLink}" class="button">📊 View Full Feedback</a>
      </div>
      
      <p>Keep up the great work and continue practicing to improve your IELTS score!</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getScoringCompleteTemplate(
    learnerName: string,
    skillType: string,
    overallScore: number,
    viewLink: string
  ): string {
    const skillTypeDisplay = skillType.charAt(0).toUpperCase() + skillType.slice(1);
    
    const content = `
      <h2>Your ${skillTypeDisplay} Practice Has Been Scored! 📝</h2>
      <p>Hi ${learnerName},</p>
      <p>Your ${skillTypeDisplay.toLowerCase()} practice has been scored by our AI system.</p>
      
      <div class="score-display">
        Band ${overallScore.toFixed(1)}
      </div>
      
      <div style="text-align: center;">
        <a href="${viewLink}" class="button">📊 View Detailed Feedback</a>
      </div>
      
      <div class="info-box">
        <strong>💡 Tip:</strong> Review the detailed feedback to understand your strengths and areas for improvement. Practice regularly to boost your score!
      </div>
    `;
    return this.getBaseTemplate(content);
  }
}

// Export singleton instance
export const emailService = new EmailService();






