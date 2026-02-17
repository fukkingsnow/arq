import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

/**
 * RefreshToken Entity - Stores JWT refresh tokens for user authentication
 * Enables token rotation and session management
 */
@Entity('refresh_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'text', nullable: true })
  deviceId: string;

  @Column({ type: 'varchar', length: 100 })
  userAgent: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'bigint' })
  expiresAt: number;

  @Column({ type: 'bigint' })
  issuedAt: number;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ type: 'text', nullable: true })
  revokedAt: string;

  @Column({ type: 'text', nullable: true })
  revokedReason: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
