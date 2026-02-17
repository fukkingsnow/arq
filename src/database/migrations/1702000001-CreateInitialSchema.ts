import { Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Phase 21 - Initial Database Schema Migration
 * Creates core tables for AI Assistant Backend:
 * - users: User accounts with authentication data
 * - conversations: Chat conversation sessions
 * - messages: Individual messages in conversations
 * - memory_contexts: Long-term memory storage
 * - audit_logs: Security and compliance logging
 */

export class CreateInitialSchema1702000001 {
  public async up(queryRunner: any): Promise<void> {
    // USERS TABLE
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user', 'guest'],
            default: "'user'",
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // INDEX on email and username for fast auth
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        columnNames: ['email'],
      })
    );
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        columnNames: ['username'],
      })
    );

    // CONVERSATIONS TABLE
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'context_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Conversation context and settings',
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        columnNames: ['user_id', 'created_at'],
      })
    );

    // MESSAGES TABLE
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sender_type',
            type: 'enum',
            enum: ['user', 'assistant'],
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'tokens_used',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        columnNames: ['conversation_id', 'created_at'],
      })
    );

    // MEMORY_CONTEXTS TABLE - Long-term memory
    await queryRunner.createTable(
      new Table({
        name: 'memory_contexts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'importance_score',
            type: 'float',
            default: 0.5,
          },
          {
            name: 'access_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'last_accessed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'memory_contexts',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'memory_contexts',
      new TableIndex({
        columnNames: ['user_id', 'key'],
        isUnique: true,
      })
    );

    // AUDIT_LOGS TABLE - Security & Compliance
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'actor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['success', 'failure'],
            default: "'success'",
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['actor_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['resource_type', 'resource_id'],
      })
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: any): Promise<void> {
    // Drop tables in reverse order to respect FK constraints
    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('memory_contexts');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversations');
    await queryRunner.dropTable('users');
  }
}
