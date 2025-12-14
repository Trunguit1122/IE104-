import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogEntity1763128900000 implements MigrationInterface {
    name = 'AddAuditLogEntity1763128900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for audit actions
        await queryRunner.query(`
            CREATE TYPE "public"."audit_logs_action_enum" AS ENUM(
                'LOGIN_SUCCESS',
                'LOGIN_FAILED',
                'LOGOUT',
                'PASSWORD_RESET_REQUEST',
                'PASSWORD_RESET_SUCCESS',
                'PASSWORD_CHANGE',
                'EMAIL_VERIFICATION',
                'ACCOUNT_LOCKED',
                'PROFILE_UPDATE',
                'AVATAR_UPLOAD',
                'ATTEMPT_START',
                'ATTEMPT_SUBMIT',
                'ATTEMPT_SCORED',
                'TEACHER_EVALUATION',
                'REPORT_EXPORT',
                'USER_CREATE',
                'USER_UPDATE',
                'USER_DELETE',
                'USER_LOCK',
                'USER_UNLOCK'
            )
        `);

        // Create audit_logs table
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
                CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for efficient querying
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId_createdAt" ON "audit_logs" ("userId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action_createdAt" ON "audit_logs" ("action", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_ipAddress_createdAt" ON "audit_logs" ("ipAddress", "createdAt")`);

        // Add foreign key constraint to users table
        await queryRunner.query(`
            ALTER TABLE "audit_logs" 
            ADD CONSTRAINT "FK_audit_logs_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_userId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_ipAddress_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_userId_createdAt"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "audit_logs"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    }
}



