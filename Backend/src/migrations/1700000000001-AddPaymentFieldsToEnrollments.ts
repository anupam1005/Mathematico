import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFieldsToEnrollments1700000000001 implements MigrationInterface {
    name = 'AddPaymentFieldsToEnrollments1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new payment-related columns to enrollments table
        await queryRunner.query(`
            ALTER TABLE \`enrollments\` 
            ADD COLUMN \`amount\` DECIMAL(10,2) NULL AFTER \`amount_paid\`,
            ADD COLUMN \`order_id\` VARCHAR(255) NULL AFTER \`payment_id\`,
            ADD COLUMN \`payment_method\` VARCHAR(50) NULL AFTER \`order_id\`
        `);

        // Update payment_status enum to include 'completed'
        await queryRunner.query(`
            ALTER TABLE \`enrollments\` 
            MODIFY COLUMN \`payment_status\` ENUM('pending', 'paid', 'completed', 'refunded', 'failed') 
            DEFAULT 'pending'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added columns
        await queryRunner.query(`
            ALTER TABLE \`enrollments\` 
            DROP COLUMN \`amount\`,
            DROP COLUMN \`order_id\`,
            DROP COLUMN \`payment_method\`
        `);

        // Revert payment_status enum
        await queryRunner.query(`
            ALTER TABLE \`enrollments\` 
            MODIFY COLUMN \`payment_status\` ENUM('pending', 'paid', 'refunded', 'failed') 
            DEFAULT 'pending'
        `);
    }
}
