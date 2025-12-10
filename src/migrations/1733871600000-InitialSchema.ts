import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1733871600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password_hash', type: 'varchar' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // auth_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'auth_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'token', type: 'text', isUnique: true },
          { name: 'expires_at', type: 'timestamp' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'token', type: 'text', isUnique: true },
          { name: 'expires_at', type: 'timestamp' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // browser_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'browser_sessions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'user_agent', type: 'varchar' },
          { name: 'ip_address', type: 'varchar' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // browser_tabs table
    await queryRunner.createTable(
      new Table({
        name: 'browser_tabs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'session_id', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'url', type: 'varchar' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['session_id'],
            referencedTableName: 'browser_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('browser_tabs', true);
    await queryRunner.dropTable('browser_sessions', true);
    await queryRunner.dropTable('refresh_tokens', true);
    await queryRunner.dropTable('auth_tokens', true);
    await queryRunner.dropTable('users', true);
  }
}
