import { AppDataSource } from "../data-source";
import { User, UserRole, UserStatus } from "../entities/User";
import { LearnerProfile } from "../entities/LearnerProfile";
import { Attempt, AttemptStatus } from "../entities/Attempt";
import { Prompt, SkillType, DifficultyLevel } from "../entities/Prompt";
import { Topic } from "../entities/Topic";
import { Score } from "../entities/Score";
import { Class } from "../entities/Class";
import { AttemptMedia } from "../entities/AttemptMedia";
import { Messages } from "../constants/messages";
import { isValidScore, sanitizeComment, isValidComment } from "../utils/validation.utils";
import { emailService } from "./email.service";
import { exportService } from "./export.service";
import { auditService } from "./audit.service";
import {
  LearnerListFilterDTO,
  LearnerListResponseDTO,
  LearnerListItemDTO,
  LearnerProfileDTO,
  TeacherPracticeHistoryFilterDTO,
  TeacherPracticeHistoryItemDTO,
  AttemptDetailDTO,
  AddTeacherEvaluationDTO,
  TeacherEvaluationResponseDTO,
  SuggestTopicsDTO,
  TopicSuggestionsResponseDTO,
  ProgressFilterDTO,
  ProgressResponseDTO,
  ProgressDataPointDTO,
  ExportReportDTO,
  ExportResponseDTO,
  CreateClassDTO,
  UpdateClassDTO,
  ClassResponseDTO,
  ClassDetailDTO,
} from "../dtos/teacher.dto";
import { In } from "typeorm";

export class TeacherService {
  private userRepository = AppDataSource.getRepository(User);
  private learnerProfileRepository = AppDataSource.getRepository(LearnerProfile);
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private promptRepository = AppDataSource.getRepository(Prompt);
  private topicRepository = AppDataSource.getRepository(Topic);
  private scoreRepository = AppDataSource.getRepository(Score);
  private classRepository = AppDataSource.getRepository(Class);
  private mediaRepository = AppDataSource.getRepository(AttemptMedia);

  /**
   * UC11: View Learner List
   * BR30: 50 students per page
   */
  async getLearnerList(
    teacherId: string,
    filter: LearnerListFilterDTO
  ): Promise<LearnerListResponseDTO> {
    const limit = filter.limit || 50; // BR30
    const offset = filter.offset || 0;

    // Get classes taught by this teacher
    const teacherClasses = await this.classRepository.find({
      where: { teacherId },
      relations: ["learners"],
    });

    // Get all learner IDs from teacher's classes
    const learnerIds = new Set<string>();
    teacherClasses.forEach((c) => {
      c.learners?.forEach((l) => learnerIds.add(l.id));
    });

    if (learnerIds.size === 0) {
      return {
        items: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }

    // Build query
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.learnerProfile", "profile")
      .leftJoin("class_learners", "cl", "cl.learner_id = user.id")
      .leftJoin("classes", "classes", "classes.id = cl.class_id")
      .where("user.id IN (:...learnerIds)", { learnerIds: Array.from(learnerIds) })
      .andWhere("user.role = :role", { role: UserRole.LEARNER });

    // BR31: Search by name and email
    if (filter.search) {
      queryBuilder.andWhere(
        "(user.email ILIKE :search OR user.displayName ILIKE :search OR profile.firstName ILIKE :search OR profile.lastName ILIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // BR32: Filter by class (AND logic)
    if (filter.classId) {
      queryBuilder.andWhere("classes.id = :classId", { classId: filter.classId });
    }

    // BR32: Filter by status (AND logic)
    if (filter.status) {
      queryBuilder.andWhere("user.status = :status", { status: filter.status });
    }

    queryBuilder.orderBy("user.createdAt", "DESC");

    const [users, total] = await queryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    // Get attempt statistics for each learner
    const items: LearnerListItemDTO[] = await Promise.all(
      users.map(async (user) => {
        const attemptStats = await this.attemptRepository
          .createQueryBuilder("attempt")
          .leftJoin("attempt.score", "score")
          .select("COUNT(attempt.id)", "totalAttempts")
          .addSelect("AVG(score.overallBand)", "avgScore")
          .addSelect("MAX(attempt.createdAt)", "lastActiveAt")
          .where("attempt.learnerId = :learnerId", { learnerId: user.id })
          .getRawOne();

        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          status: user.status,
          classNames: user.enrolledClasses?.map((c) => c.name),
          totalAttempts: parseInt(attemptStats.totalAttempts) || 0,
          avgScore: attemptStats.avgScore ? parseFloat(attemptStats.avgScore) : undefined,
          lastActiveAt: attemptStats.lastActiveAt,
          createdAt: user.createdAt,
        };
      })
    );

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * UC13: View Learner Profile
   * BR33: Access permission check
   */
  async getLearnerProfile(
    teacherId: string,
    learnerId: string
  ): Promise<LearnerProfileDTO | { success: false; message: string }> {
    // BR33: Check if teacher has access to this learner
    const hasAccess = await this.checkTeacherAccess(teacherId, learnerId);
    if (!hasAccess) {
      return {
        success: false,
        message: Messages.MSG_020,
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: learnerId, role: UserRole.LEARNER },
      relations: ["learnerProfile", "enrolledClasses", "enrolledClasses.teacher"],
    });

    if (!user) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // Get attempt statistics
    const stats = await this.getAttemptStatistics(learnerId);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      firstName: user.learnerProfile?.firstName,
      lastName: user.learnerProfile?.lastName,
      nativeLanguage: user.learnerProfile?.nativeLanguage,
      targetBand: user.learnerProfile?.targetBand,
      currentBand: user.learnerProfile?.currentBand,
      learningGoals: user.learnerProfile?.learningGoals,
      enrolledClasses: user.enrolledClasses?.map((c) => ({
        id: c.id,
        name: c.name,
        teacherName: c.teacher?.displayName || c.teacher?.email,
      })),
      ...stats,
    };
  }

  /**
   * UC14: View Learner Practice History
   * BR34: Sort by date (most recent first)
   */
  async getLearnerPracticeHistory(
    teacherId: string,
    filter: TeacherPracticeHistoryFilterDTO
  ): Promise<{ success: boolean; items?: TeacherPracticeHistoryItemDTO[]; message?: string }> {
    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, filter.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        message: Messages.MSG_020,
      };
    }

    const limit = filter.limit || 10;
    const offset = filter.offset || 0;

    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.prompt", "prompt")
      .leftJoinAndSelect("attempt.score", "score")
      .where("attempt.learnerId = :learnerId", { learnerId: filter.learnerId });

    if (filter.skillType) {
      queryBuilder.andWhere("attempt.skillType = :skillType", { skillType: filter.skillType });
    }

    if (filter.status) {
      queryBuilder.andWhere("attempt.status = :status", { status: filter.status });
    }

    if (filter.dateFrom) {
      queryBuilder.andWhere("attempt.createdAt >= :dateFrom", { dateFrom: filter.dateFrom });
    }

    if (filter.dateTo) {
      queryBuilder.andWhere("attempt.createdAt <= :dateTo", { dateTo: filter.dateTo });
    }

    // BR34: Sort by date (most recent first)
    queryBuilder.orderBy("attempt.createdAt", "DESC");

    const attempts = await queryBuilder.take(limit).skip(offset).getMany();

    const items: TeacherPracticeHistoryItemDTO[] = attempts.map((attempt) => ({
      attemptId: attempt.id,
      promptContent: attempt.prompt?.content || "",
      skillType: attempt.skillType,
      difficulty: attempt.prompt?.difficulty,
      status: attempt.status,
      overallScore: attempt.score?.overallBand,
      teacherScore: attempt.teacherScore ? Number(attempt.teacherScore) : undefined,
      hasTeacherComment: !!attempt.teacherComment,
      createdAt: attempt.createdAt,
      submittedAt: attempt.submittedAt,
      scoredAt: attempt.scoredAt,
    }));

    return {
      success: true,
      items,
    };
  }

  /**
   * UC15: View Attempt Details
   * BR35: AI feedback display
   */
  async getAttemptDetail(
    teacherId: string,
    attemptId: string
  ): Promise<AttemptDetailDTO | { success: false; message: string }> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ["prompt", "score", "media", "learner"],
    });

    if (!attempt) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, attempt.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        message: Messages.MSG_020,
      };
    }

    return {
      attemptId: attempt.id,
      learnerId: attempt.learnerId,
      learnerName: attempt.learner?.displayName || attempt.learner?.email,
      promptId: attempt.promptId,
      promptContent: attempt.prompt?.content || "",
      skillType: attempt.skillType,
      difficulty: attempt.prompt?.difficulty,
      status: attempt.status,
      writingContent: attempt.writingContent,
      wordCount: attempt.wordCount,
      recordings: attempt.media?.map((m) => ({
        id: m.id,
        fileName: m.fileName,
        storageUrl: m.storageUrl,
        duration: m.duration,
      })),
      // BR35: AI Score, feedback text, timestamp
      aiScore: attempt.score
        ? {
            skillType: attempt.score.skillType,
            overallBand: Number(attempt.score.overallBand),
            confidence: attempt.score.confidence ? Number(attempt.score.confidence) : undefined,
            subScores: attempt.score.getSubScoresForChart(),
            feedback: attempt.score.feedback,
            detailedFeedback: attempt.score.detailedFeedback,
            scoredAt: attempt.score.createdAt,
          }
        : undefined,
      teacherScore: attempt.teacherScore ? Number(attempt.teacherScore) : undefined,
      teacherComment: attempt.teacherComment,
      evaluatedBy: attempt.evaluatedBy,
      evaluatedAt: attempt.evaluatedAt,
      createdAt: attempt.createdAt,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  }

  /**
   * UC16: Add Teacher Evaluation
   * BR36: Score 0.0-9.0, step 0.5
   * BR37: Comment max 2000 chars
   * BR38: Update status, notify student
   */
  async addTeacherEvaluation(
    teacherId: string,
    dto: AddTeacherEvaluationDTO
  ): Promise<TeacherEvaluationResponseDTO> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: dto.attemptId },
    });

    if (!attempt) {
      return {
        success: false,
        message: Messages.MSG_404,
      };
    }

    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, attempt.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        message: Messages.MSG_020,
      };
    }

    // BR36: Validate score
    if (dto.score !== undefined && !isValidScore(dto.score)) {
      return {
        success: false,
        message: Messages.MSG_017,
      };
    }

    // BR37: Sanitize and validate comment
    let comment = dto.comment;
    if (comment) {
      comment = sanitizeComment(comment);
      if (!isValidComment(comment)) {
        return {
          success: false,
          message: "Comment must be 2000 characters or less",
        };
      }
    }

    // Update attempt with teacher evaluation
    const updateData: Partial<Attempt> = {
      evaluatedBy: teacherId,
      evaluatedAt: new Date(),
    };

    if (dto.score !== undefined) {
      updateData.teacherScore = dto.score;
    }

    if (comment !== undefined) {
      updateData.teacherComment = comment;
    }

    // BR38: Update status
    if (attempt.status === AttemptStatus.SCORED) {
      updateData.status = AttemptStatus.EVALUATED_BY_TEACHER;
    }

    await this.attemptRepository.update(dto.attemptId, updateData);

    // BR38 - Send notification to student
    const learner = await this.userRepository.findOne({
      where: { id: attempt.learnerId },
    });
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (learner && teacher) {
      await emailService.sendTeacherEvaluationNotification(
        learner.email,
        learner.displayName || learner.email,
        teacher.displayName || teacher.email,
        dto.attemptId,
        dto.score,
        comment
      );
    }

    // Audit: Log teacher evaluation
    await auditService.logTeacherEvaluation(
      teacherId,
      dto.attemptId,
      attempt.learnerId,
      dto.score
    );

    return {
      success: true,
      message: "Evaluation saved successfully",
      attemptId: dto.attemptId,
      teacherScore: dto.score,
      teacherComment: comment,
      evaluatedAt: new Date(),
      status: updateData.status || attempt.status,
    };
  }

  /**
   * UC17: Suggest Practice Topics
   * BR39: Level matching based on band score
   */
  async suggestTopics(
    teacherId: string,
    dto: SuggestTopicsDTO
  ): Promise<TopicSuggestionsResponseDTO> {
    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, dto.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        suggestedDifficulty: DifficultyLevel.MEDIUM,
        suggestions: [],
      };
    }

    // Get learner's average score
    const learnerProfile = await this.learnerProfileRepository.findOne({
      where: { userId: dto.learnerId },
    });

    const avgScore = await this.getAverageScore(dto.learnerId, dto.skillType);

    // BR39: Determine appropriate difficulty based on band score
    let suggestedDifficulty: DifficultyLevel;
    if (avgScore === null || avgScore < 5) {
      suggestedDifficulty = DifficultyLevel.EASY;
    } else if (avgScore < 7) {
      suggestedDifficulty = DifficultyLevel.MEDIUM;
    } else {
      suggestedDifficulty = DifficultyLevel.HARD;
    }

    // Get topics with appropriate difficulty prompts
    const queryBuilder = this.topicRepository
      .createQueryBuilder("topic")
      .leftJoin("topic.prompts", "prompt")
      .addSelect("COUNT(prompt.id)", "promptCount")
      .where("topic.isActive = :isActive", { isActive: true })
      .andWhere("prompt.isActive = :promptActive", { promptActive: true })
      .andWhere("prompt.difficulty = :difficulty", { difficulty: suggestedDifficulty });

    if (dto.skillType) {
      queryBuilder.andWhere("prompt.skillType = :skillType", { skillType: dto.skillType });
    }

    queryBuilder.groupBy("topic.id").having("COUNT(prompt.id) > 0");

    const topics = await queryBuilder.getRawAndEntities();

    const suggestions = topics.entities.map((topic, index) => ({
      topicId: topic.id,
      topicName: topic.name,
      skillType: dto.skillType || SkillType.SPEAKING,
      difficulty: suggestedDifficulty,
      promptCount: parseInt(topics.raw[index]?.promptCount) || 0,
      reason: `Matches learner's current level (Band ${avgScore?.toFixed(1) || "N/A"})`,
    }));

    return {
      success: true,
      learnerCurrentBand: avgScore || undefined,
      suggestedDifficulty,
      suggestions,
    };
  }

  /**
   * UC18: Monitor Learner Progress
   * BR40: Weekly/Monthly toggle
   * BR41: Average Score Trend, Total Attempts
   */
  async getProgress(
    teacherId: string,
    filter: ProgressFilterDTO
  ): Promise<ProgressResponseDTO> {
    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, filter.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        learnerId: filter.learnerId,
        period: filter.period,
        totalAttempts: 0,
        avgScoreTrend: [],
      };
    }

    const learner = await this.userRepository.findOne({
      where: { id: filter.learnerId },
    });

    // Calculate date range based on period
    const now = new Date();
    let dateFrom: Date;
    if (filter.period === "weekly") {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get attempts with scores
    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.score", "score")
      .where("attempt.learnerId = :learnerId", { learnerId: filter.learnerId })
      .andWhere("attempt.createdAt >= :dateFrom", { dateFrom })
      .andWhere("attempt.status IN (:...statuses)", {
        statuses: [AttemptStatus.SCORED, AttemptStatus.EVALUATED_BY_TEACHER],
      });

    if (filter.skillType) {
      queryBuilder.andWhere("attempt.skillType = :skillType", { skillType: filter.skillType });
    }

    queryBuilder.orderBy("attempt.createdAt", "ASC");

    const attempts = await queryBuilder.getMany();

    // BR41: Calculate metrics
    const totalAttempts = attempts.length;
    const scores = attempts
      .filter((a) => a.score)
      .map((a) => a.score!.overallBand);

    const currentAvgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

    // Group by date for trend
    const trendMap = new Map<string, { total: number; count: number }>();
    attempts.forEach((attempt) => {
      if (attempt.score) {
        const dateKey = attempt.createdAt.toISOString().split("T")[0];
        const existing = trendMap.get(dateKey) || { total: 0, count: 0 };
        existing.total += attempt.score.overallBand;
        existing.count += 1;
        trendMap.set(dateKey, existing);
      }
    });

    const avgScoreTrend: ProgressDataPointDTO[] = Array.from(trendMap.entries()).map(
      ([date, data]) => ({
        date,
        avgScore: data.total / data.count,
        attemptCount: data.count,
      })
    );

    // Calculate improvement
    let improvement: number | undefined;
    if (avgScoreTrend.length >= 2) {
      const firstScore = avgScoreTrend[0].avgScore;
      const lastScore = avgScoreTrend[avgScoreTrend.length - 1].avgScore;
      improvement = lastScore - firstScore;
    }

    return {
      success: true,
      learnerId: filter.learnerId,
      learnerName: learner?.displayName || learner?.email,
      period: filter.period,
      skillType: filter.skillType,
      totalAttempts,
      avgScoreTrend,
      improvement,
      currentAvgScore,
    };
  }

  /**
   * UC19: Export Learner Reports
   * BR42-BR45: Export handling with real PDF/XLSX generation
   */
  async exportReport(
    teacherId: string,
    dto: ExportReportDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ExportResponseDTO> {
    // Check access
    const hasAccess = await this.checkTeacherAccess(teacherId, dto.learnerId);
    if (!hasAccess) {
      return {
        success: false,
        message: Messages.MSG_020,
      };
    }

    // Use the export service for real PDF/XLSX generation
    const result = await exportService.exportReport({
      learnerId: dto.learnerId,
      teacherId,
      format: dto.format as "pdf" | "xlsx",
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      skillType: dto.skillType,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message || Messages.MSG_022,
      };
    }

    // Audit: Log report export
    await auditService.logReportExport(
      teacherId,
      dto.learnerId,
      dto.format,
      result.fileName!,
      ipAddress,
      userAgent
    );

    return {
      success: true,
      message: "Report generated successfully",
      downloadUrl: result.downloadUrl,
      fileName: result.fileName,
      expiresAt: result.expiresAt,
    };
  }

  // ============ Class Management ============

  async createClass(teacherId: string, dto: CreateClassDTO): Promise<ClassResponseDTO> {
    const classEntity = this.classRepository.create({
      teacherId,
      name: dto.name,
      description: dto.description,
      code: this.generateClassCode(),
    });

    const saved = await this.classRepository.save(classEntity);

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      code: saved.code,
      teacherId: saved.teacherId,
      learnerCount: 0,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async getTeacherClasses(teacherId: string): Promise<ClassResponseDTO[]> {
    const classes = await this.classRepository.find({
      where: { teacherId },
      relations: ["learners"],
      order: { createdAt: "DESC" },
    });

    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      code: c.code,
      teacherId: c.teacherId,
      learnerCount: c.learners?.length || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async addLearnersToClass(
    teacherId: string,
    classId: string,
    learnerIds: string[]
  ): Promise<{ success: boolean; message: string }> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId, teacherId },
      relations: ["learners"],
    });

    if (!classEntity) {
      return { success: false, message: Messages.MSG_404 };
    }

    const learners = await this.userRepository.find({
      where: { id: In(learnerIds), role: UserRole.LEARNER },
    });

    classEntity.learners = [...(classEntity.learners || []), ...learners];
    await this.classRepository.save(classEntity);

    return { success: true, message: "Learners added successfully" };
  }

  // ============ Helper Methods ============

  private async checkTeacherAccess(teacherId: string, learnerId: string): Promise<boolean> {
    // Check if teacher has this learner in any of their classes
    const count = await this.classRepository
      .createQueryBuilder("class")
      .leftJoin("class.learners", "learner")
      .where("class.teacherId = :teacherId", { teacherId })
      .andWhere("learner.id = :learnerId", { learnerId })
      .getCount();

    return count > 0;
  }

  private async getAttemptStatistics(learnerId: string) {
    const stats = await this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoin("attempt.score", "score")
      .select("COUNT(attempt.id)", "totalAttempts")
      .addSelect("COUNT(CASE WHEN attempt.skillType = 'speaking' THEN 1 END)", "speakingAttempts")
      .addSelect("COUNT(CASE WHEN attempt.skillType = 'writing' THEN 1 END)", "writingAttempts")
      .addSelect("AVG(score.overallBand)", "avgOverallScore")
      .addSelect(
        "AVG(CASE WHEN attempt.skillType = 'speaking' THEN score.overallBand END)",
        "avgSpeakingScore"
      )
      .addSelect(
        "AVG(CASE WHEN attempt.skillType = 'writing' THEN score.overallBand END)",
        "avgWritingScore"
      )
      .where("attempt.learnerId = :learnerId", { learnerId })
      .getRawOne();

    return {
      totalAttempts: parseInt(stats.totalAttempts) || 0,
      speakingAttempts: parseInt(stats.speakingAttempts) || 0,
      writingAttempts: parseInt(stats.writingAttempts) || 0,
      avgOverallScore: stats.avgOverallScore ? parseFloat(stats.avgOverallScore) : undefined,
      avgSpeakingScore: stats.avgSpeakingScore ? parseFloat(stats.avgSpeakingScore) : undefined,
      avgWritingScore: stats.avgWritingScore ? parseFloat(stats.avgWritingScore) : undefined,
    };
  }

  private async getAverageScore(learnerId: string, skillType?: SkillType): Promise<number | null> {
    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoin("attempt.score", "score")
      .select("AVG(score.overallBand)", "avgScore")
      .where("attempt.learnerId = :learnerId", { learnerId });

    if (skillType) {
      queryBuilder.andWhere("attempt.skillType = :skillType", { skillType });
    }

    const result = await queryBuilder.getRawOne();
    return result.avgScore ? parseFloat(result.avgScore) : null;
  }

  private generateClassCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

