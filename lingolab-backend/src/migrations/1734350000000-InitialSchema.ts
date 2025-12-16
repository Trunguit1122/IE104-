import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial Schema Migration - LingoLab IELTS Platform
 * 
 * This migration creates all tables from scratch matching the current entities.
 * Run: npm run migration:run
 */
export class InitialSchema1734350000000 implements MigrationInterface {
    name = 'InitialSchema1734350000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // =================================================================
        // 1. CREATE ENUM TYPES
        // =================================================================
        
        // User enums
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'teacher', 'learner')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('pending_verify', 'active', 'locked')`);
        await queryRunner.query(`CREATE TYPE "public"."users_uilanguage_enum" AS ENUM('en', 'vi')`);
        
        // Prompt enums
        await queryRunner.query(`CREATE TYPE "public"."prompts_skilltype_enum" AS ENUM('speaking', 'writing')`);
        await queryRunner.query(`CREATE TYPE "public"."prompts_difficulty_enum" AS ENUM('easy', 'medium', 'hard')`);
        await queryRunner.query(`CREATE TYPE "public"."prompts_writingtasktype_enum" AS ENUM('task_1', 'task_2')`);
        
        // Attempt enums
        await queryRunner.query(`CREATE TYPE "public"."attempts_status_enum" AS ENUM('in_progress', 'submitted', 'processing', 'scored', 'evaluated_by_teacher', 'failed')`);
        
        // AttemptMedia enum
        await queryRunner.query(`CREATE TYPE "public"."attempt_media_mediatype_enum" AS ENUM('audio', 'video')`);
        
        // ScoringJob enum
        await queryRunner.query(`CREATE TYPE "public"."scoring_jobs_status_enum" AS ENUM('queued', 'processing', 'completed', 'failed')`);
        
        // Feedback enums
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_type_enum" AS ENUM('ai_generated', 'teacher_comment')`);
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_visibility_enum" AS ENUM('private_to_teacher', 'teacher_and_learner')`);
        
        // AuditLog enum
        await queryRunner.query(`
            CREATE TYPE "public"."audit_logs_action_enum" AS ENUM(
                'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
                'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'PASSWORD_CHANGE',
                'EMAIL_VERIFICATION', 'ACCOUNT_LOCKED',
                'PROFILE_UPDATE', 'AVATAR_UPLOAD',
                'ATTEMPT_START', 'ATTEMPT_SUBMIT', 'ATTEMPT_SCORED',
                'TEACHER_EVALUATION', 'REPORT_EXPORT',
                'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_LOCK', 'USER_UNLOCK'
            )
        `);

        // =================================================================
        // 2. CREATE TABLES
        // =================================================================

        // Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password" character varying NOT NULL,
                "displayName" character varying(50),
                "avatarUrl" character varying(500),
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'learner',
                "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending_verify',
                "uiLanguage" "public"."users_uilanguage_enum" NOT NULL DEFAULT 'en',
                "emailVerified" boolean NOT NULL DEFAULT false,
                "verificationToken" character varying(255),
                "verificationTokenExpiry" TIMESTAMP,
                "passwordResetToken" character varying(255),
                "passwordResetExpiry" TIMESTAMP,
                "failedLoginAttempts" integer NOT NULL DEFAULT 0,
                "lastFailedLoginAt" TIMESTAMP,
                "lockoutUntil" TIMESTAMP,
                "refreshToken" character varying(500),
                "refreshTokenExpiry" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "lastLoginAt" TIMESTAMP,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "idx_user_verification_token" ON "users" ("verificationToken")`);
        await queryRunner.query(`CREATE INDEX "idx_user_reset_token" ON "users" ("passwordResetToken")`);

        // Topics table
        await queryRunner.query(`
            CREATE TABLE "topics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "icon" character varying(50),
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_topics_name" UNIQUE ("name"),
                CONSTRAINT "PK_topics" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_topic_name" ON "topics" ("name")`);

        // Learner Profiles table
        await queryRunner.query(`
            CREATE TABLE "learner_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "firstName" character varying(100),
                "lastName" character varying(100),
                "targetBand" integer,
                "currentBand" integer,
                "nativeLanguage" character varying(100),
                "learningGoals" text,
                "user_id" uuid,
                CONSTRAINT "UQ_learner_profiles_user" UNIQUE ("user_id"),
                CONSTRAINT "PK_learner_profiles" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_learner_profile_user" ON "learner_profiles" ("userId")`);

        // Prompts table
        await queryRunner.query(`
            CREATE TABLE "prompts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdBy" uuid NOT NULL,
                "topic_id" uuid,
                "skillType" "public"."prompts_skilltype_enum" NOT NULL,
                "content" text NOT NULL,
                "difficulty" "public"."prompts_difficulty_enum" NOT NULL,
                "prepTime" integer NOT NULL,
                "responseTime" integer NOT NULL,
                "description" text,
                "followUpQuestions" text,
                "writingTaskType" "public"."prompts_writingtasktype_enum",
                "minWordCount" integer,
                "maxWordCount" integer,
                "isActive" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" uuid,
                CONSTRAINT "PK_prompts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_prompts_created_by" ON "prompts" ("createdBy")`);
        await queryRunner.query(`CREATE INDEX "idx_prompts_skill_difficulty" ON "prompts" ("skillType", "difficulty")`);
        await queryRunner.query(`CREATE INDEX "idx_prompts_topic" ON "prompts" ("topic_id")`);
        await queryRunner.query(`CREATE INDEX "idx_prompts_active" ON "prompts" ("isActive")`);
        await queryRunner.query(`COMMENT ON COLUMN "prompts"."prepTime" IS 'Prep time in seconds'`);
        await queryRunner.query(`COMMENT ON COLUMN "prompts"."responseTime" IS 'Response time in seconds'`);
        await queryRunner.query(`COMMENT ON COLUMN "prompts"."minWordCount" IS 'Minimum word count for writing'`);
        await queryRunner.query(`COMMENT ON COLUMN "prompts"."maxWordCount" IS 'Maximum word count for writing'`);

        // Attempts table
        await queryRunner.query(`
            CREATE TABLE "attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "learnerId" uuid NOT NULL,
                "promptId" uuid NOT NULL,
                "skillType" "public"."prompts_skilltype_enum" NOT NULL,
                "status" "public"."attempts_status_enum" NOT NULL DEFAULT 'in_progress',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "startedAt" TIMESTAMP,
                "submittedAt" TIMESTAMP,
                "scoredAt" TIMESTAMP,
                "writingContent" text,
                "wordCount" integer NOT NULL DEFAULT 0,
                "lastAutoSavedAt" TIMESTAMP,
                "teacherScore" numeric(3,1),
                "teacherComment" text,
                "evaluatedBy" uuid,
                "evaluatedAt" TIMESTAMP,
                "learner_id" uuid,
                "prompt_id" uuid,
                CONSTRAINT "PK_attempts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_attempts_learner_created" ON "attempts" ("learnerId", "created_at")`);
        await queryRunner.query(`CREATE INDEX "idx_attempts_prompt" ON "attempts" ("promptId")`);
        await queryRunner.query(`CREATE INDEX "idx_attempts_status" ON "attempts" ("status")`);

        // Attempt Media table
        await queryRunner.query(`
            CREATE TABLE "attempt_media" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "attemptId" uuid NOT NULL,
                "mediaType" "public"."attempt_media_mediatype_enum" NOT NULL DEFAULT 'audio',
                "storageUrl" character varying NOT NULL,
                "fileName" character varying NOT NULL,
                "duration" integer,
                "fileSize" integer,
                "mimeType" character varying,
                "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_attempt_media" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_attempt_media_attempt" ON "attempt_media" ("attemptId")`);
        await queryRunner.query(`CREATE INDEX "idx_attempt_media_uploaded" ON "attempt_media" ("uploaded_at")`);
        await queryRunner.query(`COMMENT ON COLUMN "attempt_media"."duration" IS 'Duration in seconds'`);
        await queryRunner.query(`COMMENT ON COLUMN "attempt_media"."fileSize" IS 'File size in bytes'`);

        // Scoring Jobs table
        await queryRunner.query(`
            CREATE TABLE "scoring_jobs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "attempt_id" uuid NOT NULL,
                "status" "public"."scoring_jobs_status_enum" NOT NULL DEFAULT 'queued',
                "errorMessage" text,
                "retryCount" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                CONSTRAINT "UQ_scoring_jobs_attempt" UNIQUE ("attempt_id"),
                CONSTRAINT "PK_scoring_jobs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_scoring_job_attempt" ON "scoring_jobs" ("attempt_id")`);
        await queryRunner.query(`CREATE INDEX "idx_scoring_jobs_status_created" ON "scoring_jobs" ("status", "created_at")`);

        // Scores table
        await queryRunner.query(`
            CREATE TABLE "scores" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "attemptId" uuid NOT NULL,
                "skillType" "public"."prompts_skilltype_enum" NOT NULL,
                "overallBand" numeric(3,1) NOT NULL,
                "fluencyCoherence" numeric(3,1),
                "pronunciation" numeric(3,1),
                "taskAchievement" numeric(3,1),
                "coherenceCohesion" numeric(3,1),
                "lexicalResource" numeric(3,1) NOT NULL,
                "grammaticalRange" numeric(3,1) NOT NULL,
                "confidence" numeric(4,3),
                "feedback" text NOT NULL,
                "detailedFeedback" jsonb,
                "rawAIResponse" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_scores_attempt" UNIQUE ("attemptId"),
                CONSTRAINT "PK_scores" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_score_attempt" ON "scores" ("attemptId")`);

        // Feedbacks table
        await queryRunner.query(`
            CREATE TABLE "feedbacks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "attemptId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "type" "public"."feedbacks_type_enum" NOT NULL,
                "content" text NOT NULL,
                "visibility" "public"."feedbacks_visibility_enum" NOT NULL,
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "attempt_id" uuid,
                "author_id" uuid,
                CONSTRAINT "PK_feedbacks" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_feedback_attempt" ON "feedbacks" ("attemptId")`);
        await queryRunner.query(`CREATE INDEX "idx_feedback_author" ON "feedbacks" ("authorId")`);
        await queryRunner.query(`CREATE INDEX "idx_feedback_created" ON "feedbacks" ("created_at")`);

        // Classes table
        await queryRunner.query(`
            CREATE TABLE "classes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "teacherId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "code" character varying(50),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "teacher_id" uuid,
                CONSTRAINT "UQ_classes_code" UNIQUE ("code"),
                CONSTRAINT "PK_classes" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_class_code" ON "classes" ("code") WHERE code IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_class_teacher" ON "classes" ("teacherId")`);

        // Class Learners junction table
        await queryRunner.query(`
            CREATE TABLE "class_learners" (
                "class_id" uuid NOT NULL,
                "learner_id" uuid NOT NULL,
                CONSTRAINT "PK_class_learners" PRIMARY KEY ("class_id", "learner_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_class_learners_class" ON "class_learners" ("class_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_class_learners_learner" ON "class_learners" ("learner_id")`);

        // Audit Logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "action" "public"."audit_logs_action_enum" NOT NULL,
                "entityType" character varying(50),
                "entityId" uuid,
                "ipAddress" character varying(45),
                "userAgent" text,
                "metadata" jsonb,
                "success" boolean NOT NULL DEFAULT true,
                "errorMessage" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId_createdAt" ON "audit_logs" ("userId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action_createdAt" ON "audit_logs" ("action", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_ipAddress_createdAt" ON "audit_logs" ("ipAddress", "createdAt")`);

        // =================================================================
        // 3. ADD FOREIGN KEY CONSTRAINTS
        // =================================================================

        // Learner Profiles -> Users
        await queryRunner.query(`
            ALTER TABLE "learner_profiles" 
            ADD CONSTRAINT "FK_learner_profiles_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Prompts -> Users (creator)
        await queryRunner.query(`
            ALTER TABLE "prompts" 
            ADD CONSTRAINT "FK_prompts_creator" 
            FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
        `);

        // Prompts -> Topics
        await queryRunner.query(`
            ALTER TABLE "prompts" 
            ADD CONSTRAINT "FK_prompts_topic" 
            FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL
        `);

        // Attempts -> Users (learner)
        await queryRunner.query(`
            ALTER TABLE "attempts" 
            ADD CONSTRAINT "FK_attempts_learner" 
            FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Attempts -> Prompts
        await queryRunner.query(`
            ALTER TABLE "attempts" 
            ADD CONSTRAINT "FK_attempts_prompt" 
            FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE NO ACTION
        `);

        // Attempt Media -> Attempts
        await queryRunner.query(`
            ALTER TABLE "attempt_media" 
            ADD CONSTRAINT "FK_attempt_media_attempt" 
            FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE
        `);

        // Scoring Jobs -> Attempts
        await queryRunner.query(`
            ALTER TABLE "scoring_jobs" 
            ADD CONSTRAINT "FK_scoring_jobs_attempt" 
            FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE
        `);

        // Scores -> Attempts
        await queryRunner.query(`
            ALTER TABLE "scores" 
            ADD CONSTRAINT "FK_scores_attempt" 
            FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE
        `);

        // Feedbacks -> Attempts
        await queryRunner.query(`
            ALTER TABLE "feedbacks" 
            ADD CONSTRAINT "FK_feedbacks_attempt" 
            FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE
        `);

        // Feedbacks -> Users (author)
        await queryRunner.query(`
            ALTER TABLE "feedbacks" 
            ADD CONSTRAINT "FK_feedbacks_author" 
            FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION
        `);

        // Classes -> Users (teacher)
        await queryRunner.query(`
            ALTER TABLE "classes" 
            ADD CONSTRAINT "FK_classes_teacher" 
            FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Class Learners -> Classes
        await queryRunner.query(`
            ALTER TABLE "class_learners" 
            ADD CONSTRAINT "FK_class_learners_class" 
            FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        // Class Learners -> Users (learner)
        await queryRunner.query(`
            ALTER TABLE "class_learners" 
            ADD CONSTRAINT "FK_class_learners_learner" 
            FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        // Audit Logs -> Users
        await queryRunner.query(`
            ALTER TABLE "audit_logs" 
            ADD CONSTRAINT "FK_audit_logs_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        console.log('✅ Initial schema migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "FK_audit_logs_user"`);
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT IF EXISTS "FK_class_learners_learner"`);
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT IF EXISTS "FK_class_learners_class"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "FK_classes_teacher"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT IF EXISTS "FK_feedbacks_author"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT IF EXISTS "FK_feedbacks_attempt"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT IF EXISTS "FK_scores_attempt"`);
        await queryRunner.query(`ALTER TABLE "scoring_jobs" DROP CONSTRAINT IF EXISTS "FK_scoring_jobs_attempt"`);
        await queryRunner.query(`ALTER TABLE "attempt_media" DROP CONSTRAINT IF EXISTS "FK_attempt_media_attempt"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT IF EXISTS "FK_attempts_prompt"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT IF EXISTS "FK_attempts_learner"`);
        await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT IF EXISTS "FK_prompts_topic"`);
        await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT IF EXISTS "FK_prompts_creator"`);
        await queryRunner.query(`ALTER TABLE "learner_profiles" DROP CONSTRAINT IF EXISTS "FK_learner_profiles_user"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "class_learners"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "classes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "feedbacks"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "scores"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "scoring_jobs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "attempt_media"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "attempts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "prompts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "topics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "learner_profiles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."feedbacks_visibility_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."feedbacks_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."scoring_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."attempt_media_mediatype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."attempts_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."prompts_writingtasktype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."prompts_difficulty_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."prompts_skilltype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_uilanguage_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);

        console.log('✅ Schema dropped successfully');
    }
}
