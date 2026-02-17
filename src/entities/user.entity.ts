import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique, OneToMany } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

/**
 * User entity for authentication and profile management
 * Represents a user account in the ARQ system
 */
@Entity('users')
@Index(['email'])
@Unique(['email'])
export class User {
  /**
   * Unique user identifier (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique username for login
   * @example 'john_doe'
   */
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username?: string;


  /**
   * User email address (unique)
   * @example 'user@example.com'
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * Hashed password (bcrypt)
   * @example '$2b$10$N9qo8uLOickgx2ZMRZoMye'
   */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /**
   * User full name
   * @example 'John Doe'
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName?: string;

    /**
   * User first name
   * @example 'John'
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

    /**
   * User last name
   * @example 'Doe'
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  /**
   * Password hash (alias for password field)
   * @example '$2b$10$N9qo8uLOickgx2ZMRZoMye'
   */
  get passwordHash(): string {
    return this.password;
  }

  set passwordHash(value: string) {
    this.password = value;
  }

  /**
   * User role (admin, user, moderator)
   * @default 'user'
   */
  @Column({ type: 'enum', enum: ['admin', 'user', 'moderator'], default: 'user' })
  role: 'admin' | 'user' | 'moderator';

  /**
   * User permissions array (JSON)
   * @example ["read:browser", "write:browser"]
   */
  @Column({ type: 'simple-array', nullable: true })
  permissions?: string[];

  /**
   * Account status
   * @default 'active'
   */
  @Column({ type: 'enum', enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

    /**
   * Account is active (computed from status)
   * @returns true if status is 'active'
   */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Email verification status
   * @default false
   */
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

    /**
   * Refresh tokens associated with this user
   */
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  /**
   * Last login timestamp
   */
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  /**
   * Account creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Account last update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;
}

