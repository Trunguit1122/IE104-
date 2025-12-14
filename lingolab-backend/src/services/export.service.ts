import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { AppDataSource } from "../data-source";
import { Attempt, AttemptStatus } from "../entities/Attempt";
import { User } from "../entities/User";
import { Score } from "../entities/Score";
import { Messages } from "../constants/messages";

/**
 * Export Service
 * Handles report generation in PDF and XLSX formats
 * 
 * BR42: Export formats (PDF, Excel)
 * BR43: File naming convention
 * BR44: Timeout handling (>60s)
 * BR45: Empty data validation
 */

export interface ExportOptions {
  learnerId: string;
  teacherId: string;
  format: "pdf" | "xlsx";
  dateFrom?: Date;
  dateTo?: Date;
  skillType?: string;
}

export interface ExportResult {
  success: boolean;
  message?: string;
  filePath?: string;
  fileName?: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

interface ReportData {
  learner: {
    id: string;
    email: string;
    displayName: string;
    createdAt: Date;
  };
  attempts: {
    id: string;
    skillType: string;
    promptContent: string;
    status: string;
    overallScore?: number;
    subScores?: {
      name: string;
      score: number;
    }[];
    feedback?: string;
    teacherScore?: number;
    teacherComment?: string;
    createdAt: Date;
    submittedAt?: Date;
    scoredAt?: Date;
  }[];
  summary: {
    totalAttempts: number;
    speakingAttempts: number;
    writingAttempts: number;
    avgOverallScore?: number;
    avgSpeakingScore?: number;
    avgWritingScore?: number;
    scoreImprovement?: number;
  };
  generatedAt: Date;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

// Export directory
const EXPORT_DIR = path.join(process.cwd(), "exports");

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

export class ExportService {
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private userRepository = AppDataSource.getRepository(User);
  private scoreRepository = AppDataSource.getRepository(Score);

  /**
   * Export learner report (BR42-45)
   */
  async exportReport(options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now();
    const TIMEOUT_MS = 60000; // BR44: 60 second timeout

    try {
      // Gather report data
      const reportData = await this.gatherReportData(options);

      // BR45: Check for empty data
      if (reportData.attempts.length === 0) {
        return {
          success: false,
          message: Messages.MSG_022,
        };
      }

      // Check timeout before generating
      if (Date.now() - startTime > TIMEOUT_MS) {
        return {
          success: false,
          message: Messages.MSG_021,
        };
      }

      // BR43: Generate filename
      const fileName = this.generateFileName(
        reportData.learner.displayName || reportData.learner.email,
        options.format
      );
      const filePath = path.join(EXPORT_DIR, fileName);

      // Generate report based on format
      if (options.format === "pdf") {
        await this.generatePDF(reportData, filePath);
      } else {
        await this.generateXLSX(reportData, filePath);
      }

      // Check timeout after generating
      if (Date.now() - startTime > TIMEOUT_MS) {
        // Clean up file if timeout
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return {
          success: false,
          message: Messages.MSG_021,
        };
      }

      // Set expiry (24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/reports/download/${fileName}`,
        expiresAt,
      };
    } catch (error: any) {
      console.error("Export failed:", error);
      return {
        success: false,
        message: error.message || "Export failed",
      };
    }
  }

  /**
   * Gather all data needed for the report
   */
  private async gatherReportData(options: ExportOptions): Promise<ReportData> {
    // Get learner info
    const learner = await this.userRepository.findOne({
      where: { id: options.learnerId },
    });

    if (!learner) {
      throw new Error("Learner not found");
    }

    // Build query for attempts
    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.prompt", "prompt")
      .leftJoinAndSelect("attempt.score", "score")
      .where("attempt.learnerId = :learnerId", { learnerId: options.learnerId })
      .andWhere("attempt.status IN (:...statuses)", {
        statuses: [AttemptStatus.SCORED, AttemptStatus.EVALUATED_BY_TEACHER],
      });

    if (options.dateFrom) {
      queryBuilder.andWhere("attempt.createdAt >= :dateFrom", {
        dateFrom: options.dateFrom,
      });
    }

    if (options.dateTo) {
      queryBuilder.andWhere("attempt.createdAt <= :dateTo", {
        dateTo: options.dateTo,
      });
    }

    if (options.skillType) {
      queryBuilder.andWhere("attempt.skillType = :skillType", {
        skillType: options.skillType,
      });
    }

    queryBuilder.orderBy("attempt.createdAt", "DESC");

    const attempts = await queryBuilder.getMany();

    // Map attempts to report format
    const mappedAttempts = attempts.map((attempt) => {
      const subScoresData = attempt.score?.getSubScoresForChart();
      const formattedSubScores = subScoresData?.map(item => ({
        name: item.label,
        score: item.value
      }));
      
      return {
        id: attempt.id,
        skillType: attempt.skillType,
        promptContent: attempt.prompt?.content || "",
        status: attempt.status,
        overallScore: attempt.score?.overallBand,
        subScores: formattedSubScores,
        feedback: attempt.score?.feedback,
        teacherScore: attempt.teacherScore ? Number(attempt.teacherScore) : undefined,
        teacherComment: attempt.teacherComment,
        createdAt: attempt.createdAt,
        submittedAt: attempt.submittedAt,
        scoredAt: attempt.scoredAt,
      };
    });

    // Calculate summary statistics
    const speakingAttempts = mappedAttempts.filter((a) => a.skillType === "speaking");
    const writingAttempts = mappedAttempts.filter((a) => a.skillType === "writing");

    const allScores = mappedAttempts.filter((a) => a.overallScore).map((a) => a.overallScore!);
    const speakingScores = speakingAttempts.filter((a) => a.overallScore).map((a) => a.overallScore!);
    const writingScores = writingAttempts.filter((a) => a.overallScore).map((a) => a.overallScore!);

    const avgScore = (scores: number[]) =>
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

    // Calculate improvement (first vs last score)
    let scoreImprovement: number | undefined;
    if (allScores.length >= 2) {
      const firstScore = allScores[allScores.length - 1]; // Oldest (array is DESC)
      const lastScore = allScores[0]; // Newest
      scoreImprovement = lastScore - firstScore;
    }

    return {
      learner: {
        id: learner.id,
        email: learner.email,
        displayName: learner.displayName || learner.email,
        createdAt: learner.createdAt,
      },
      attempts: mappedAttempts,
      summary: {
        totalAttempts: mappedAttempts.length,
        speakingAttempts: speakingAttempts.length,
        writingAttempts: writingAttempts.length,
        avgOverallScore: avgScore(allScores),
        avgSpeakingScore: avgScore(speakingScores),
        avgWritingScore: avgScore(writingScores),
        scoreImprovement,
      },
      generatedAt: new Date(),
      dateRange: {
        from: options.dateFrom,
        to: options.dateTo,
      },
    };
  }

  /**
   * BR43: Generate filename following naming convention
   * Format: Report_[StudentName]_[YYYYMMDD].[format]
   */
  private generateFileName(studentName: string, format: string): string {
    const sanitizedName = studentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const timestamp = Date.now().toString().slice(-6); // Add uniqueness
    return `Report_${sanitizedName}_${date}_${timestamp}.${format}`;
  }

  /**
   * Generate PDF report using pdfkit
   */
  private async generatePDF(data: ReportData, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc
          .fontSize(24)
          .fillColor("#667eea")
          .text("LingoLab", { align: "center" })
          .fontSize(12)
          .fillColor("#666")
          .text("IELTS Practice Progress Report", { align: "center" })
          .moveDown(2);

        // Learner Info Section
        doc
          .fontSize(16)
          .fillColor("#333")
          .text("Learner Information", { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .fillColor("#444")
          .text(`Name: ${data.learner.displayName}`)
          .text(`Email: ${data.learner.email}`)
          .text(`Member Since: ${this.formatDate(data.learner.createdAt)}`)
          .text(`Report Generated: ${this.formatDate(data.generatedAt)}`)
          .moveDown(1.5);

        // Date Range if specified
        if (data.dateRange?.from || data.dateRange?.to) {
          doc
            .fontSize(10)
            .fillColor("#666")
            .text(
              `Period: ${data.dateRange.from ? this.formatDate(data.dateRange.from) : "Start"} - ${
                data.dateRange.to ? this.formatDate(data.dateRange.to) : "Present"
              }`
            )
            .moveDown(1);
        }

        // Summary Section
        doc
          .fontSize(16)
          .fillColor("#333")
          .text("Performance Summary", { underline: true })
          .moveDown(0.5);

        // Summary Box
        const summaryY = doc.y;
        doc
          .rect(50, summaryY, 495, 100)
          .fillColor("#f8f9fa")
          .fill()
          .fillColor("#333");

        doc.y = summaryY + 15;
        doc.x = 70;

        doc
          .fontSize(11)
          .text(`Total Attempts: ${data.summary.totalAttempts}`, 70, doc.y)
          .text(`Speaking Attempts: ${data.summary.speakingAttempts}`, 70)
          .text(`Writing Attempts: ${data.summary.writingAttempts}`, 70)
          .moveDown(0.5);

        if (data.summary.avgOverallScore !== undefined) {
          doc.text(`Average Overall Score: Band ${data.summary.avgOverallScore.toFixed(1)}`, 300, summaryY + 15);
        }
        if (data.summary.avgSpeakingScore !== undefined) {
          doc.text(`Average Speaking: Band ${data.summary.avgSpeakingScore.toFixed(1)}`, 300, summaryY + 30);
        }
        if (data.summary.avgWritingScore !== undefined) {
          doc.text(`Average Writing: Band ${data.summary.avgWritingScore.toFixed(1)}`, 300, summaryY + 45);
        }
        if (data.summary.scoreImprovement !== undefined) {
          const improvementText =
            data.summary.scoreImprovement >= 0
              ? `+${data.summary.scoreImprovement.toFixed(1)}`
              : data.summary.scoreImprovement.toFixed(1);
          doc.text(`Score Change: ${improvementText} bands`, 300, summaryY + 60);
        }

        doc.y = summaryY + 115;
        doc.x = 50;

        // Attempts Detail Section
        doc
          .fontSize(16)
          .fillColor("#333")
          .text("Practice History", { underline: true })
          .moveDown(0.5);

        // Table Header
        const tableTop = doc.y;
        const tableHeaders = ["Date", "Skill", "Score", "Teacher", "Status"];
        const colWidths = [80, 70, 60, 60, 80];
        let xPos = 50;

        doc.fontSize(10).fillColor("#667eea");
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, tableTop, { width: colWidths[i] });
          xPos += colWidths[i];
        });

        doc.y = tableTop + 20;

        // Table Rows
        doc.fontSize(9).fillColor("#444");
        let rowCount = 0;
        const maxRowsPerPage = 25;

        for (const attempt of data.attempts) {
          if (rowCount > 0 && rowCount % maxRowsPerPage === 0) {
            doc.addPage();
            doc.y = 50;
          }

          xPos = 50;
          const rowY = doc.y;

          // Alternate row background
          if (rowCount % 2 === 0) {
            doc.rect(50, rowY - 2, 495, 16).fillColor("#f8f9fa").fill().fillColor("#444");
          }

          doc.text(this.formatDateShort(attempt.createdAt), xPos, rowY, { width: colWidths[0] });
          xPos += colWidths[0];

          doc.text(attempt.skillType.charAt(0).toUpperCase() + attempt.skillType.slice(1), xPos, rowY, {
            width: colWidths[1],
          });
          xPos += colWidths[1];

          doc.text(attempt.overallScore ? `Band ${attempt.overallScore.toFixed(1)}` : "-", xPos, rowY, {
            width: colWidths[2],
          });
          xPos += colWidths[2];

          doc.text(attempt.teacherScore ? `Band ${attempt.teacherScore.toFixed(1)}` : "-", xPos, rowY, {
            width: colWidths[3],
          });
          xPos += colWidths[3];

          doc.text(attempt.status.replace(/_/g, " "), xPos, rowY, { width: colWidths[4] });

          doc.y = rowY + 16;
          rowCount++;
        }

        // Footer
        doc
          .fontSize(8)
          .fillColor("#999")
          .text(
            `Generated by LingoLab | Page 1 | ${this.formatDate(data.generatedAt)}`,
            50,
            doc.page.height - 50,
            { align: "center" }
          );

        doc.end();

        stream.on("finish", () => resolve());
        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate XLSX report using exceljs
   */
  private async generateXLSX(data: ReportData, filePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "LingoLab";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary", {
      properties: { tabColor: { argb: "667eea" } },
    });

    // Header styling
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "667eea" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };

    // Title
    summarySheet.mergeCells("A1:D1");
    summarySheet.getCell("A1").value = "LingoLab - IELTS Practice Progress Report";
    summarySheet.getCell("A1").style = {
      font: { bold: true, size: 16, color: { argb: "667eea" } },
      alignment: { horizontal: "center" },
    };

    // Learner Info
    summarySheet.addRow([]);
    summarySheet.addRow(["Learner Information"]);
    summarySheet.getCell("A3").style = { font: { bold: true, size: 12 } };

    summarySheet.addRow(["Name", data.learner.displayName]);
    summarySheet.addRow(["Email", data.learner.email]);
    summarySheet.addRow(["Member Since", this.formatDate(data.learner.createdAt)]);
    summarySheet.addRow(["Report Generated", this.formatDate(data.generatedAt)]);

    if (data.dateRange?.from || data.dateRange?.to) {
      summarySheet.addRow([
        "Period",
        `${data.dateRange.from ? this.formatDate(data.dateRange.from) : "Start"} - ${
          data.dateRange.to ? this.formatDate(data.dateRange.to) : "Present"
        }`,
      ]);
    }

    // Summary Stats
    summarySheet.addRow([]);
    summarySheet.addRow(["Performance Summary"]);
    summarySheet.getCell(`A${summarySheet.rowCount}`).style = { font: { bold: true, size: 12 } };

    summarySheet.addRow(["Total Attempts", data.summary.totalAttempts]);
    summarySheet.addRow(["Speaking Attempts", data.summary.speakingAttempts]);
    summarySheet.addRow(["Writing Attempts", data.summary.writingAttempts]);

    if (data.summary.avgOverallScore !== undefined) {
      summarySheet.addRow(["Average Overall Score", `Band ${data.summary.avgOverallScore.toFixed(1)}`]);
    }
    if (data.summary.avgSpeakingScore !== undefined) {
      summarySheet.addRow(["Average Speaking Score", `Band ${data.summary.avgSpeakingScore.toFixed(1)}`]);
    }
    if (data.summary.avgWritingScore !== undefined) {
      summarySheet.addRow(["Average Writing Score", `Band ${data.summary.avgWritingScore.toFixed(1)}`]);
    }
    if (data.summary.scoreImprovement !== undefined) {
      const sign = data.summary.scoreImprovement >= 0 ? "+" : "";
      summarySheet.addRow(["Score Change", `${sign}${data.summary.scoreImprovement.toFixed(1)} bands`]);
    }

    // Auto-fit columns
    summarySheet.columns.forEach((column) => {
      column.width = 25;
    });

    // Practice History Sheet
    const historySheet = workbook.addWorksheet("Practice History", {
      properties: { tabColor: { argb: "764ba2" } },
    });

    // Headers
    const headers = [
      "Date",
      "Skill Type",
      "Prompt (excerpt)",
      "AI Score",
      "Teacher Score",
      "Status",
      "Feedback",
      "Teacher Comment",
    ];

    const headerRow = historySheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Data rows
    for (const attempt of data.attempts) {
      historySheet.addRow([
        this.formatDate(attempt.createdAt),
        attempt.skillType.charAt(0).toUpperCase() + attempt.skillType.slice(1),
        attempt.promptContent.substring(0, 100) + (attempt.promptContent.length > 100 ? "..." : ""),
        attempt.overallScore ? `Band ${attempt.overallScore.toFixed(1)}` : "-",
        attempt.teacherScore ? `Band ${attempt.teacherScore.toFixed(1)}` : "-",
        attempt.status.replace(/_/g, " "),
        attempt.feedback ? attempt.feedback.substring(0, 200) + "..." : "-",
        attempt.teacherComment || "-",
      ]);
    }

    // Auto-fit and freeze header
    historySheet.columns.forEach((column, index) => {
      const widths = [15, 12, 40, 12, 12, 18, 50, 40];
      column.width = widths[index] || 15;
    });
    historySheet.views = [{ state: "frozen", ySplit: 1 }];

    // Detailed Scores Sheet (if available)
    const scoresSheet = workbook.addWorksheet("Detailed Scores", {
      properties: { tabColor: { argb: "28a745" } },
    });

    const scoreHeaders = [
      "Date",
      "Skill",
      "Overall",
      "Fluency",
      "Pronunciation",
      "Lexical",
      "Grammar",
      "Task Achievement",
      "Coherence",
    ];

    const scoreHeaderRow = scoresSheet.addRow(scoreHeaders);
    scoreHeaderRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    for (const attempt of data.attempts) {
      if (attempt.subScores && attempt.subScores.length > 0) {
        const subScoreMap = new Map(attempt.subScores.map((s) => [s.name.toLowerCase(), s.score]));

        scoresSheet.addRow([
          this.formatDate(attempt.createdAt),
          attempt.skillType,
          attempt.overallScore?.toFixed(1) || "-",
          subScoreMap.get("fluency & coherence")?.toFixed(1) || "-",
          subScoreMap.get("pronunciation")?.toFixed(1) || "-",
          subScoreMap.get("lexical resource")?.toFixed(1) || "-",
          subScoreMap.get("grammatical range")?.toFixed(1) || "-",
          subScoreMap.get("task achievement")?.toFixed(1) || "-",
          subScoreMap.get("coherence & cohesion")?.toFixed(1) || "-",
        ]);
      }
    }

    scoresSheet.columns.forEach((column) => {
      column.width = 15;
    });
    scoresSheet.views = [{ state: "frozen", ySplit: 1 }];

    // Save file
    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private formatDateShort(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get file for download
   */
  getFilePath(fileName: string): string | null {
    const filePath = path.join(EXPORT_DIR, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  /**
   * Clean up expired files (should be run periodically)
   */
  async cleanupExpiredFiles(maxAgeHours: number = 24): Promise<number> {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;

    const files = fs.readdirSync(EXPORT_DIR);
    for (const file of files) {
      const filePath = path.join(EXPORT_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

// Export singleton instance
export const exportService = new ExportService();






