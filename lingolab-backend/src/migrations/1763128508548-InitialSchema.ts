import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1763128508548 implements MigrationInterface {
  name = "InitialSchema1763128508548";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "learner_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "targetBand" integer, "currentBand" integer, "nativeLanguage" character varying(100), "learningGoals" text, "user_id" uuid, CONSTRAINT "REL_94cd9a55d9923c7f859e683c05" UNIQUE ("user_id"), CONSTRAINT "PK_d5c5325dd0d1716cf414f357c08" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_learner_profile_user" ON "learner_profiles" ("userId") `
    );
    await queryRunner.query(
      `CREATE TABLE "prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdBy" uuid NOT NULL, "skillType" "public"."prompts_skilltype_enum" NOT NULL, "content" text NOT NULL, "difficulty" "public"."prompts_difficulty_enum" NOT NULL, "prepTime" integer NOT NULL, "responseTime" integer NOT NULL, "description" text, "followUpQuestions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_21f33798862975179e40b216a1d" PRIMARY KEY ("id")); COMMENT ON COLUMN "prompts"."prepTime" IS 'Prep time in seconds'; COMMENT ON COLUMN "prompts"."responseTime" IS 'Response time in seconds'`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prompts_created_by" ON "prompts" ("createdBy") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prompts_skill_difficulty" ON "prompts" ("skillType", "difficulty") `
    );
    await queryRunner.query(
      `CREATE TABLE "attempt_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "mediaType" "public"."attempt_media_mediatype_enum" NOT NULL DEFAULT 'audio', "storageUrl" character varying NOT NULL, "fileName" character varying NOT NULL, "duration" integer, "fileSize" integer, "mimeType" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, CONSTRAINT "PK_d6bf9fad610f7e242f2bf0da5ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "attempt_media"."duration" IS 'Duration in seconds'; COMMENT ON COLUMN "attempt_media"."fileSize" IS 'File size in bytes'`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attempt_media_uploaded" ON "attempt_media" ("uploaded_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attempt_media_attempt" ON "attempt_media" ("attemptId") `
    );
    await queryRunner.query(
      `CREATE TABLE "scoring_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "status" "public"."scoring_jobs_status_enum" NOT NULL DEFAULT 'queued', "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "attempt_id" uuid, CONSTRAINT "UQ_f605b43ce85cfaad8a6dbf689b3" UNIQUE ("attemptId"), CONSTRAINT "REL_6af39a731b99ae86ed03a4550d" UNIQUE ("attempt_id"), CONSTRAINT "PK_e3b6717033dc6e17d00d36c1c92" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scoring_jobs_status_created" ON "scoring_jobs" ("status", "created_at") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_scoring_job_attempt" ON "scoring_jobs" ("attemptId") `
    );
    await queryRunner.query(
      `CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "fluency" numeric(3,1) NOT NULL, "pronunciation" numeric(3,1) NOT NULL, "lexical" numeric(3,1) NOT NULL, "grammar" numeric(3,1) NOT NULL, "overallBand" integer NOT NULL, "feedback" text NOT NULL, "detailedFeedback" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, CONSTRAINT "UQ_9bb3327ba2158d5f20d18d37d32" UNIQUE ("attemptId"), CONSTRAINT "REL_1501560e1fc6e152afd8e1881a" UNIQUE ("attempt_id"), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_score_attempt" ON "scores" ("attemptId") `
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "authorId" uuid NOT NULL, "type" "public"."feedbacks_type_enum" NOT NULL, "content" text NOT NULL, "visibility" "public"."feedbacks_visibility_enum" NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, "author_id" uuid, CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_feedback_created" ON "feedbacks" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_feedback_author" ON "feedbacks" ("authorId") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_feedback_attempt" ON "feedbacks" ("attemptId") `
    );
    await queryRunner.query(
      `CREATE TABLE "attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "learnerId" uuid NOT NULL, "promptId" uuid NOT NULL, "skillType" "public"."attempts_skilltype_enum" NOT NULL, "status" "public"."attempts_status_enum" NOT NULL DEFAULT 'in_progress', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "scoredAt" TIMESTAMP, "learner_id" uuid, "prompt_id" uuid, CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attempts_status" ON "attempts" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attempts_prompt" ON "attempts" ("promptId") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attempts_learner_created" ON "attempts" ("learnerId", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'learner', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "uiLanguage" "public"."users_uilanguage_enum" NOT NULL DEFAULT 'en', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") `
    );
    await queryRunner.query(
      `ALTER TABLE "learner_profiles" ADD CONSTRAINT "FK_94cd9a55d9923c7f859e683c051" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "prompts" ADD CONSTRAINT "FK_9a04bfdad2b1ff887b21642d4ac" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_media" ADD CONSTRAINT "FK_6891b32ad13073f7f02bacbb3b8" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "scoring_jobs" ADD CONSTRAINT "FK_6af39a731b99ae86ed03a4550dd" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_1501560e1fc6e152afd8e1881a0" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_2785a9d33d19a003298fa266cfc" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_48ed6007e93242a15ccde375b8b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_54d258f1bb377045b5d9a478c4d" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_3422263266228194d1a0f6526f3" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_3422263266228194d1a0f6526f3"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_54d258f1bb377045b5d9a478c4d"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_48ed6007e93242a15ccde375b8b"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_2785a9d33d19a003298fa266cfc"`
    );
    await queryRunner.query(
      `ALTER TABLE "scores" DROP CONSTRAINT "FK_1501560e1fc6e152afd8e1881a0"`
    );
    await queryRunner.query(
      `ALTER TABLE "scoring_jobs" DROP CONSTRAINT "FK_6af39a731b99ae86ed03a4550dd"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_media" DROP CONSTRAINT "FK_6891b32ad13073f7f02bacbb3b8"`
    );
    await queryRunner.query(
      `ALTER TABLE "prompts" DROP CONSTRAINT "FK_9a04bfdad2b1ff887b21642d4ac"`
    );
    await queryRunner.query(
      `ALTER TABLE "learner_profiles" DROP CONSTRAINT "FK_94cd9a55d9923c7f859e683c051"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_attempts_learner_created"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_attempts_prompt"`);
    await queryRunner.query(`DROP INDEX "public"."idx_attempts_status"`);
    await queryRunner.query(`DROP TABLE "attempts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_feedback_attempt"`);
    await queryRunner.query(`DROP INDEX "public"."idx_feedback_author"`);
    await queryRunner.query(`DROP INDEX "public"."idx_feedback_created"`);
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(`DROP INDEX "public"."idx_score_attempt"`);
    await queryRunner.query(`DROP TABLE "scores"`);
    await queryRunner.query(`DROP INDEX "public"."idx_scoring_job_attempt"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_scoring_jobs_status_created"`
    );
    await queryRunner.query(`DROP TABLE "scoring_jobs"`);
    await queryRunner.query(`DROP INDEX "public"."idx_attempt_media_attempt"`);
    await queryRunner.query(`DROP INDEX "public"."idx_attempt_media_uploaded"`);
    await queryRunner.query(`DROP TABLE "attempt_media"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_prompts_skill_difficulty"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_prompts_created_by"`);
    await queryRunner.query(`DROP TABLE "prompts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_learner_profile_user"`);
    await queryRunner.query(`DROP TABLE "learner_profiles"`);
  }
}
