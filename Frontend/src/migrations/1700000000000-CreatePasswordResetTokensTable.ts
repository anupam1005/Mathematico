import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePasswordResetTokensTable1700000000000 implements MigrationInterface {
  name = 'CreatePasswordResetTokensTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid()',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_PASSWORD_RESET_TOKEN',
            columnNames: ['token'],
            isUnique: true,
          },
          {
            name: 'IDX_PASSWORD_RESET_USER_ID',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_PASSWORD_RESET_EXPIRES_AT',
            columnNames: ['expires_at'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}
