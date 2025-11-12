import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditPasswordEvents1734567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_password_events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'eventId',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'occurredAt',
            type: 'datetime',
          },
          {
            name: 'payload',
            type: 'text',
          },
          {
            name: 'receivedAt',
            type: 'datetime',
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: 'error',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índice único en eventId para idempotencia
    await queryRunner.createIndex(
      'audit_password_events',
      new TableIndex({
        name: 'IDX_audit_password_events_eventId',
        columnNames: ['eventId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_password_events');
  }
}

