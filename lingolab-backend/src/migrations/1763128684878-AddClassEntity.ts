import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClassEntity1763128684878 implements MigrationInterface {
    name = 'AddClassEntity1763128684878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teacherId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "code" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "teacher_id" uuid, CONSTRAINT "UQ_cf7491878e0fca8599438629988" UNIQUE ("code"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_class_code" ON "classes" ("code") WHERE code IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_class_teacher" ON "classes" ("teacherId") `);
        await queryRunner.query(`CREATE TABLE "class_learners" ("class_id" uuid NOT NULL, "learner_id" uuid NOT NULL, CONSTRAINT "PK_8d4cfd7316995490d10bffe9532" PRIMARY KEY ("class_id", "learner_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bbe804255b33738b3bcaaa4697" ON "class_learners" ("class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a195adb5a3972b39c3991badd0" ON "class_learners" ("learner_id") `);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_bbe804255b33738b3bcaaa46976" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_a195adb5a3972b39c3991badd0e" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_a195adb5a3972b39c3991badd0e"`);
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_bbe804255b33738b3bcaaa46976"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a195adb5a3972b39c3991badd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbe804255b33738b3bcaaa4697"`);
        await queryRunner.query(`DROP TABLE "class_learners"`);
        await queryRunner.query(`DROP INDEX "public"."idx_class_teacher"`);
        await queryRunner.query(`DROP INDEX "public"."idx_class_code"`);
        await queryRunner.query(`DROP TABLE "classes"`);
    }

}
