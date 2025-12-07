import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';

/**
 * Represents pagination metadata for list responses.
 */
export interface IPaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total items count */
  total: number;
  /** Total pages count */
  pages: number;
}

/**
 * Generic paginated response wrapper.
 */
export interface IPaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  meta: IPaginationMeta;
}

/**
 * Base abstract service providing common CRUD and utility methods.
 * Implements generic repository pattern with type safety.
 * Follows SOLID principles for extensibility and maintainability.
 *
 * @template T The entity type this service manages
 * @example
 * ```typescript
 * class UserService extends BaseService<User> {
 *   constructor(private readonly userRepository: Repository<User>) {
 *     super(userRepository);
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  /**
   * Creates a new instance of BaseService.
   *
   * @param repository The TypeORM repository instance
   */
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Creates a new entity record.
   *
   * @param data Partial entity data for creation
   * @returns Promise resolving to created entity
   * @throws Error if creation fails
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity);
  }

  /**
   * Finds all entities with optional filtering and pagination.
   *
   * @param where Optional filter conditions
   * @param order Optional sort order
   * @param skip Number of records to skip (for pagination)
   * @param take Number of records to take (for pagination)
   * @returns Promise resolving to array of entities
   */
  async findAll(
    where?: FindOptionsWhere<T>,
    order?: FindOptionsOrder<T>,
    skip?: number,
    take?: number,
  ): Promise<T[]> {
    return this.repository.find({
      where,
      order,
      skip,
      take,
    });
  }

  /**
   * Finds a single entity by filter conditions.
   *
   * @param where Filter conditions
   * @returns Promise resolving to entity or null if not found
   */
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  /**
   * Finds an entity by ID.
   *
   * @param id Entity ID
   * @returns Promise resolving to entity or null if not found
   */
  async findById(id: unknown): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  /**
   * Updates an entity.
   *
   * @param id Entity ID to update
   * @param data Partial data to update
   * @returns Promise resolving to updated entity
   */
  async update(id: unknown, data: Partial<T>): Promise<T> {
    await this.repository.update(id, data as any);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Entity not found after update');
    }
    return updated;
  }

  /**
   * Deletes an entity.
   *
   * @param id Entity ID to delete
   * @returns Promise resolving to deletion result
   */
  async delete(id: unknown) {
    return this.repository.delete(id);
  }

  /**
   * Counts total entities matching filter conditions.
   *
   * @param where Optional filter conditions
   * @returns Promise resolving to count
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * Checks if an entity exists matching filter conditions.
   *
   * @param where Filter conditions
   * @returns Promise resolving to boolean existence flag
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Retrieves paginated entities with total count.
   *
   * @param page Current page (1-indexed)
   * @param limit Items per page
   * @param where Optional filter conditions
   * @param order Optional sort order
   * @returns Promise resolving to paginated response
   */
  async paginate(
    page: number,
    limit: number,
    where?: FindOptionsWhere<T>,
    order?: FindOptionsOrder<T>,
  ): Promise<IPaginatedResponse<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repository.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  /**
   * Saves entity or partial entities.
   *
   * @param entity Entity or array of entities to save
   * @returns Promise resolving to saved entity/entities
   */
  async save(entity: T | T[]): Promise<T | T[]> {
    return this.repository.save(entity);
  }

  /**
   * Executes raw database query.
   *
   * @param query SQL query string
   * @param parameters Optional query parameters
   * @returns Promise resolving to query result
   */
  async query(query: string, parameters?: any[]): Promise<any[]> {
    return this.repository.query(query, parameters);
  }
}


