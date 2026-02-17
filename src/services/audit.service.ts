import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from '../entities';

/**
 * AuditService - Logs system operations for compliance and security
 * Maintains immutable audit trail for all actions
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Log audit entry
   * @param data Audit log data
   */
  async log(data: any) {
    const entry = this.auditRepo.create(data);
    return await this.auditRepo.save(entry);
  }

  /**
   * Get audit logs for entity
   * @param entityType Entity type
   * @param entityId Entity ID
   */
  async getEntityAudit(entityType: string, entityId: string) {
    return await this.auditRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get user activity logs
   * @param userId User ID
   * @param limit Result limit
   */
  async getUserActivity(userId: string, limit = 50) {
    return await this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get failed operations
   */
  async getFailedOperations() {
    return await this.auditRepo.find({
      where: { status: 'failed' },
      order: { createdAt: 'DESC' },
    });
  }
}
