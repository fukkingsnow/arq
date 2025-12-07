import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsWhere, FindOptionsOrder, ObjectLiteral } from 'typeorm';

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
 *   TypeScript
 *   class UserService extends BaseService<User> {
 *     constructor(private readonly userRepository: Repository<User>) {
 *       super(userRepository);
 *     }
 *   }
 */
@Injectable()
export class BaseService<T extends ObjectLiteral> {
  /**
   * Constructs the BaseService with a repository instance.
   * @param repository The TypeORM repository for entity operations
   */
  constructor(private readonly repository: Repository<T>) {}

  /**
   * Creates and persists a new entity.
   * @param data Partial entity data
   * @returns Promise resolving to the created entity
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity as any);
  }

  /**
   * Retrieves all entities with optional filtering, ordering, and pagination.
   */
  async findAll(
    where?: FindOptionsWhere<T>,
    order?: FindOptionsOrder<T>,
    skip?: number,
    take?: number,
  ): Promise<[T[], number]> {
    return this.repository.findAndCount({
      where,
      order,
      skip,
      take,
    });
  }

  /**
   * Finds a single entity by where conditions.
   */
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  /**
   * Updates an entity by ID.
   */
  async update(id: any, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.repository.findOneBy({ id } as any);
  }

  /**
   * Removes an entity by ID.
   */
  async remove(id: any): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Counts total entities matching where conditions.
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }
}
