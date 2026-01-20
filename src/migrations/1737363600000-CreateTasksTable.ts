export class CreateTasksTable1737363600000 {
  public async up(queryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        due_date VARCHAR,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
  }

  public async down(queryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS tasks');
  }
}
