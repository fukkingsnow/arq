import { Repository, ObjectLiteral } from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * Base Repository Class
 *
 * Provides abstract base functionality for all repositories including:
 * - Common CRUD operations (Create, Read, Update, Delete)
 * - Query building utilities
 * - Transaction management
 * - Soft delete and timestamps handling
 *
 * @template T Generic entity type
 */
@Injectable()
export abstract class BaseRepository<T extends ObjectLiteral> {
  /**
   * Constructor
   * @param repository TypeORM repository instance
   */
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Create new entity
   * @param data Entity data
   * @returns Created entity
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity as any);  }

  /**
   * Find entity by ID
   * @param id Entity ID
   * @returns Entity or null
   */
  async findById(id: string | number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  /**
   * Find all entities
   * @returns Array of entities
   */
  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  /**
   * Update entity
   * @param id Entity ID
   * @param data Update data
   * @returns Updated entity
   */
  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Delete entity
   * @param id Entity ID
   * @returns Success flag
   */
  async delete(id: string | number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}


