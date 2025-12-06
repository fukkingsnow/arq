import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { MemoryContext } from '../../memory/entities/memory-context.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * User Entity - Core identity and authentication model
 * Phase 21: User management for AI Assistant Backend
 * Features: Auth support, roles, activity tracking
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true, nullable: false })
  email: string;

  @Column('varchar', { length: 100, unique: true, nullable: false })
  username: string;

  @Column('varchar', { length: 255, nullable: false })
  passwordHash: string;

  @Column('varchar', { length: 100, nullable: true })
  firstName?: string;

  @Column('varchar', { length: 100, nullable: true })
  lastName?: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('enum', { enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column('timestamp', { nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Conversation, (conversation) => conversation.user, {
    lazy: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  conversations: Conversation[];

  @OneToMany(() => MemoryContext, (memory) => memory.user, {
    lazy: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  memories: MemoryContext[];

  // Methods
  /**
   * Update last login timestamp
   * Call this on successful authentication
   */
  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  /**
   * Get display name
   * Falls back to username if first/last name not set
   */
  getDisplayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.firstName) {
      return this.firstName;
    }
    return this.username;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user is active
   */
  isUserActive(): boolean {
    return this.isActive;
  }

  /**
   * Convert to public DTO (exclude sensitive fields)
   */
  toPublicDTO() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      displayName: this.getDisplayName(),
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
